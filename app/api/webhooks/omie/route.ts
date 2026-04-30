/**
 * POST /api/webhooks/omie
 * Recebe eventos em tempo real do Omie ERP.
 * Configurar em: developer.omie.com.br → seu app → Webhooks
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const evento: string = body.evento ?? body.topic ?? ''

    logger.info({ evento, body: JSON.stringify(body) }, '[OMIE:WEBHOOK] Event received')

    // Identifica a org pelo app_key (Omie envia no payload)
    const appKey: string = body.app_key ?? body.appKey ?? ''
    if (!appKey) {
      return NextResponse.json({ codigo: 200, mensagem: 'ok' })
    }

    const org = await prisma.organization.findFirst({
      where: { omieAppKey: appKey },
      select: { id: true, omieAppKey: true, omieAppSecret: true },
    })

    if (!org) {
      logger.warn({ appKey }, '[OMIE:WEBHOOK] No org found for appKey')
      return NextResponse.json({ codigo: 200, mensagem: 'ok' })
    }

    // ── cliente.criado / cliente.alterado ─────────────────────────────────
    if (evento === 'cliente.criado' || evento === 'cliente.alterado') {
      const omieId   = String(body.codigo_cliente_omie ?? body.codigo_cliente ?? '')
      const nome     = body.nome_fantasia || body.razao_social || 'Cliente Omie'
      const email    = body.email || null
      const telefone = body.telefone1_ddd && body.telefone1_numero
        ? `${body.telefone1_ddd}${body.telefone1_numero}`.replace(/\D/g, '')
        : null

      if (omieId) {
        await prisma.contact.upsert({
          where: { omieClienteId_organizationId: { omieClienteId: omieId, organizationId: org.id } } as any,
          update: { name: nome, email, phone: telefone },
          create: {
            name:           nome,
            email,
            phone:          telefone,
            company:        body.razao_social || null,
            document:       body.cnpj_cpf || null,
            organizationId: org.id,
            omieClienteId:  omieId,
            source:         'omie',
          },
        })
        logger.info({ orgId: org.id, omieId, evento }, '[OMIE:WEBHOOK] Contact upserted')
      }
    }

    // ── conta_receber.alterada ────────────────────────────────────────────
    if (evento === 'conta_receber.alterada' || evento === 'conta_receber.criada') {
      const omieId  = String(body.codigo_lancamento_omie ?? '')
      const clienteId = String(body.codigo_cliente ?? '')

      if (omieId && clienteId) {
        const contact = await prisma.contact.findFirst({
          where: { organizationId: org.id, omieClienteId: clienteId },
          select: { id: true },
        })

        if (contact) {
          const vencimentoStr: string = body.data_vencimento ?? ''
          const vencimento = vencimentoStr
            ? new Date(vencimentoStr.split('/').reverse().join('-'))
            : new Date()

          await prisma.omieFinanceiro.upsert({
            where: { omieId },
            update: { status: body.status_titulo, valor: body.valor_documento, vencimento },
            create: {
              omieId,
              contactId:      contact.id,
              organizationId: org.id,
              status:         body.status_titulo ?? 'A_VENCER',
              valor:          body.valor_documento ?? 0,
              vencimento,
            },
          })
          logger.info({ orgId: org.id, omieId, evento }, '[OMIE:WEBHOOK] Financial upserted')
        }
      }
    }

    return NextResponse.json({ codigo: 200, mensagem: 'ok' })
  } catch (error) {
    logger.error({ error }, '[OMIE:WEBHOOK] Error processing event')
    return NextResponse.json({ codigo: 200, mensagem: 'ok' })
  }
}
