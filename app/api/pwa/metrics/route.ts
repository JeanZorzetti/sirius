import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * POST /api/pwa/metrics
 * Track PWA metric events
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    // Allow tracking even without session (for anonymous install events)
    // but require session for user-specific events
    const body = await request.json()
    const { type, data, userAgent, timestamp } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Missing required field: type' },
        { status: 400 }
      )
    }

    // Get device type from user agent
    const deviceType = getDeviceType(userAgent)

    // Create metric
    await prisma.pWAMetric.create({
      data: {
        type,
        userId: session?.user?.id || null,
        organizationId: session?.user?.organizationId || process.env.DEFAULT_ORG_ID || 'anonymous',
        userAgent,
        deviceType,
        data: data || {},
      },
    })

    logger.info({
      type,
      userId: session?.user?.id,
      deviceType,
    }, 'PWA metric tracked')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Error tracking PWA metric')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

/**
 * GET /api/pwa/metrics
 * Get PWA metrics (requires authentication)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.organizationId) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Get metrics for the last N days
    const since = new Date()
    since.setDate(since.getDate() - days)

    const metrics = await prisma.pWAMetric.findMany({
      where: {
        organizationId: session.user.organizationId,
        createdAt: {
          gte: since,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000,
    })

    // Aggregate metrics
    const stats = {
      total: metrics.length,
      byType: {} as Record<string, number>,
      byDevice: {} as Record<string, number>,
      installPromptShown: 0,
      installPromptAccepted: 0,
      installPromptDismissed: 0,
      appInstalled: 0,
      pushPermissionGranted: 0,
      pushPermissionDenied: 0,
      offlineSyncSuccess: 0,
      offlineSyncFailure: 0,
    }

    metrics.forEach((metric) => {
      // Count by type
      stats.byType[metric.type] = (stats.byType[metric.type] || 0) + 1

      // Count by device
      if (metric.deviceType) {
        stats.byDevice[metric.deviceType] = (stats.byDevice[metric.deviceType] || 0) + 1
      }

      // Individual counters
      switch (metric.type) {
        case 'INSTALL_PROMPT_SHOWN':
          stats.installPromptShown++
          break
        case 'INSTALL_PROMPT_ACCEPTED':
          stats.installPromptAccepted++
          break
        case 'INSTALL_PROMPT_DISMISSED':
          stats.installPromptDismissed++
          break
        case 'APP_INSTALLED':
          stats.appInstalled++
          break
        case 'PUSH_PERMISSION_GRANTED':
          stats.pushPermissionGranted++
          break
        case 'PUSH_PERMISSION_DENIED':
          stats.pushPermissionDenied++
          break
        case 'OFFLINE_SYNC_SUCCESS':
          stats.offlineSyncSuccess++
          break
        case 'OFFLINE_SYNC_FAILURE':
          stats.offlineSyncFailure++
          break
      }
    })

    // Calculate conversion rates
    const installConversionRate =
      stats.installPromptShown > 0
        ? Math.round((stats.installPromptAccepted / stats.installPromptShown) * 100)
        : 0

    const pushConversionRate =
      stats.pushPermissionGranted + stats.pushPermissionDenied > 0
        ? Math.round(
            (stats.pushPermissionGranted /
              (stats.pushPermissionGranted + stats.pushPermissionDenied)) *
              100
          )
        : 0

    return NextResponse.json({
      stats,
      conversionRates: {
        install: installConversionRate,
        push: pushConversionRate,
      },
      recentEvents: metrics.slice(0, 50),
    })
  } catch (error) {
    logger.error({ error }, 'Error fetching PWA metrics')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}

function getDeviceType(userAgent?: string): string | null {
  if (!userAgent) return null

  const ua = userAgent.toLowerCase()

  if (ua.includes('mobile') || ua.includes('android')) {
    return 'mobile'
  }

  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet'
  }

  return 'desktop'
}
