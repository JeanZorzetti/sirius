/**
 * Cron: /api/cron/sync-whatsapp
 *
 * Self-healing sync — roda a cada 10 minutos via Vercel Cron.
 * Sincroniza conexões CONNECTED que:
 *   - Nunca foram sincronizadas (lastSyncAt IS NULL)
 *   - Não sincronizam há mais de 1 hora
 *
 * Safety net para quando o auto-sync via webhook after() falha.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncConnectionHistory } from '@/lib/whatsapp-sync'
import logger from '@/lib/logger'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  try {
    // Auth — mesmo padrão de CRON_SECRET dos outros crons
    const authHeader = request.headers.get('authorization')
    const urlToken = request.nextUrl.searchParams.get('token')
    const cronSecret = process.env.CRON_SECRET

    const isValidToken =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronSecret && urlToken === cronSecret)

    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing CRON_SECRET' },
        { status: 401 }
      )
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    // Find connections that need sync
    const connectionsToSync = await prisma.whatsAppConnection.findMany({
      where: {
        status: 'CONNECTED',
        OR: [
          { lastSyncAt: null },
          { lastSyncAt: { lt: oneHourAgo } },
        ],
      },
      select: { id: true, instanceName: true, organizationId: true, lastSyncAt: true },
    })

    if (connectionsToSync.length === 0) {
      return NextResponse.json({ message: 'No connections need sync', synced: 0 })
    }

    logger.info({ count: connectionsToSync.length }, '[CRON] sync-whatsapp: starting')

    const results: Array<{ connectionId: string; success: boolean; error?: string; syncedMessages?: number }> = []

    for (const conn of connectionsToSync) {
      try {
        const result = await syncConnectionHistory(conn.id)
        results.push({
          connectionId: conn.id,
          success: true,
          syncedMessages: result.syncedMessages,
        })

        // Notify frontend if messages were synced
        if (result.syncedMessages > 0) {
          const { triggerEvent } = await import('@/lib/pusher')
          triggerEvent(conn.organizationId, 'sync:complete', {
            connectionId: conn.id,
            syncedContacts: result.syncedContacts,
            syncedMessages: result.syncedMessages,
          })
        }
      } catch (err: any) {
        logger.error({ connectionId: conn.id, error: err.message }, '[CRON] sync-whatsapp: sync failed')
        results.push({ connectionId: conn.id, success: false, error: err.message })
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    logger.info({ successful, failed, total: results.length }, '[CRON] sync-whatsapp: done')

    return NextResponse.json({ synced: successful, failed, results })
  } catch (error: any) {
    logger.error({ error: error.message }, '[CRON] sync-whatsapp: fatal error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
