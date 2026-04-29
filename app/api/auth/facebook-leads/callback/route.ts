/**
 * GET /api/auth/facebook-leads/callback
 * Callback OAuth do Facebook.
 * Troca o code por tokens, busca as Páginas do usuário e salva.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import logger from '@/lib/logger'

const FACEBOOK_APP_ID     = process.env.FACEBOOK_APP_ID!
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!
const REDIRECT_URI        = `${process.env.NEXTAUTH_URL}/api/auth/facebook-leads/callback`
const GRAPH_BASE          = 'https://graph.facebook.com/v21.0'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/dashboard/settings/integrations/facebook-ads?error=unauthorized', request.url))
  }

  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    logger.warn({ error }, '[FB:OAUTH] User denied or missing params')
    return NextResponse.redirect(new URL('/dashboard/settings/integrations/facebook-ads?error=denied', request.url))
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true, organization: { select: { id: true, facebookOAuthState: true } } },
  })

  if (!user?.organization) {
    return NextResponse.redirect(new URL('/dashboard/settings/integrations/facebook-ads?error=org_not_found', request.url))
  }

  // Valida anti-CSRF state
  if (user.organization.facebookOAuthState !== state) {
    logger.warn({ orgId: user.organization.id }, '[FB:OAUTH] State mismatch — possible CSRF')
    return NextResponse.redirect(new URL('/dashboard/settings/integrations/facebook-ads?error=state_mismatch', request.url))
  }

  try {
    // 1. Troca code por User Access Token
    const tokenParams = new URLSearchParams({
      client_id:     FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      redirect_uri:  REDIRECT_URI,
      code,
    })

    const tokenRes = await fetch(`${GRAPH_BASE}/oauth/access_token?${tokenParams}`)
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      logger.error({ tokenData }, '[FB:OAUTH] Failed to get access token')
      return NextResponse.redirect(new URL('/dashboard/settings/integrations/facebook-ads?error=token_failed', request.url))
    }

    const userAccessToken: string = tokenData.access_token

    // 2. Busca as Páginas que o usuário administra com seus Page Tokens
    const pagesRes = await fetch(
      `${GRAPH_BASE}/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`
    )
    const pagesData = await pagesRes.json()
    const pages: Array<{ id: string; name: string; access_token: string }> = pagesData.data ?? []

    // 3. Salva o user token e as páginas disponíveis na org
    //    (usuário vai escolher qual Página usar na UI)
    await prisma.organization.update({
      where: { id: user.organization.id },
      data: {
        facebookUserAccessToken: encrypt(userAccessToken),
        facebookAvailablePages:  JSON.stringify(pages.map(p => ({ id: p.id, name: p.name }))),
        facebookOAuthState:      null, // limpa o state após uso
        // Se só tem uma página, já seleciona automaticamente
        ...(pages.length === 1 ? {
          facebookPageId:          pages[0].id,
          facebookPageAccessToken: encrypt(pages[0].access_token),
        } : {}),
      },
    })

    logger.info({ orgId: user.organization.id, pagesCount: pages.length }, '[FB:OAUTH] OAuth completed')

    // Redireciona para a página de settings com sucesso
    const successUrl = pages.length === 1
      ? '/dashboard/settings/integrations/facebook-ads?success=connected'
      : '/dashboard/settings/integrations/facebook-ads?success=select_page'

    return NextResponse.redirect(new URL(successUrl, request.url))
  } catch (err) {
    logger.error({ err }, '[FB:OAUTH] Unexpected error')
    return NextResponse.redirect(new URL('/dashboard/settings/integrations/facebook-ads?error=unexpected', request.url))
  }
}
