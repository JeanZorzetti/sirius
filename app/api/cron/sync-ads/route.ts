/**
 * Sync Ads Cron Job
 *
 * ✅ FASE 17: Sincroniza dados de Google Ads e Facebook Ads diariamente.
 *
 * - Roda diariamente às 02:00 UTC
 * - Busca dados dos últimos 7 dias (janela de lookback para conversões tardias)
 * - Salva no modelo AdsMetric (upsert — idempotente)
 *
 * Configuração Vercel Cron: "0 2 * * *"
 *
 * Teste manual:
 * GET /api/cron/sync-ads?token=SEU_CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchGoogleAdsCampaigns } from '@/lib/ads/google-ads'
import { fetchFacebookAdsCampaigns } from '@/lib/ads/facebook-ads'
import { decrypt } from '@/lib/encryption'
import logger from '@/lib/logger'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  try {
    // Validar cron secret
    const authHeader = request.headers.get('authorization')
    const urlToken = request.nextUrl.searchParams.get('token')
    const cronSecret = process.env.CRON_SECRET

    const isValidToken =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      (cronSecret && urlToken === cronSecret)

    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing CRON_SECRET' },
        { status: 401 }
      )
    }

    logger.info('[CRON:SYNC-ADS] Starting ads sync...')
    const startTime = Date.now()

    // Janela de lookback: últimos 7 dias
    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setDate(endDate.getDate() - 7)

    const startStr = startDate.toISOString().split('T')[0]
    const endStr = endDate.toISOString().split('T')[0]

    // Buscar orgs com integração de ads ativa
    const orgs = await prisma.organization.findMany({
      where: { adsIntegrationEnabled: true },
      select: {
        id: true,
        googleAdsCustomerId: true,
        googleAdsRefreshToken: true,
        facebookAdAccountId: true,
        facebookAccessToken: true,
      },
    })

    const stats = { orgs: orgs.length, synced: 0, errors: 0 }
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? ''
    const googleClientId = process.env.GOOGLE_ADS_CLIENT_ID ?? ''
    const googleClientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET ?? ''

    for (const org of orgs) {
      try {
        const upsertPromises: Promise<any>[] = []

        // Google Ads
        if (org.googleAdsCustomerId && org.googleAdsRefreshToken) {
          const decryptedRefreshToken = decrypt(org.googleAdsRefreshToken)
          const campaigns = await fetchGoogleAdsCampaigns(
            {
              customerId: org.googleAdsCustomerId,
              refreshToken: decryptedRefreshToken,
              developerToken,
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            },
            startStr,
            endStr
          )

          for (const c of campaigns) {
            const cpc = c.clicks > 0 ? c.spend / c.clicks : 0
            const cpa = c.conversions > 0 ? c.spend / c.conversions : 0

            upsertPromises.push(
              prisma.adsMetric.upsert({
                where: {
                  organizationId_source_date_campaignId: {
                    organizationId: org.id,
                    source: 'google_ads',
                    date: new Date(c.date),
                    campaignId: c.campaignId,
                  },
                },
                create: {
                  organizationId: org.id,
                  source: 'google_ads',
                  date: new Date(c.date),
                  campaignId: c.campaignId,
                  campaignName: c.campaignName,
                  spend: c.spend,
                  impressions: c.impressions,
                  clicks: c.clicks,
                  conversions: c.conversions,
                  cpc,
                  cpa,
                },
                update: {
                  campaignName: c.campaignName,
                  spend: c.spend,
                  impressions: c.impressions,
                  clicks: c.clicks,
                  conversions: c.conversions,
                  cpc,
                  cpa,
                },
              })
            )
          }
        }

        // Facebook Ads
        if (org.facebookAdAccountId && org.facebookAccessToken) {
          const decryptedAccessToken = decrypt(org.facebookAccessToken)
          const campaigns = await fetchFacebookAdsCampaigns(
            org.facebookAdAccountId,
            decryptedAccessToken,
            startStr,
            endStr
          )

          for (const c of campaigns) {
            const cpc = c.clicks > 0 ? c.spend / c.clicks : 0
            const cpa = c.conversions > 0 ? c.spend / c.conversions : 0

            upsertPromises.push(
              prisma.adsMetric.upsert({
                where: {
                  organizationId_source_date_campaignId: {
                    organizationId: org.id,
                    source: 'facebook_ads',
                    date: new Date(c.date),
                    campaignId: c.campaignId,
                  },
                },
                create: {
                  organizationId: org.id,
                  source: 'facebook_ads',
                  date: new Date(c.date),
                  campaignId: c.campaignId,
                  campaignName: c.campaignName,
                  spend: c.spend,
                  impressions: c.impressions,
                  clicks: c.clicks,
                  conversions: c.conversions,
                  cpc,
                  cpa,
                },
                update: {
                  campaignName: c.campaignName,
                  spend: c.spend,
                  impressions: c.impressions,
                  clicks: c.clicks,
                  conversions: c.conversions,
                  cpc,
                  cpa,
                },
              })
            )
          }
        }

        await Promise.all(upsertPromises)

        // Atualizar timestamp de última sincronização
        await prisma.organization.update({
          where: { id: org.id },
          data: { adsLastSyncAt: new Date() },
        })

        stats.synced++
        logger.info({ orgId: org.id, records: upsertPromises.length }, '[CRON:SYNC-ADS] Org synced')
      } catch (err) {
        stats.errors++
        logger.error({ err, orgId: org.id }, '[CRON:SYNC-ADS] Error syncing org')
      }
    }

    const duration = Date.now() - startTime
    logger.info({ ...stats, duration: `${duration}ms` }, '[CRON:SYNC-ADS] Job completed')

    return NextResponse.json({
      success: true,
      message: 'Ads sync completed',
      stats: { ...stats, duration: `${duration}ms` },
    })
  } catch (error) {
    logger.error({ error }, '[CRON:SYNC-ADS] Critical error')
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
