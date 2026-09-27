import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { carregarAcesso, escopoNegocio } from '@/lib/visibilidade'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/ia/actions/contact?contactId=xxx
 *
 * Returns agent actions related to a specific contact (or their deals).
 * Used by the chat UI to surface pending agent suggestions inline.
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const acesso = await carregarAcesso({ email: session.user.email })
  if (!acesso) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  const user = { organizationId: acesso.organizationId }

  const contactId = request.nextUrl.searchParams.get('contactId')
  if (!contactId) return NextResponse.json({ actions: [] })

  // Get deal IDs related to this contact so we capture actions on Deal entities too
  const deals = await prisma.deal.findMany({
    where: { contactId, ...escopoNegocio(acesso) },
    select: { id: true },
  })
  const dealIds = deals.map(d => d.id)

  const actions = await prisma.agentAction.findMany({
    where: {
      organizationId: user.organizationId,
      OR: [
        { entityType: 'Contact', entityId: contactId },
        ...(dealIds.length > 0 ? [{ entityType: 'Deal', entityId: { in: dealIds } }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      agentName: true,
      actionType: true,
      entityType: true,
      entityId: true,
      reasoning: true,
      confidence: true,
      status: true,
      input: true,
      output: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    actions: actions.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
  })
}
