import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * Get integration logs with filtering and pagination
 * GET /api/integrations/logs
 *
 * Query params:
 * - type: N8N | WHATSAPP | GOOGLE_CALENDAR
 * - status: PENDING | SUCCESS | FAILED | RETRYING
 * - dateFrom: ISO date string
 * - dateTo: ISO date string
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 */
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.user || !session.user.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true }
    })

    if (!user || !user.organizationId) {
      return await apiError(ERR.USER_NOT_FOUND, 404)
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Build where clause
    const where: any = {
      organizationId: user.organizationId
    }

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    // Get total count
    const total = await prisma.integrationLog.count({ where })

    // Get logs with pagination
    const logs = await prisma.integrationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        type: true,
        action: true,
        status: true,
        request: true,
        response: true,
        errorMessage: true,
        attemptCount: true,
        createdAt: true
      }
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error: any) {
    logger.error({ error }, 'Error fetching integration logs')
    return NextResponse.json(
      { error: 'Failed to fetch logs', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * Export logs as CSV
 * POST /api/integrations/logs (with export=true)
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || !session.user || !session.user.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true }
    })

    if (!user || !user.organizationId) {
      return await apiError(ERR.USER_NOT_FOUND, 404)
    }

    const body = await request.json()
    const { type, status, dateFrom, dateTo } = body

    // Build where clause
    const where: any = {
      organizationId: user.organizationId
    }

    if (type) where.type = type
    if (status) where.status = status

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    // Get all matching logs (limited to 1000 for export)
    const logs = await prisma.integrationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000,
      select: {
        id: true,
        type: true,
        action: true,
        status: true,
        errorMessage: true,
        attemptCount: true,
        createdAt: true
      }
    })

    // Generate CSV
    const headers = ['ID', 'Tipo', 'Ação', 'Status', 'Tentativas', 'Erro', 'Data/Hora']
    const rows = logs.map(log => [
      log.id,
      log.type,
      log.action,
      log.status,
      log.attemptCount.toString(),
      log.errorMessage || '-',
      log.createdAt.toISOString()
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="integration-logs-${new Date().toISOString()}.csv"`
      }
    })
  } catch (error: any) {
    logger.error({ error }, 'Error exporting integration logs')
    return NextResponse.json(
      { error: 'Failed to export logs', message: error.message },
      { status: 500 }
    )
  }
}
