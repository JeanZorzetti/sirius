import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        organizationId: true,
        organization: {
          select: {
            googleCalendarEnabled: true,
            googleCalendarEmail: true,
          },
        },
      },
    })

    if (!user?.organization) {
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: user.organization.googleCalendarEnabled ?? false,
      email: user.organization.googleCalendarEmail ?? null,
    })
  } catch {
    return NextResponse.json({ connected: false })
  }
}
