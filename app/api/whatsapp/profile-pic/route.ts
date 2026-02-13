/**
 * API Route: /api/whatsapp/profile-pic
 *
 * Fetch WhatsApp profile picture URL for a contact
 * GET ?contactId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrgEvolutionClient } from '@/lib/evolution-api-client'
import logger from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    const contactId = req.nextUrl.searchParams.get('contactId')
    if (!contactId) {
      return NextResponse.json({ error: 'contactId required' }, { status: 400 })
    }

    // Find contact
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId: user.organizationId,
      },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 })
    }

    // If we already have a cached profile pic, return it
    if (contact.profilePicUrl) {
      return NextResponse.json({ profilePicUrl: contact.profilePicUrl })
    }

    // Skip groups
    if (contact.phone?.includes('@g.us')) {
      return NextResponse.json({ profilePicUrl: null })
    }

    // Find active connection
    const connection = await prisma.whatsAppConnection.findFirst({
      where: {
        organizationId: user.organizationId,
        status: 'CONNECTED',
      },
    })

    if (!connection) {
      return NextResponse.json({ profilePicUrl: null })
    }

    const client = await getOrgEvolutionClient(user.organizationId)
    if (!client) {
      return NextResponse.json({ profilePicUrl: null })
    }

    // Format phone number for Evolution API
    const phone = contact.phone?.replace('@s.whatsapp.net', '') || ''
    if (!phone) {
      return NextResponse.json({ profilePicUrl: null })
    }

    const result = await client.fetchProfilePictureUrl(
      connection.instanceName,
      phone,
    )

    // Cache the result
    if (result.profilePictureUrl) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { profilePicUrl: result.profilePictureUrl },
      })
    }

    return NextResponse.json({
      profilePicUrl: result.profilePictureUrl,
    })
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error fetching profile picture')
    return NextResponse.json({ profilePicUrl: null })
  }
}
