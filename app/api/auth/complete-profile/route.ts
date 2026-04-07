import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

  const existingDeal = await prisma.deal.findFirst({
    where: { contactId: contact.id, pipelineId: pipeline.id }
  })
  if (existingDeal) return

  const observations = [
    jobTitle && `Cargo: ${jobTitle}`,
    segment && `Segmento: ${segment}`,
  ].filter(Boolean).join(' | ') || null

  await prisma.deal.create({
    data: {
      title: companyName ? `Lead: ${name} — ${companyName}` : `Lead: ${name}`,
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
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
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
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
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
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
