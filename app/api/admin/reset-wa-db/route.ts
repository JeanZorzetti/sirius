/**
 * POST /api/admin/reset-wa-db
 * Admin-only: truncate all WhatsApp data from WA DB (orphaned Evolution/whatsmeow data)
 * Requires explicit confirmation body: { confirm: "RESET_WA_DB" }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prismaWa } from '@/lib/prisma-wa'

const ADMIN_EMAIL = 'jeanzorzetti@gmail.com'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  if (body.confirm !== 'RESET_WA_DB') {
    return NextResponse.json({ error: 'Missing confirmation. Send { confirm: "RESET_WA_DB" }' }, { status: 400 })
  }

  const [reactions, messages, connections, quickReplies] = await Promise.all([
    prismaWa.messageReaction.deleteMany({}),
    prismaWa.whatsAppMessage.deleteMany({}),
    prismaWa.whatsAppConnection.deleteMany({}),
    prismaWa.quickReply.deleteMany({}),
  ])

  return NextResponse.json({
    success: true,
    deleted: {
      reactions: reactions.count,
      messages: messages.count,
      connections: connections.count,
      quickReplies: quickReplies.count,
    }
  })
}
