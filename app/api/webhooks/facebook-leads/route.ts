/**
 * Facebook Lead Ads Webhook
 *
 * GET  — Verificação do webhook pelo Meta (challenge)
 * POST — Notificação de novo lead em tempo real
 *
 * Fluxo:
 *   1. Meta envia POST com leadgen_id
 *   2. Buscamos os dados do lead na Graph API usando o Page Access Token
 *   3. Salvamos em FacebookLead e criamos/atualizamos Contact no CRM
 *
 * Configure em Meta for Developers → Webhooks:
 *   URL: https://siriuscrm.com.br/api/webhooks/facebook-leads
 *   Campo: leadgen
 *   Objeto: page
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchLeadData } from '@/lib/ads/facebook-lead-ads'
import { decrypt } from '@/lib/encryption'
import logger from '@/lib/logger'

async function getDefaultPipelineStage(organizationId: string) {
  const pipeline = await prisma.pipeline.findFirst({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
    include: {
      stages: { orderBy: { order: 'asc' }, take: 1 },
    },
  })
  const user = await prisma.user.findFirst({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
  })
  return {
    pipelineId: pipeline?.id ?? null,
    stageId: pipeline?.stages[0]?.id ?? null,
    userId: user?.id ?? null,
  }
}

// ─── GET: Verificação do webhook pelo Meta ────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode !== 'subscribe' || !token || !challenge) {
    return new NextResponse('Bad Request', { status: 400 })
  }

  // Verifica contra o token global (fallback)
  const globalToken = process.env.FACEBOOK_LEADS_WEBHOOK_VERIFY_TOKEN
  if (globalToken && token === globalToken) {
    return new NextResponse(challenge, { status: 200 })
  }

  // Verifica contra o token por organização
  const org = await prisma.organization.findFirst({
    where: { facebookWebhookVerifyToken: token },
    select: { id: true },
  })

  if (org) {
    return new NextResponse(challenge, { status: 200 })
  }

  logger.warn({ token }, '[FB:LEADS] Webhook verification failed: unknown token')
  return new NextResponse('Forbidden', { status: 403 })
}

// ─── POST: Recepção de novo lead ──────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Meta envia object: "page" para Lead Ads
    if (body.object !== 'page') {
      return NextResponse.json({ status: 'ignored' })
    }

    for (const entry of body.entry ?? []) {
      const pageId: string = entry.id

      // Localiza a organização pelo pageId
      const org = await prisma.organization.findFirst({
        where: { facebookPageId: pageId },
        select: {
          id: true,
          facebookPageAccessToken: true,
        },
      })

      if (!org) {
        logger.warn({ pageId }, '[FB:LEADS] No org found for pageId')
        continue
      }

      for (const change of entry.changes ?? []) {
        if (change.field !== 'leadgen') continue

        const value = change.value
        const leadgenId: string = value.leadgen_id

        // Evita duplicata (idempotência)
        const existing = await prisma.facebookLead.findUnique({
          where: { leadgenId },
        })
        if (existing) continue

        // Salva o lead com dados mínimos (antes do fetch)
        const fbLead = await prisma.facebookLead.create({
          data: {
            leadgenId,
            pageId,
            formId:     value.form_id   ?? '',
            adId:       value.ad_id     ?? null,
            adgroupId:  value.adgroup_id ?? null,
            campaignId: value.campaign_id ?? null,
            organizationId: org.id,
          },
        })

        // Busca os dados do lead na Graph API
        if (org.facebookPageAccessToken) {
          const pageToken = decrypt(org.facebookPageAccessToken)
          const leadData = await fetchLeadData(leadgenId, pageToken)

          if (leadData) {
            const contact = await prisma.contact.create({
              data: {
                name:           leadData.name ?? 'Lead Facebook',
                email:          leadData.email ?? null,
                phone:          leadData.phone ?? null,
                organizationId: org.id,
              },
            })

            // Cria Deal na primeira stage do pipeline
            const { pipelineId, stageId, userId } = await getDefaultPipelineStage(org.id)
            if (pipelineId && stageId && userId) {
              await prisma.deal.create({
                data: {
                  title:          `Lead Facebook — ${leadData.name ?? 'Novo Lead'}`,
                  organizationId: org.id,
                  pipelineId,
                  stageId,
                  contactId:      contact.id,
                  userId,
                },
              })
            }

            await prisma.facebookLead.update({
              where: { id: fbLead.id },
              data: {
                name:      leadData.name,
                email:     leadData.email,
                phone:     leadData.phone,
                rawFields: leadData.rawFields,
                fetchedAt: new Date(),
                contactId: contact.id,
              },
            })

            logger.info(
              { leadgenId, contactId: contact.id, orgId: org.id, pipelineId, stageId },
              '[FB:LEADS] Lead created, contact and deal saved'
            )
          } else {
            logger.warn({ leadgenId, orgId: org.id }, '[FB:LEADS] Could not fetch lead data from Graph API')
          }
        } else {
          logger.warn({ orgId: org.id }, '[FB:LEADS] No page access token configured')
        }
      }
    }

    // Meta exige status 200 imediato
    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    logger.error({ error }, '[FB:LEADS] Webhook POST error')
    // Retorna 200 mesmo em erro para o Meta não tentar reenviar indefinidamente
    return NextResponse.json({ status: 'error' })
  }
}
