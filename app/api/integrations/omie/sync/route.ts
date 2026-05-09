/**
 * POST /api/integrations/omie/sync
 * body: { type: 'contacts' | 'financial' }
 *
 * contacts  — importa clientes Omie como Contacts no CRM
 * financial — sincroniza títulos a receber por cliente
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listarClientes, listarContasReceber } from '@/lib/integrations/omie'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) return await apiError(ERR.UNAUTHORIZED, 401, { req: request })

  const { type } = await request.json()

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      organizationId: true,
      organization: { select: { id: true, omieAppKey: true, omieAppSecret: true, omieEnabled: true } },
    },
  })

  if (!user?.organization?.omieEnabled || !user.organization.omieAppKey || !user.organization.omieAppSecret) {
    return NextResponse.json({ error: 'Omie não configurado' }, { status: 400 })
  }

  const creds = { appKey: user.organization.omieAppKey, appSecret: user.organization.omieAppSecret }
  const orgId = user.organization.id

  // ── Sync Contacts ─────────────────────────────────────────────────────────
  if (type === 'contacts') {
    let pagina = 1
    let totalImported = 0
    let totalUpdated  = 0

    while (true) {
      const result = await listarClientes(creds, pagina, 50)
      const clientes = result.clientes_cadastro ?? []
      if (!clientes.length) break

      for (const c of clientes) {
        const phone = c.telefone1_ddd && c.telefone1_numero
          ? `${c.telefone1_ddd}${c.telefone1_numero}`.replace(/\D/g, '')
          : null

        const existing = await prisma.contact.findFirst({
          where: { organizationId: orgId, omieClienteId: String(c.codigo_cliente_omie) },
        })

        if (existing) {
          await prisma.contact.update({
            where: { id: existing.id },
            data: {
              name:  c.nome_fantasia || c.razao_social,
              email: c.email || null,
              phone: phone || null,
            },
          })
          totalUpdated++
        } else {
          await prisma.contact.create({
            data: {
              name:           c.nome_fantasia || c.razao_social,
              email:          c.email || null,
              phone:          phone || null,
              company:        c.razao_social || null,
              document:       c.cnpj_cpf || null,
              city:           c.cidade || null,
              state:          c.estado || null,
              organizationId: orgId,
              omieClienteId:  String(c.codigo_cliente_omie),
              source:         'omie',
            },
          })
          totalImported++
        }
      }

      if (pagina >= result.total_de_paginas) break
      pagina++
    }

    logger.info({ orgId, totalImported, totalUpdated }, '[OMIE:SYNC] Contacts synced')
    return NextResponse.json({ success: true, totalImported, totalUpdated })
  }

  // ── Sync Financial ────────────────────────────────────────────────────────
  if (type === 'financial') {
    // Busca contacts que têm omieClienteId
    const contacts = await prisma.contact.findMany({
      where: { organizationId: orgId, omieClienteId: { not: null } },
      select: { id: true, omieClienteId: true },
    })

    let totalSynced = 0
    for (const contact of contacts) {
      try {
        const result = await listarContasReceber(creds, Number(contact.omieClienteId))
        const titulos = result.lancamentos ?? []

        for (const titulo of titulos) {
          await prisma.omieFinanceiro.upsert({
            where: { omieId: String(titulo.codigo_lancamento_omie) },
            update: {
              status:       titulo.status_titulo,
              valor:        titulo.valor_documento,
              vencimento:   new Date(titulo.data_vencimento.split('/').reverse().join('-')),
            },
            create: {
              omieId:        String(titulo.codigo_lancamento_omie),
              contactId:     contact.id,
              organizationId: orgId,
              status:        titulo.status_titulo,
              valor:         titulo.valor_documento,
              vencimento:    new Date(titulo.data_vencimento.split('/').reverse().join('-')),
            },
          })
          totalSynced++
        }
      } catch {
        // Continua para o próximo contato se um falhar
      }
    }

    logger.info({ orgId, totalSynced }, '[OMIE:SYNC] Financial synced')
    return NextResponse.json({ success: true, totalSynced })
  }

  return NextResponse.json({ error: 'type inválido' }, { status: 400 })
}
