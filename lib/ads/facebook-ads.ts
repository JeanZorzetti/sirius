/**
 * Facebook / Meta Ads API Client
 *
 * Busca dados de campanhas via Marketing API do Meta (Graph API v21.0).
 * Requer: facebookAccessToken + facebookAdAccountId da organização.
 *
 * Documentação: https://developers.facebook.com/docs/marketing-api
 */

interface FacebookAdsCampaign {
  campaignId: string
  campaignName: string
  spend: number       // Reais
  impressions: number
  clicks: number
  conversions: number
  date: string        // YYYY-MM-DD
}

const GRAPH_API_VERSION = 'v21.0'
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

/**
 * Busca métricas de campanhas do Facebook Ads para um período.
 * Retorna array vazio se credenciais ausentes ou API inacessível.
 */
export async function fetchFacebookAdsCampaigns(
  adAccountId: string,
  accessToken: string,
  startDate: string,  // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
): Promise<FacebookAdsCampaign[]> {
  if (!adAccountId || !accessToken) {
    return []
  }

  try {
    const fields = 'campaign_id,campaign_name,spend,impressions,clicks,actions,date_start'
    const params = new URLSearchParams({
      time_range: JSON.stringify({ since: startDate, until: endDate }),
      fields,
      time_increment: '1', // Um registro por dia
      level: 'campaign',
      access_token: accessToken,
      limit: '500',
    })

    const res = await fetch(
      `${GRAPH_API_BASE}/${adAccountId}/insights?${params}`,
      { method: 'GET' }
    )

    if (!res.ok) {
      console.error('[FacebookAds] API error:', await res.text())
      return []
    }

    const { data = [] } = await res.json()

    return data.map((row: any) => {
      // Conversions: soma das ações de lead/purchase
      const actions: Array<{ action_type: string; value: string }> = row.actions ?? []
      const conversions = actions
        .filter(a => ['lead', 'purchase', 'subscribe', 'complete_registration'].includes(a.action_type))
        .reduce((sum, a) => sum + parseFloat(a.value || '0'), 0)

      return {
        campaignId: row.campaign_id ?? '',
        campaignName: row.campaign_name ?? 'Unknown',
        spend: parseFloat(row.spend ?? '0'),
        impressions: parseInt(row.impressions ?? '0', 10),
        clicks: parseInt(row.clicks ?? '0', 10),
        conversions: Math.round(conversions),
        date: row.date_start ?? startDate,
      }
    })
  } catch (err) {
    console.error('[FacebookAds] Unexpected error:', err)
    return []
  }
}
