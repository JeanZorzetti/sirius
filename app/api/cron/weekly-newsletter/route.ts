/**
 * Weekly Newsletter Cron Job
 *
 * ✅ FASE 14: Envia resumo semanal de atividades para usuários de planos pagos
 *
 * - Roda toda segunda-feira às 09:00 BRT (12:00 UTC)
 * - Destinatários: usuários de orgs PRO/BUSINESS com atividade na semana
 * - Conteúdo: stats da semana (novos deals, ganhos, perdidos, contatos) + dica de vendas
 *
 * Configuração Vercel Cron: schedule "0 12 * * 1" (toda segunda às 12:00 UTC)
 *
 * Teste manual:
 * GET /api/cron/weekly-newsletter?token=SEU_CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { WeeklyNewsletter } from '@/emails/templates/weekly-newsletter'
import logger from '@/lib/logger'

export const runtime = 'nodejs'
export const maxDuration = 300

// Dicas de vendas rotativas
const SALES_TIPS = [
  {
    title: 'Use o histórico de notas para personalizar seu contato',
    body: 'Antes de ligar para um cliente, revise as notas anteriores. Uma referência específica ("Como foi a reunião com seu board?") aumenta a conexão e a probabilidade de fechamento.',
  },
  {
    title: 'Pipeline limpo, mente clara',
    body: 'Reserve 15 minutos toda segunda-feira para arquivar negócios sem atividade há mais de 30 dias. Um pipeline enxuto melhora sua visibilidade e foco nos deals que realmente importam.',
  },
  {
    title: 'Registre sempre o motivo de perda',
    body: 'Ao perder um negócio, nunca pule o campo "motivo". Com 10 perdas registradas, você terá dados para ajustar seu pitch, preço ou abordagem de forma baseada em evidências.',
  },
  {
    title: 'Follow-up no timing certo',
    body: 'Estudos mostram que o segundo contato aumenta a taxa de resposta em 21%. Use os alertas automáticos do Sirius para nunca deixar um negócio sem resposta por mais de 3 dias.',
  },
  {
    title: 'Segmente por valor para priorizar energia',
    body: 'Filtre seus deals pelo valor potencial e dedique 60% do seu tempo nos 20% mais valiosos. Use a visão Kanban do Sirius para identificar rapidamente onde está o maior impacto.',
  },
]

export async function GET(request: NextRequest) {
  try {
    // Validar cron secret
    const authHeader = request.headers.get('authorization')
    const urlToken = request.nextUrl.searchParams.get('token')
    const cronSecret = process.env.CRON_SECRET

    const isValidToken =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronSecret && urlToken === cronSecret)

    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing CRON_SECRET' },
        { status: 401 }
      )
    }

    logger.info('[CRON:NEWSLETTER] Starting weekly newsletter job...')
    const startTime = Date.now()

    // Calcular range da semana passada (seg a dom)
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(now)
    weekEnd.setHours(23, 59, 59, 999)

    // Label da semana para o email
    const weekLabel = `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} – ${weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`

    // Dica da semana (rotativa por semana do ano)
    const weekOfYear = Math.ceil(
      (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
    const tip = SALES_TIPS[weekOfYear % SALES_TIPS.length]

    // Buscar orgs PRO/BUSINESS com usuários ativos
    const orgs = await prisma.organization.findMany({
      where: { tier: { in: ['PRO', 'BUSINESS'] } },
      select: {
        id: true,
        name: true,
        users: {
          select: { id: true, name: true, email: true, locale: true },
          where: { email: { not: undefined } },
          orderBy: { createdAt: 'asc' },
          take: 1, // Apenas o owner/primeiro usuário
        },
      },
    })

    const stats = { sent: 0, skipped: 0, errors: 0 }

    for (const org of orgs) {
      const owner = org.users[0]
      if (!owner?.email) { stats.skipped++; continue }

      try {
        // Buscar stats da semana para esta org
        const [newDeals, wonDeals, lostDeals, newContacts] = await Promise.all([
          prisma.deal.count({
            where: { organizationId: org.id, createdAt: { gte: weekStart, lte: weekEnd } },
          }),
          prisma.deal.count({
            where: { organizationId: org.id, status: 'WON', updatedAt: { gte: weekStart, lte: weekEnd } },
          }),
          prisma.deal.count({
            where: { organizationId: org.id, status: 'LOST', updatedAt: { gte: weekStart, lte: weekEnd } },
          }),
          prisma.contact.count({
            where: { organizationId: org.id, createdAt: { gte: weekStart, lte: weekEnd } },
          }),
        ])

        // Pular orgs sem nenhuma atividade na semana
        if (newDeals === 0 && wonDeals === 0 && lostDeals === 0 && newContacts === 0) {
          stats.skipped++
          continue
        }

        const totalForRate = newDeals + wonDeals + lostDeals
        const conversionRate = totalForRate > 0 ? (wonDeals / totalForRate) * 100 : 0

        const locale = (owner.locale as 'pt-BR' | 'en') ?? 'pt-BR'
        const subject = locale === 'en'
          ? `📊 Weekly Summary (${weekLabel}) – Sirius CRM`
          : `📊 Resumo da semana (${weekLabel}) – Sirius CRM`
        await sendEmail({
          to: owner.email,
          subject,
          react: WeeklyNewsletter({
            userName: owner.name || (locale === 'en' ? 'Hi' : 'Olá'),
            weekLabel,
            stats: { newDeals, wonDeals, lostDeals, newContacts, conversionRate },
            tip,
            locale,
          }),
        })

        stats.sent++
        logger.info({ orgId: org.id, email: owner.email }, '[CRON:NEWSLETTER] Email sent')
      } catch (err) {
        stats.errors++
        logger.error({ err, orgId: org.id }, '[CRON:NEWSLETTER] Failed to send email')
      }
    }

    const duration = Date.now() - startTime
    logger.info({ ...stats, duration: `${duration}ms` }, '[CRON:NEWSLETTER] Job completed')

    return NextResponse.json({
      success: true,
      message: 'Weekly newsletter job completed',
      stats: { ...stats, duration: `${duration}ms` },
    })
  } catch (error) {
    logger.error({ error }, '[CRON:NEWSLETTER] Critical error')
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
