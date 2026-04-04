/**
 * POST /api/admin/sync-contacts
 *
 * Pulls contact names from the WhatsApp gateway and updates
 * contacts in the CRM that have generic/phone-number names.
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import logger from '@/lib/logger'

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export async function POST() {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  })

  if (!user?.organizationId) {
    return NextResponse.json({ error: 'Org not found' }, { status: 404 })
  }

  // Get active WhatsApp connections
  const connections = await prismaWa.whatsAppConnection.findMany({
    where: { organizationId: user.organizationId, status: 'CONNECTED' },
    select: { instanceName: true },
  })

  if (connections.length === 0) {
    return NextResponse.json({ error: 'No active WhatsApp connection' }, { status: 400 })
  }

  const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL
  const apiKey = process.env.WHATSAPP_GATEWAY_API_KEY

  if (!gatewayUrl || !apiKey) {
    return NextResponse.json({ error: 'Gateway not configured' }, { status: 500 })
  }

  let totalUpdated = 0

  for (const conn of connections) {
    try {
      const res = await fetch(`${gatewayUrl}/api/instances/${conn.instanceName}/contacts`, {
        headers: { 'X-API-Key': apiKey },
      })

      if (!res.ok) {
        logger.warn({ instanceId: conn.instanceName, status: res.status }, 'Failed to fetch contacts from gateway')
        continue
      }

      const gatewayContacts: Array<{
        jid: string
        phone: string
        pushName: string
        businessName: string
        fullName: string
      }> = await res.json()

      // Build phone-to-name map
      const nameMap = new Map<string, string>()
      for (const gc of gatewayContacts) {
        const name = gc.pushName || gc.businessName || gc.fullName
        if (name && gc.phone) {
          nameMap.set(normalizePhone(gc.phone), name)
        }
      }

      // Find CRM contacts with generic names (name equals phone or is digits only)
      const crmContacts = await prisma.contact.findMany({
        where: { organizationId: user.organizationId },
        select: { id: true, name: true, phone: true },
      })

      for (const c of crmContacts) {
        const normalized = normalizePhone(c.phone || '')
        const isGenericName = !c.name || c.name === c.phone || /^\d+$/.test(c.name.replace(/\D/g, ''))

        if (isGenericName && normalized) {
          // Try exact match or suffix match (some phones stored with/without country code)
          let newName = nameMap.get(normalized)
          if (!newName) {
            for (const [phone, name] of nameMap) {
              if (phone.endsWith(normalized) || normalized.endsWith(phone)) {
                newName = name
                break
              }
            }
          }

          if (newName) {
            await prisma.contact.update({
              where: { id: c.id },
              data: { name: newName },
            })
            totalUpdated++
          }
        }
      }
    } catch (err) {
      logger.error({ err, instanceId: conn.instanceName }, 'Error syncing contacts')
    }
  }

  logger.info({ totalUpdated }, 'sync-contacts: updated contact names')

  return NextResponse.json({ updated: totalUpdated })
}
