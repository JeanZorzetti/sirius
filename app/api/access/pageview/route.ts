import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/access/pageview — { path, pageTitle }
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    const body = await request.json()
    const { path, pageTitle } = body as { path: string; pageTitle?: string }

    if (!path) return NextResponse.json({ error: 'path obrigatório' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    })
    if (!user) return NextResponse.json({ ok: false }, { status: 404 })

    await prisma.pageViewLog.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        path,
        pageTitle: pageTitle ?? null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
