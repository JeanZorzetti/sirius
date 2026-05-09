/**
 * POST /api/auth/facebook-leads/subscribe
 * Re-subscribes the selected page to leadgen webhook events.
 * Returns full Graph API response for debugging.
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

const GRAPH_BASE = 'https://graph.facebook.com/v21.0'

export async function GET() {
  return POST()
}

export async function POST() {
  const session = await getSession()
  if (!session?.user?.email) {
    return await apiError(ERR.UNAUTHORIZED, 401, { req })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      organization: {
        select: {
          facebookPageId: true,
          facebookPageAccessToken: true,
          facebookUserAccessToken: true,
          facebookAvailablePages: true,
        },
      },
    },
  })

  if (!user?.organization?.facebookPageId || !user.organization.facebookPageAccessToken) {
    return NextResponse.json({ error: 'Página não configurada' }, { status: 400 })
  }

  const pageId = user.organization.facebookPageId
  const pageToken = decrypt(user.organization.facebookPageAccessToken)

  // 1. Check current subscriptions
  const checkRes = await fetch(`${GRAPH_BASE}/${pageId}/subscribed_apps?access_token=${pageToken}`)
  const checkData = await checkRes.json()

  // 2. Subscribe to leadgen events
  const subRes = await fetch(`${GRAPH_BASE}/${pageId}/subscribed_apps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscribed_fields: ['leadgen'],
      access_token: pageToken,
    }),
  })
  const subData = await subRes.json()

  // 3. Check token debug info
  const userToken = user.organization.facebookUserAccessToken
    ? decrypt(user.organization.facebookUserAccessToken)
    : null

  let tokenDebug = null
  if (userToken) {
    const debugRes = await fetch(
      `${GRAPH_BASE}/debug_token?input_token=${pageToken}&access_token=${userToken}`
    )
    tokenDebug = await debugRes.json()
  }

  logger.info({ pageId, subData, checkData }, '[FB:SUBSCRIBE] Manual subscription attempt')

  return NextResponse.json({
    pageId,
    currentSubscriptions: checkData,
    subscriptionResult: subData,
    tokenDebug,
  })
}
