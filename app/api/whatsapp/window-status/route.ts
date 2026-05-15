/**
 * GET /api/whatsapp/window-status?contactId=xxx
 *
 * Reports whether the 24h Meta conversation window is open for a given
 * contact, and if so, how many minutes remain until it closes.
 *
 * UI uses this to decide whether to show the template picker prominently
 * vs the regular text input.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { minutesRemainingInWindow } from '@/lib/whatsapp/waba-window-check'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const contactId = request.nextUrl.searchParams.get('contactId')
  if (!contactId) return NextResponse.json({ error: 'contactId required' }, { status: 400 })

  // Verify ownership
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, organizationId: user.organizationId },
    select: { id: true },
  })
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  const minutes = await minutesRemainingInWindow(contactId, user.organizationId)

  return NextResponse.json({
    open: minutes !== null,
    minutesRemaining: minutes,
    /** Approximate UTC time when the window will close (null if already closed). */
    closesAt: minutes !== null ? new Date(Date.now() + minutes * 60_000).toISOString() : null,
  })
}
