/**
 * Follow-up Emails Cron Job
 *
 * ✅ FASE 14: Verifica deals dormentes e envia alertas de follow-up para os owners.
 *
 * Regras:
 * - 3 dias sem update → alerta leve (deals PRO/BUSINESS)
 * - 7 dias sem update → alerta médio (todos os planos)
 * - 14 dias sem update → alerta urgente (todos os planos)
 *
 * Configuração Vercel Cron:
 * Roda diariamente às 09:00 (America/Sao_Paulo = UTC-3 = 12:00 UTC)
 *
 * Teste manual:
 * GET /api/cron/follow-up-emails?token=SEU_CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { FollowUpEmail } from '@/emails/templates/follow-up'
import logger from '@/lib/logger'

export const runtime = 'nodejs'
export const maxDuration = 300

const FOLLOW_UP_THRESHOLDS = [3, 7, 14] // dias sem update

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

    logger.info('[CRON:FOLLOW-UP] Starting follow-up emails job...')
    const startTime = Date.now()

    const stats = { checked: 0, sent: 0, skipped: 0, errors: 0 }

    for (const days of FOLLOW_UP_THRESHOLDS) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      // Deals ativos sem update há exatamente N dias (janela de 24h)
      const windowStart = new Date(cutoffDate)
      windowStart.setHours(0, 0, 0, 0)
      const windowEnd = new Date(cutoffDate)
      windowEnd.setHours(23, 59, 59, 999)

      const staleDealOwners = await prisma.deal.findMany({
        where: {
          status: 'ACTIVE',
          archived: false,
          updatedAt: {
            gte: windowStart,
            lte: windowEnd,
          },
        },
        include: {
          user: { select: { email: true, name: true, locale: true } },
          stage: { select: { name: true } },
          contact: { select: { name: true } },
          organization: { select: { tier: true } },
        },
      })

      stats.checked += staleDealOwners.length

      // Para alerta de 3 dias, só PRO/BUSINESS
      const filtered = days === 3
        ? staleDealOwners.filter(d => ['PRO', 'BUSINESS'].includes(d.organization.tier))
        : staleDealOwners

      for (const deal of filtered) {
        if (!deal.user.email) {
          stats.skipped++
          continue
        }

        try {
          const dealUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?deal=${deal.id}`

          const locale = (deal.user.locale as 'pt-BR' | 'en') ?? 'pt-BR'
          const emoji = days >= 14 ? '🚨' : days >= 7 ? '⚠️' : '📌'
          const subject = locale === 'en'
            ? `${emoji} Follow-up: "${deal.title}" stalled for ${days} days`
            : `${emoji} Follow-up: "${deal.title}" parado há ${days} dias`
          await sendEmail({
            to: deal.user.email,
            subject,
            react: FollowUpEmail({
              userName: deal.user.name || (locale === 'en' ? 'Hi' : 'Olá'),
              dealTitle: deal.title,
              dealValue: deal.value ? parseFloat(deal.value.toString()) : undefined,
              contactName: deal.contact?.name,
              stageName: deal.stage.name,
              daysSinceUpdate: days,
              dealUrl,
              locale,
            }),
          })

          stats.sent++
          logger.info({ dealId: deal.id, days, email: deal.user.email }, '[CRON:FOLLOW-UP] Email sent')
        } catch (err) {
          stats.errors++
          logger.error({ err, dealId: deal.id }, '[CRON:FOLLOW-UP] Failed to send email')
        }
      }
    }

    const duration = Date.now() - startTime
    logger.info({ ...stats, duration: `${duration}ms` }, '[CRON:FOLLOW-UP] Job completed')

    return NextResponse.json({
      success: true,
      message: 'Follow-up emails job completed',
      stats: { ...stats, duration: `${duration}ms` },
    })
  } catch (error) {
    logger.error({ error }, '[CRON:FOLLOW-UP] Critical error')
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
