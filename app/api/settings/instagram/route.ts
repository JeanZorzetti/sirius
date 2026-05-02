/**
 * GET /api/settings/instagram
 * Returns the Instagram connection status for the current organization.
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      organization: {
        select: {
          instagramPageAccessToken:   true,
          instagramBusinessAccountId: true,
        },
      },
    },
  })

  if (!user?.organization) {
    return NextResponse.json({ error: 'Organizacao nao encontrada' }, { status: 404 })
  }

  const { instagramPageAccessToken, instagramBusinessAccountId } = user.organization

  return NextResponse.json({
    connected: !!instagramPageAccessToken,
    instagramBusinessAccountId: instagramBusinessAccountId ?? null,
  })
}
