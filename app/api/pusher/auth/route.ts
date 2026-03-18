import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPusher } from '@/lib/pusher'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  })

  if (!user?.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 403 })
  }

  // pusher-js sends body as application/x-www-form-urlencoded
  const body = await request.text()
  const params = new URLSearchParams(body)
  const socketId = params.get('socket_id')
  const channelName = params.get('channel_name')

  if (!socketId || !channelName) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  // Validate user can only subscribe to their own org channel
  const expectedChannel = `private-org-${user.organizationId}`
  if (channelName !== expectedChannel) {
    return NextResponse.json({ error: 'Forbidden channel' }, { status: 403 })
  }

  const authResponse = getPusher().authorizeChannel(socketId, channelName)
  return NextResponse.json(authResponse)
}
