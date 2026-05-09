/**
 * GET /api/auth/facebook-leads
 * Inicia o fluxo OAuth do Facebook para Lead Ads.
 * Redireciona o usuário para a tela de autorização da Meta.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!
const SCOPES = [
  'leads_retrieval',
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_ads',
  'pages_manage_metadata',
  'business_management',
].join(',')

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) {
    return await apiError(ERR.UNAUTHORIZED, 401, { req })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true },
  })

  if (!user?.organizationId) {
    return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
  }

  // Deriva o origin real via headers de proxy, com fallback para NEXTAUTH_URL
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : (process.env.NEXTAUTH_URL ?? new URL(request.url).origin)
  const redirectUri = `${origin}/api/auth/facebook-leads/callback`

  // Gera state anti-CSRF único por tentativa
  const state = crypto.randomBytes(16).toString('hex')

  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { facebookOAuthState: state },
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
