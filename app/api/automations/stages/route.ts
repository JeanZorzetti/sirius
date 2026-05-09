import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * GET /api/automations/stages
 * Return all pipeline stages for the current organization (used by the automation builder).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { organizationId: true }
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404, { req: request })
    }

    const pipelines = await prisma.pipeline.findMany({
      where: { organizationId: user.organizationId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          select: { id: true, name: true, order: true }
        }
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
    })

    return NextResponse.json({ pipelines })
  } catch (error) {
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
