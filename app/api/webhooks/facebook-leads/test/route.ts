/**
 * GET /api/webhooks/facebook-leads/test
 * Simula um payload de lead do Facebook para debug.
 * REMOVER após confirmar que o webhook está funcionando.
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { fetchLeadData } from '@/lib/ads/facebook-lead-ads'
import { decrypt } from '@/lib/encryption'

export async function GET() {
  const session = await getSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Busca a org do usuário logado
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      organization: {
        select: {
          id: true,
          facebookPageId: true,
          facebookPageAccessToken: true,
        },
      },
    },
  })

  if (!user?.organization?.facebookPageId) {
    return NextResponse.json({ error: 'Página não configurada', org: user?.organization })
  }

  const org = user.organization
  const pageToken = org.facebookPageAccessToken ? decrypt(org.facebookPageAccessToken) : null

  // Testa se consegue buscar leads recentes da página
  let recentLeads = null
  let leadFetchError = null
  if (pageToken) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${org.facebookPageId}/leadgen_forms?fields=id,name,leads{id,field_data}&access_token=${pageToken}`
      )
      recentLeads = await res.json()
    } catch (e) {
      leadFetchError = String(e)
    }
  }

  // Conta leads no banco
  const leadsInDb = await prisma.facebookLead.count({
    where: { organizationId: org.id },
  })

  return NextResponse.json({
    org: {
      id: org.id,
      facebookPageId: org.facebookPageId,
      hasPageToken: !!pageToken,
    },
    leadsInDb,
    recentLeads,
    leadFetchError,
  })
}
