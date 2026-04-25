import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session?.user?.email) {
    return NextResponse.json({ count: 0 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user?.organizationId) return NextResponse.json({ count: 0 })

    // Import prismaWa only if WhatsApp integration is configured
    const { prismaWa } = await import('@/lib/prisma-wa')

    const rows = await prismaWa.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(*) as cnt
      FROM "Message" m
      JOIN "Contact" c ON c.id = m."contactId"
      WHERE c."organizationId" = ${user.organizationId}
        AND m."fromMe" = false
        AND m."read" = false
    `

    const count = rows[0]?.cnt ? Number(rows[0].cnt) : 0
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
