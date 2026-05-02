/**
 * GET /api/auth/instagram/callback
 * Callback OAuth do Instagram (via Meta).
 * Troca o code por tokens, busca as Paginas com conta IG e salva.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import logger from '@/lib/logger'

export const runtime = 'nodejs'

const FACEBOOK_APP_ID     = process.env.INSTAGRAM_APP_ID!
const FACEBOOK_APP_SECRET = process.env.INSTAGRAM_APP_SECRET!
const GRAPH_BASE          = 'https://graph.facebook.com/v21.0'

function getOrigin(request: NextRequest): string {
  const forwardedHost  = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`
  return process.env.NEXTAUTH_URL ?? new URL(request.url).origin
}

const ERROR_BASE = '/dashboard/settings/integrations/instagram?error='

export async function GET(request: NextRequest) {
  const origin = getOrigin(request)

  const session = await getSession()
  if (!session?.user?.email) {
    return NextResponse.redirect(`${origin}${ERROR_BASE}unauthorized`)
  }

  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !state) {
    logger.warn({ error }, '[IG:OAUTH] User denied or missing params')
    return NextResponse.redirect(`${origin}${ERROR_BASE}denied`)
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      organizationId: true,
      organization: { select: { id: true, instagramOAuthState: true } },
    },
  })

  if (!user?.organization) {
    return NextResponse.redirect(`${origin}${ERROR_BASE}org_not_found`)
  }

  if (user.organization.instagramOAuthState !== state) {
    logger.warn({ orgId: user.organization.id }, '[IG:OAUTH] State mismatch — possible CSRF')
    return NextResponse.redirect(`${origin}${ERROR_BASE}state_mismatch`)
  }

  try {
    const redirectUri = `${origin}/api/auth/instagram/callback`

    const tokenParams = new URLSearchParams({
      client_id:     FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      redirect_uri:  redirectUri,
      code,
    })

    const tokenRes  = await fetch(`${GRAPH_BASE}/oauth/access_token?${tokenParams}`)
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      logger.error({ tokenData }, '[IG:OAUTH] Failed to get access token')
      return NextResponse.redirect(`${origin}${ERROR_BASE}token_failed`)
    }

    const userAccessToken: string = tokenData.access_token

    // Busca paginas com o campo instagram_business_account
    const pagesRes  = await fetch(
      `${GRAPH_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${userAccessToken}`
    )
    const pagesData = await pagesRes.json()

    interface PageEntry {
      id: string
      name: string
      access_token: string
      instagram_business_account?: { id: string }
    }

    const allPages: PageEntry[] = pagesData.data ?? []

    // Filtra apenas paginas que tem conta Instagram Business vinculada
    const pagesWithIg = allPages.filter(p => !!p.instagram_business_account?.id)

    if (pagesWithIg.length === 0) {
      logger.warn({ orgId: user.organization.id, totalPages: allPages.length }, '[IG:OAUTH] No pages with Instagram Business Account found')
      await prisma.organization.update({
        where: { id: user.organization.id },
        data: { instagramOAuthState: null },
      })
      return NextResponse.redirect(`${origin}${ERROR_BASE}no_instagram_account`)
    }

    // Usa a primeira pagina com conta IG (ou a unica)
    const page = pagesWithIg[0]
    const igBusinessAccountId = page.instagram_business_account!.id

    await prisma.organization.update({
      where: { id: user.organization.id },
      data: {
        instagramPageAccessToken:   encrypt(page.access_token),
        instagramBusinessAccountId: igBusinessAccountId,
        instagramOAuthState:        null,
      },
    })

    logger.info(
      { orgId: user.organization.id, igBusinessAccountId, pageId: page.id },
      '[IG:OAUTH] OAuth completed'
    )

    return NextResponse.redirect(
      `${origin}/dashboard/settings/integrations/instagram?success=connected`
    )
  } catch (err) {
    logger.error({ err }, '[IG:OAUTH] Unexpected error')
    return NextResponse.redirect(`${origin}${ERROR_BASE}unexpected`)
  }
}
