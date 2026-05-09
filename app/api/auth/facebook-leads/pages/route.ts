/**
 * GET  /api/auth/facebook-leads/pages — lista páginas disponíveis após OAuth
 * POST /api/auth/facebook-leads/pages — seleciona a página ativa
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/encryption'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

const GRAPH_BASE = 'https://graph.facebook.com/v21.0'

export async function GET() {
  const session = await getSession()
  if (!session?.user?.email) {
    return await apiError(ERR.UNAUTHORIZED, 401, { req })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      organization: {
        select: {
          facebookAvailablePages: true,
          facebookPageId: true,
        },
      },
    },
  })

  const pages = user?.organization?.facebookAvailablePages
    ? JSON.parse(user.organization.facebookAvailablePages)
    : []

  return NextResponse.json({
    pages,
    selectedPageId: user?.organization?.facebookPageId ?? null,
  })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) {
    return await apiError(ERR.UNAUTHORIZED, 401, { req })
  }

  const { pageId } = await request.json()
  if (!pageId) {
    return NextResponse.json({ error: 'pageId obrigatório' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      organizationId: true,
      organization: {
        select: {
          facebookUserAccessToken: true,
          facebookAvailablePages: true,
        },
      },
    },
  })

  if (!user?.organization?.facebookUserAccessToken) {
    return NextResponse.json({ error: 'OAuth não realizado' }, { status: 400 })
  }

  const userToken = decrypt(user.organization.facebookUserAccessToken)

  // Busca o page token atualizado via Graph API
  const pagesRes = await fetch(
    `${GRAPH_BASE}/me/accounts?fields=id,name,access_token&access_token=${userToken}`
  )
  const pagesData = await pagesRes.json()
  const pages: Array<{ id: string; name: string; access_token: string }> = pagesData.data ?? []

  const selected = pages.find(p => p.id === pageId)
  if (!selected) {
    return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 })
  }

  await prisma.organization.update({
    where: { id: user.organizationId! },
    data: {
      facebookPageId:          selected.id,
      facebookPageAccessToken: encrypt(selected.access_token),
    },
  })

  logger.info({ orgId: user.organizationId, pageId: selected.id }, '[FB:PAGES] Page selected')

  // Inscreve o webhook na página selecionada
  let subscriptionError: unknown = null
  try {
    const subRes = await fetch(
      `${GRAPH_BASE}/${selected.id}/subscribed_apps`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscribed_fields: ['leadgen'],
          access_token: selected.access_token,
        }),
      }
    )
    const subData = await subRes.json()
    if (!subData.success) {
      subscriptionError = subData
      logger.warn({ subData, pageId: selected.id }, '[FB:PAGES] subscribed_apps returned non-success')
    } else {
      logger.info({ pageId: selected.id }, '[FB:PAGES] Webhook subscribed to leadgen events')
    }
  } catch (err) {
    subscriptionError = err
    logger.warn({ err }, '[FB:PAGES] Could not subscribe webhook')
  }

  return NextResponse.json({
    success: true,
    pageId: selected.id,
    pageName: selected.name,
    subscriptionError: subscriptionError ?? null,
  })
}
