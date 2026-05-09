/**
 * GET  /api/webhooks/facebook-leads/test          — diagnóstico
 * POST /api/webhooks/facebook-leads/test?leadId=X — processa lead manualmente
 * REMOVER após confirmar que o webhook está funcionando.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchLeadData } from '@/lib/ads/facebook-lead-ads'
import { decrypt } from '@/lib/encryption'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) {
    return await apiError(ERR.UNAUTHORIZED, 401, { req })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      organization: {
        select: {
          id: true,
          facebookPageId: true,
          facebookPageAccessToken: true,
        },
      },
    },
  })

  if (!user?.organization?.facebookPageId) {
    return NextResponse.json({ error: 'Página não configurada', org: user?.organization })
  }

  const org = user.organization
  const pageToken = org.facebookPageAccessToken ? decrypt(org.facebookPageAccessToken) : null

  // Se passou ?leadId=XXX, processa o lead diretamente
  const leadId = new URL(request.url).searchParams.get('leadId')
  if (leadId && pageToken) {
    const existing = await prisma.facebookLead.findUnique({ where: { leadgenId: leadId } })
    if (existing) {
      return NextResponse.json({ status: 'already_exists', leadId, existingId: existing.id })
    }

    const fbLead = await prisma.facebookLead.create({
      data: { leadgenId: leadId, pageId: org.facebookPageId!, formId: '', organizationId: org.id },
    })

    const leadData = await fetchLeadData(leadId, pageToken)
    if (!leadData) {
      return NextResponse.json({ status: 'lead_fetch_failed', fbLeadId: fbLead.id })
    }

    const contact = await prisma.contact.create({
      data: {
        name:           leadData.name ?? 'Lead Facebook',
        email:          leadData.email ?? null,
        phone:          leadData.phone ?? null,
        organizationId: org.id,
      },
    })

    // Cria Deal na primeira stage do pipeline
    const pipeline = await prisma.pipeline.findFirst({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'asc' },
      include: { stages: { orderBy: { order: 'asc' }, take: 1 } },
    })
    const orgUser = await prisma.user.findFirst({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'asc' },
    })
    let dealId = null
    if (pipeline?.id && pipeline.stages[0]?.id && orgUser?.id) {
      const deal = await prisma.deal.create({
        data: {
          title:          `Lead Facebook — ${leadData.name ?? 'Novo Lead'}`,
          organizationId: org.id,
          pipelineId:     pipeline.id,
          stageId:        pipeline.stages[0].id,
          contactId:      contact.id,
          userId:         orgUser.id,
        },
      })
      dealId = deal.id
    }

    await prisma.facebookLead.update({
      where: { id: fbLead.id },
      data: { name: leadData.name, email: leadData.email, phone: leadData.phone, rawFields: leadData.rawFields, fetchedAt: new Date(), contactId: contact.id },
    })

    return NextResponse.json({ status: 'created', contactId: contact.id, dealId, leadData })
  }

  // Diagnóstico geral
  let recentLeads = null
  let leadFetchError = null
  if (pageToken) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${org.facebookPageId}/leadgen_forms?fields=id,name,leads{id,field_data}&access_token=${pageToken}`
      )
      recentLeads = await res.json()
    } catch (e) {
      leadFetchError = String(e)
    }
  }

  const leadsInDb = await prisma.facebookLead.count({ where: { organizationId: org.id } })

  return NextResponse.json({
    org: { id: org.id, facebookPageId: org.facebookPageId, hasPageToken: !!pageToken },
    leadsInDb,
    recentLeads,
    leadFetchError,
  })
}

// Processa um lead manualmente pelo leadgenId
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) {
    return await apiError(ERR.UNAUTHORIZED, 401, { req })
  }

  const { leadId } = await request.json()
  if (!leadId) return NextResponse.json({ error: 'leadId obrigatório' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      organization: {
        select: { id: true, facebookPageId: true, facebookPageAccessToken: true },
      },
    },
  })

  if (!user?.organization?.facebookPageAccessToken) {
    return NextResponse.json({ error: 'Page token não configurado' }, { status: 400 })
  }

  const org = user.organization
  const pageToken = decrypt(org.facebookPageAccessToken!)

  // Evita duplicata
  const existing = await prisma.facebookLead.findUnique({ where: { leadgenId: leadId } })
  if (existing) {
    return NextResponse.json({ status: 'already_exists', leadId, existingId: existing.id })
  }

  const fbLead = await prisma.facebookLead.create({
    data: {
      leadgenId:      leadId,
      pageId:         org.facebookPageId!,
      formId:         '',
      organizationId: org.id,
    },
  })

  const leadData = await fetchLeadData(leadId, pageToken)
  if (!leadData) {
    return NextResponse.json({ status: 'lead_fetch_failed', fbLeadId: fbLead.id })
  }

  const contact = await prisma.contact.create({
    data: {
      name:           leadData.name ?? 'Lead Facebook',
      email:          leadData.email ?? null,
      phone:          leadData.phone ?? null,
      organizationId: org.id,
    },
  })

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

  return NextResponse.json({ status: 'created', contactId: contact.id, leadData })
}
