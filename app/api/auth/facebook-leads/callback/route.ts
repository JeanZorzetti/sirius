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
const GRAPH_BASE          = 'https://graph.facebook.com/v21.0'

function getOrigin(request: NextRequest): string {
  const forwardedHost  = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`
  return process.env.NEXTAUTH_URL ?? new URL(request.url).origin
}

export async function GET(request: NextRequest) {
  const origin = getOrigin(request)

  const session = await getSession()
  if (!session?.user?.email) {
    return NextResponse.redirect(`${origin}/dashboard/settings/integrations/facebook-ads?error=unauthorized`)
  }

  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    logger.warn({ error }, '[FB:OAUTH] User denied or missing params')
    return NextResponse.redirect(`${origin}/dashboard/settings/integrations/facebook-ads?error=denied`)
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true, organization: { select: { id: true, facebookOAuthState: true } } },
  })

  if (!user?.organization) {
    return NextResponse.redirect(`${origin}/dashboard/settings/integrations/facebook-ads?error=org_not_found`)
  }

  if (user.organization.facebookOAuthState !== state) {
    logger.warn({ orgId: user.organization.id }, '[FB:OAUTH] State mismatch — possible CSRF')
    return NextResponse.redirect(`${origin}/dashboard/settings/integrations/facebook-ads?error=state_mismatch`)
  }

  try {
    const redirectUri = `${origin}/api/auth/facebook-leads/callback`

    const tokenParams = new URLSearchParams({
      client_id:     FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      redirect_uri:  redirectUri,
      code,
    })

    const tokenRes  = await fetch(`${GRAPH_BASE}/oauth/access_token?${tokenParams}`)
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      logger.error({ tokenData }, '[FB:OAUTH] Failed to get access token')
      return NextResponse.redirect(`${origin}/dashboard/settings/integrations/facebook-ads?error=token_failed`)
    }

    const userAccessToken: string = tokenData.access_token

    const pagesRes  = await fetch(
      `${GRAPH_BASE}/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`
    )
    const pagesData = await pagesRes.json()
    const pages: Array<{ id: string; name: string; access_token: string }> = pagesData.data ?? []

    await prisma.organization.update({
      where: { id: user.organization.id },
      data: {
        facebookUserAccessToken: encrypt(userAccessToken),
        facebookAvailablePages:  JSON.stringify(pages.map(p => ({ id: p.id, name: p.name }))),
        facebookOAuthState:      null,
        ...(pages.length === 1 ? {
          facebookPageId:          pages[0].id,
          facebookPageAccessToken: encrypt(pages[0].access_token),
        } : {}),
      },
    })

    logger.info({ orgId: user.organization.id, pagesCount: pages.length }, '[FB:OAUTH] OAuth completed')

    const successPath = pages.length === 1
      ? '/dashboard/settings/integrations/facebook-ads?success=connected'
      : '/dashboard/settings/integrations/facebook-ads?success=select_page'

    return NextResponse.redirect(`${origin}${successPath}`)
  } catch (err) {
    logger.error({ err }, '[FB:OAUTH] Unexpected error')
    return NextResponse.redirect(`${origin}/dashboard/settings/integrations/facebook-ads?error=unexpected`)
  }
}
