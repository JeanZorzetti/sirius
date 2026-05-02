/**
 * GET /api/auth/instagram
 * Inicia o fluxo OAuth do Instagram (via Meta) para obter um Page Access Token.
 * Redireciona o usuario para a tela de autorizacao da Meta.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const runtime = 'nodejs'

const FACEBOOK_APP_ID = process.env.INSTAGRAM_APP_ID!
const SCOPES = [
  'instagram_basic',
  'instagram_business_basic',
  'instagram_business_content_publish',
  'pages_show_list',
  'pages_read_engagement',
].join(',')

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true },
  })

  if (!user?.organizationId) {
    return NextResponse.json({ error: 'Organizacao nao encontrada' }, { status: 404 })
  }

  // Deriva o origin real via headers de proxy, com fallback para NEXTAUTH_URL
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : (process.env.NEXTAUTH_URL ?? new URL(request.url).origin)
  const redirectUri = `${origin}/api/auth/instagram/callback`

  // Gera state anti-CSRF unico por tentativa
  const state = crypto.randomBytes(16).toString('hex')

  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { instagramOAuthState: state },
  })

  const params = new URLSearchParams({
    client_id:     FACEBOOK_APP_ID,
    redirect_uri:  redirectUri,
    scope:         SCOPES,
    response_type: 'code',
    state,
  })

  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?${params}`
  return NextResponse.redirect(authUrl)
}
