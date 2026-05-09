/**
 * API Route: /api/whatsapp/profile-pic
 *
 * Fetch WhatsApp profile picture for a contact.
 * GET ?contactId=xxx          → returns { profilePicUrl: "/api/whatsapp/profile-pic/proxy?contactId=xxx" }
 * GET ?contactId=xxx&proxy=1  → streams the actual image bytes (proxied)
 *
 * WhatsApp CDN URLs expire quickly, so we:
 * 1. Fetch fresh URL from whatsmeow gateway each time
 * 2. Either return a proxy URL (default) or stream the image (proxy=1)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { whatsmeowClient } from '@/lib/integrations/whatsmeow-client'
import { isWhatsmeow } from '@/lib/whatsapp-provider'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const contactId = req.nextUrl.searchParams.get('contactId')
    const isProxy = req.nextUrl.searchParams.get('proxy') === '1'

    if (!contactId) {
      return NextResponse.json({ error: 'contactId required' }, { status: 400 })
    }

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, organizationId: user.organizationId },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
    }

    // Skip groups
    if (contact.phone?.includes('@g.us')) {
      return isProxy
        ? new NextResponse(null, { status: 404 })
        : NextResponse.json({ profilePicUrl: null })
    }

    // Find active whatsmeow connection
    const connection = await prismaWa.whatsAppConnection.findFirst({
      where: { organizationId: user.organizationId, status: 'CONNECTED' },
    })

    if (!connection) {
      return isProxy
        ? new NextResponse(null, { status: 404 })
        : NextResponse.json({ profilePicUrl: null })
    }

    // Get fresh profile pic URL from whatsmeow gateway
    const phone = contact.phone?.replace('@s.whatsapp.net', '').replace('@c.us', '') || ''
    if (!phone) {
      return isProxy
        ? new NextResponse(null, { status: 404 })
        : NextResponse.json({ profilePicUrl: null })
    }

    const jid = `${phone.replace(/\D/g, '')}@s.whatsapp.net`

    let picUrl: string | null = null
    try {
      if (isWhatsmeow(connection)) {
        const result = await whatsmeowClient.getProfilePic(connection.instanceName, jid)
        picUrl = result.url || null
      }
    } catch (err: any) {
      logger.debug({ error: err.message, contactId }, 'Profile pic fetch failed')
    }

    if (!picUrl) {
      return isProxy
        ? new NextResponse(null, { status: 404 })
        : NextResponse.json({ profilePicUrl: null })
    }

    // Proxy mode: download image from WhatsApp CDN and stream it
    if (isProxy) {
      try {
        const imgRes = await fetch(picUrl, {
          headers: { 'User-Agent': 'WhatsApp/2.24.6.78 A' },
        })
        if (!imgRes.ok) {
          return new NextResponse(null, { status: 404 })
        }
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
        const buffer = await imgRes.arrayBuffer()
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400', // 24h browser cache
          },
        })
      } catch {
        return new NextResponse(null, { status: 404 })
      }
    }

    // Default: return proxy URL so browser never hits WhatsApp CDN directly
    const proxyUrl = `/api/whatsapp/profile-pic?contactId=${contactId}&proxy=1`
    return NextResponse.json({ profilePicUrl: proxyUrl })
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error fetching profile picture')
    return NextResponse.json({ profilePicUrl: null })
  }
}
