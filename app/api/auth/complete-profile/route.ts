import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

async function enrollAsLead({ name, email, phone, companyName, jobTitle, segment }: {
  name: string, email: string, phone: string | null, companyName: string | null, jobTitle: string | null, segment: string | null
}) {
  const leadsOrgId = process.env.LEADS_PIPELINE_ORG_ID
  if (!leadsOrgId) return

  const pipeline = await prisma.pipeline.findFirst({
    where: { organizationId: leadsOrgId, isDefault: true },
    include: { stages: { orderBy: { order: 'asc' }, take: 1 } }
  })
  if (!pipeline || !pipeline.stages.length) return

  const owner = await prisma.user.findFirst({
    where: { organizationId: leadsOrgId, orgRole: 'OWNER' }
  })
  if (!owner) return

  let contact = email
    ? await prisma.contact.findFirst({ where: { organizationId: leadsOrgId, email } })
    : null

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        company: companyName || null,
        organizationId: leadsOrgId,
      }
    })
  }

  const observations = [
    jobTitle && `Cargo: ${jobTitle}`,
    segment && `Segmento: ${segment}`,
  ].filter(Boolean).join(' | ') || null

  const newTitle = companyName ? `Lead: ${name} — ${companyName}` : `Lead: ${name}`

  const existingDeal = await prisma.deal.findFirst({
    where: { contactId: contact.id, pipelineId: pipeline.id }
  })

  if (existingDeal) {
    // Enrich existing deal with completed profile data
    await prisma.deal.update({
      where: { id: existingDeal.id },
      data: { title: newTitle, observations },
    })
    // Also enrich contact
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        phone: phone || contact.phone,
        company: companyName || contact.company,
      }
    })
    return
  }

  await prisma.deal.create({
    data: {
      title: newTitle,
      stageId: pipeline.stages[0].id,
      pipelineId: pipeline.id,
      organizationId: leadsOrgId,
      userId: owner.id,
      contactId: contact.id,
      observations,
    }
  })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req })
    }

    const { phone, jobTitle, company, companyDescription, segment } = await req.json()

    if (!phone || !jobTitle || !company || !segment) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true, organizationId: true },
    })

    if (!user) {
      return await apiError(ERR.USER_NOT_FOUND, 404, { req })
    }

    // Update user with phone and jobTitle
    await prisma.user.update({
      where: { id: user.id },
      data: { phone, jobTitle },
    })

    // Update organization with company name, description, segment
    await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        name: company,
        description: companyDescription || null,
        segment,
      },
    })

    // Enroll as lead (non-blocking)
    enrollAsLead({
      name: user.name || user.email,
      email: user.email,
      phone,
      companyName: company,
      jobTitle,
      segment,
    }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[complete-profile] Error:', error)
    return await apiError(ERR.INTERNAL_ERROR, 500, { req })
  }
}
