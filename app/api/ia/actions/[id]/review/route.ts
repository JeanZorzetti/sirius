import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revisarAcaoDeAgente } from '@/lib/agaas-aprovacao'
import logger from '@/lib/logger'

/**
 * PATCH /api/ia/actions/[id]/review
 * Internal session-based route for the /IA feed to approve/reject agent actions.
 * Approving applies the draft the human just read (spec 011).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const { id } = await params
    const { decision } = await request.json()

    if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
      return NextResponse.json({ error: 'decision must be APPROVED or REJECTED' }, { status: 400 })
    }

    const resultado = await revisarAcaoDeAgente({ id, organizationId: user.organizationId, decisao: decision, revisorId: user.id })
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.erro }, { status: resultado.status })
    }

    return NextResponse.json({
      ...resultado.acao,
      createdAt: resultado.acao.createdAt.toISOString(),
      reviewedAt: resultado.acao.reviewedAt?.toISOString(),
    })
  } catch (error) {
    logger.error({ error }, '[AgaaS:Review] Review failed')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
