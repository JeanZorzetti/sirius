import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import logger from '@/lib/logger'

/**
 * GET /api/org/members
 * Retorna todos os membros da organização do usuário autenticado.
 * Usado para preencher o Select de responsável nas tarefas.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const members = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
      select: { id: true, name: true, email: true, orgRole: true },
      orderBy: [{ orgRole: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(members)
  } catch (error) {
    logger.error({ err: error }, '[org/members] error')
    return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 })
  }
}
