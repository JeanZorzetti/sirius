/**
 * Google Ads API Client
 *
 * Busca dados de campanhas via Google Ads API v18.
 * Requer: GOOGLE_ADS_DEVELOPER_TOKEN + OAuth2 credenciais da organização.
 *
 * Documentação: https://developers.google.com/google-ads/api/docs/start
 */

interface GoogleAdsCampaign {
  campaignId: string
  campaignName: string
  spend: number       // Reais (cost_micros / 1_000_000)
  impressions: number
  clicks: number
  conversions: number
  date: string        // YYYY-MM-DD
}

interface GoogleAdsConfig {
  customerId: string
  refreshToken: string
  developerToken: string
  clientId: string
  clientSecret: string
}

/**
 * Busca métricas de campanhas do Google Ads para um período.
 * Retorna array vazio se credenciais ausentes ou API inacessível.
 */
export async function fetchGoogleAdsCampaigns(
  config: GoogleAdsConfig,
  startDate: string,  // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
): Promise<GoogleAdsCampaign[]> {
  const { customerId, refreshToken, developerToken, clientId, clientSecret } = config

  if (!customerId || !refreshToken || !developerToken) {
    return []
  }

  try {
    // 1. Obter access token via refresh token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!tokenRes.ok) {
      console.error('[GoogleAds] Failed to refresh access token:', await tokenRes.text())
      return []
    }

    const { access_token } = await tokenRes.json()

    // 2. Query GAQL via REST API
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        segments.date
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status = 'ENABLED'
      ORDER BY segments.date ASC
    `

    const gadsRes = await fetch(
      `https://googleads.googleapis.com/v18/customers/${customerId.replace(/-/g, '')}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      }
    )

    if (!gadsRes.ok) {
      console.error('[GoogleAds] API error:', await gadsRes.text())
      return []
    }

    const { results = [] } = await gadsRes.json()

    return results.map((row: any) => ({
      campaignId: String(row.campaign?.id ?? ''),
      campaignName: row.campaign?.name ?? 'Unknown',
      spend: (row.metrics?.costMicros ?? 0) / 1_000_000,
      impressions: row.metrics?.impressions ?? 0,
      clicks: row.metrics?.clicks ?? 0,
      conversions: Math.round(row.metrics?.conversions ?? 0),
      date: row.segments?.date ?? startDate,
    }))
  } catch (err) {
    console.error('[GoogleAds] Unexpected error:', err)
    return []
  }
}
