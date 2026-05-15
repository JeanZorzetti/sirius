import { prismaWa } from '@/lib/prisma-wa'

/**
 * Meta Cloud API enforces a 24-hour conversation window: free-form messages
 * can only be sent if the contact has messaged you in the last 24 hours.
 * Outside the window only pre-approved templates may be sent.
 */
export async function isWithin24hWindow(
  contactId: string,
  organizationId: string
): Promise<boolean> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const lastInbound = await prismaWa.whatsAppMessage.findFirst({
    where: {
      contactId,
      organizationId,
      direction: 'INBOUND',
      sentAt: { gte: cutoff },
    },
    select: { id: true, sentAt: true },
  })
  return !!lastInbound
}

/**
 * Returns minutes remaining in the 24h window, or null if the window has
 * already closed (i.e. no inbound in the last 24h).
 */
export async function minutesRemainingInWindow(
  contactId: string,
  organizationId: string
): Promise<number | null> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const lastInbound = await prismaWa.whatsAppMessage.findFirst({
    where: {
      contactId,
      organizationId,
      direction: 'INBOUND',
      sentAt: { gte: cutoff },
    },
    orderBy: { sentAt: 'desc' },
    select: { sentAt: true },
  })
  if (!lastInbound) return null
  const expires = lastInbound.sentAt.getTime() + 24 * 60 * 60 * 1000
  return Math.max(0, Math.floor((expires - Date.now()) / 60_000))
}
