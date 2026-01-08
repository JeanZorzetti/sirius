import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { revokeApiKey } from '@/lib/api-keys'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'

/**
 * DELETE /api/v1/api-keys/[id]
 * Revoke an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const { id: apiKeyId } = await params

    // Verify API key belongs to user's organization
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
      select: { organizationId: true }
    })

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key não encontrada' },
        { status: 404 }
      )
    }

    if (apiKey.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para revogar esta API key' },
        { status: 403 }
      )
    }

    await revokeApiKey(apiKeyId, user.organizationId)

    return NextResponse.json({
      success: true,
      message: 'API key revogada com sucesso'
    })

  } catch (error) {
    logger.error({ error }, 'Error revoking API key')
    return NextResponse.json(
      { error: 'Erro ao revogar API key' },
      { status: 500 }
    )
  }
}
