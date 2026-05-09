import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

// GET /api/admin/organizations - List all organizations
export async function GET() {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    // Only admin/super_admin can access
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const organizations = await prisma.organization.findMany({
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ organizations })
  } catch (error) {
    logger.error({ err: error }, 'Error fetching organizations')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
