/**
 * GET/PATCH /api/settings/ads
 * ✅ FASE 17: Lê e salva credenciais de Ads da organização
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { encrypt } from '@/lib/encryption'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        organization: {
          select: {
            googleAdsCustomerId: true,
            googleAdsRefreshToken: true,
            facebookAdAccountId: true,
            facebookAccessToken: true,
            adsIntegrationEnabled: true,
            adsLastSyncAt: true,
            facebookPageId: true,
            facebookPageAccessToken: true,
            facebookWebhookVerifyToken: true,
          },
        },
      },
    })

    if (!user?.organization) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    const org = user.organization
    return NextResponse.json({
      googleAdsCustomerId: org.googleAdsCustomerId,
      googleAdsRefreshToken: org.googleAdsRefreshToken ? '••••••••' : null,
      facebookAdAccountId: org.facebookAdAccountId,
      facebookAccessToken: org.facebookAccessToken ? '••••••••' : null,
      adsIntegrationEnabled: org.adsIntegrationEnabled,
      adsLastSyncAt: org.adsLastSyncAt,
      // Lead Ads webhook
      facebookPageId: org.facebookPageId,
      facebookPageAccessToken: org.facebookPageAccessToken ? '••••••••' : null,
      facebookWebhookVerifyToken: org.facebookWebhookVerifyToken,
    })
  } catch (error) {
    logger.error({ error }, '[SETTINGS:ADS] GET error')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404, { req: request })
    }

    const body = await request.json()
    const updateData: Record<string, any> = {}

    // Campos permitidos
    if ('googleAdsCustomerId' in body) updateData.googleAdsCustomerId = body.googleAdsCustomerId || null
    if ('googleAdsRefreshToken' in body) {
      updateData.googleAdsRefreshToken = body.googleAdsRefreshToken
        ? encrypt(body.googleAdsRefreshToken)
        : null
    }
    if ('facebookAdAccountId' in body) updateData.facebookAdAccountId = body.facebookAdAccountId || null
    if ('facebookAccessToken' in body) {
      updateData.facebookAccessToken = body.facebookAccessToken
        ? encrypt(body.facebookAccessToken)
        : null
    }
    if ('adsIntegrationEnabled' in body) updateData.adsIntegrationEnabled = Boolean(body.adsIntegrationEnabled)

    // Lead Ads webhook fields
    if ('facebookPageId' in body) updateData.facebookPageId = body.facebookPageId || null
    if ('facebookPageAccessToken' in body) {
      updateData.facebookPageAccessToken = body.facebookPageAccessToken
        ? encrypt(body.facebookPageAccessToken)
        : null
    }
    if ('facebookWebhookVerifyToken' in body) {
      updateData.facebookWebhookVerifyToken = body.facebookWebhookVerifyToken || null
    }

    // Auto-ativar integração se qualquer credencial for fornecida
    if (updateData.googleAdsCustomerId || updateData.facebookAdAccountId) {
      updateData.adsIntegrationEnabled = true
    }

    await prisma.organization.update({
      where: { id: user.organizationId },
      data: updateData,
    })

    logger.info({ orgId: user.organizationId, fields: Object.keys(updateData) }, '[SETTINGS:ADS] Updated')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, '[SETTINGS:ADS] PATCH error')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}
