/**
 * API Route: /api/contact/[id]/interactions
 *
 * Retorna todas as interações de um contato (filtradas por tipo opcionalmente)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // 3. Verificar se o contato pertence à organização
    const contact = await prisma.contact.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId,
      },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // 4. Buscar interações (filtrar por tipo se especificado)
    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type')

    const interactions = await prisma.interaction.findMany({
      where: {
        contactId: params.id,
        ...(type && { type }),
      },
      orderBy: {
        occurredAt: 'asc',
      },
      select: {
        id: true,
        type: true,
        direction: true,
        content: true,
        occurredAt: true,
        metadata: true,
      },
    })

    return NextResponse.json(interactions)
  } catch (error) {
    logger.error({ error, contactId: params.id }, 'Error fetching interactions')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
