const GRAPH_API_VERSION = 'v21.0'
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

export interface FacebookLeadData {
  leadgenId: string
  name: string | null
  email: string | null
  phone: string | null
  rawFields: Record<string, string>
}

/**
 * Busca os dados de um lead pelo leadgen_id na Graph API do Meta.
 * Requer um Page Access Token com permissão leads_retrieval.
 */
export async function fetchLeadData(
  leadgenId: string,
  pageAccessToken: string
): Promise<FacebookLeadData | null> {
  try {
    const params = new URLSearchParams({ access_token: pageAccessToken })
    const res = await fetch(
      `${GRAPH_API_BASE}/${leadgenId}?${params}`,
      { method: 'GET' }
    )

    if (!res.ok) {
      console.error('[FacebookLeadAds] API error fetching lead:', await res.text())
      return null
    }

    const data = await res.json()
    const fieldData: Array<{ name: string; values: string[] }> = data.field_data ?? []

    const rawFields: Record<string, string> = {}
    for (const field of fieldData) {
      rawFields[field.name] = field.values[0] ?? ''
    }

    return {
      leadgenId,
      name: rawFields['full_name'] ?? rawFields['name'] ?? null,
      email: rawFields['email'] ?? null,
      phone: rawFields['phone_number'] ?? rawFields['phone'] ?? null,
      rawFields,
    }
  } catch (err) {
    console.error('[FacebookLeadAds] Unexpected error:', err)
    return null
  }
}
