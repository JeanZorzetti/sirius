import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { revokeApiKey } from '@/lib/api-keys'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

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
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true }
    })

    if (!user) {
      return await apiError(ERR.USER_NOT_FOUND, 404, { req: request })
    }

    const { id: apiKeyId } = await params

    // Verify API key belongs to user's organization
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
      select: { organizationId: true }
    })

    if (!apiKey) {
      return await apiError(ERR.API_KEY_NOT_FOUND, 404, { req: request })
    }

    if (apiKey.organizationId !== user.organizationId) {
      return await apiError(ERR.FORBIDDEN, 403, { req: request })
    }

    await revokeApiKey(apiKeyId, user.organizationId)

    return NextResponse.json({
      success: true,
      message: 'API key revogada com sucesso'
    })

  } catch (error) {
    logger.error({ error }, 'Error revoking API key')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}
