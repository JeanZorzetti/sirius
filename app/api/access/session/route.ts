import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/access/session — action: "login" | "logout", sessionId for logout
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { action, sessionId } = body as { action: 'login' | 'logout'; sessionId?: string }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? null
    const ua = request.headers.get('user-agent') ?? null

    if (action === 'login') {
      const created = await prisma.accessSession.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          ipAddress: ip,
          userAgent: ua,
        },
      })
      return NextResponse.json({ sessionId: created.id })
    }

    if (action === 'logout' && sessionId) {
      const existing = await prisma.accessSession.findUnique({ where: { id: sessionId } })
      if (existing && !existing.logoutAt) {
        const durationS = Math.round((Date.now() - existing.loginAt.getTime()) / 1000)
        await prisma.accessSession.update({
          where: { id: sessionId },
          data: { logoutAt: new Date(), durationS },
        })
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
