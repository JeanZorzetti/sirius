/**
 * AI Traffic Detection & Tracking
 *
 * Detecta tráfego vindo de AI Answer Engines (ChatGPT, Perplexity, Claude, Gemini)
 * e dispara eventos para analytics
 */

export type AiEngine =
  | 'chatgpt'
  | 'perplexity'
  | 'claude'
  | 'gemini'
  | 'you.com'
  | 'bing_chat'
  | 'bard'

export interface AiReferrerData {
  engine: AiEngine
  referrerUrl: string
  detectedAt: string
}

/**
 * Mapeamento de domínios de AI para identificadores
 */
const AI_ENGINES_MAP: Record<string, AiEngine> = {
  'chatgpt.com': 'chatgpt',
  'chat.openai.com': 'chatgpt',
  'perplexity.ai': 'perplexity',
  'claude.ai': 'claude',
  'gemini.google.com': 'gemini',
  'bard.google.com': 'bard',
  'you.com': 'you.com',
  'bing.com/chat': 'bing_chat',
  'copilot.microsoft.com': 'bing_chat',
} as const

/**
 * Detecta se o referrer é de uma AI Answer Engine
 *
 * @param referrer - URL do referrer (normalmente document.referrer)
 * @returns Dados do AI engine detectado ou null
 *
 * @example
 * ```ts
 * const aiData = detectAiReferrer(document.referrer)
 * if (aiData) {
 *   console.log(`Tráfego vindo de ${aiData.engine}`)
 * }
 * ```
 */
export function detectAiReferrer(referrer?: string): AiReferrerData | null {
  // Usar document.referrer se não passar parâmetro (client-side only)
  const referrerUrl = referrer || (typeof document !== 'undefined' ? document.referrer : '')

  if (!referrerUrl) return null

  const referrerLower = referrerUrl.toLowerCase()

  // Verificar cada domínio de AI
  for (const [domain, engine] of Object.entries(AI_ENGINES_MAP)) {
    if (referrerLower.includes(domain)) {
      return {
        engine,
        referrerUrl,
        detectedAt: new Date().toISOString(),
      }
    }
  }

  return null
}

/**
 * Verifica se um referrer é de uma AI Answer Engine (boolean)
 */
export function isAiReferrer(referrer?: string): boolean {
  return detectAiReferrer(referrer) !== null
}

/**
 * Extrai query parameters do referrer se disponível
 * Útil para entender o contexto da busca
 */
export function extractAiQueryParams(referrer: string): Record<string, string> | null {
  try {
    const url = new URL(referrer)
    const params: Record<string, string> = {}

    // Extrair parâmetros comuns
    const searchParam = url.searchParams.get('q') || url.searchParams.get('query')
    if (searchParam) {
      params.search_query = searchParam
    }

    return Object.keys(params).length > 0 ? params : null
  } catch {
    return null
  }
}

/**
 * Armazena detecção de AI no localStorage para persistência entre páginas
 */
export function storeAiDetection(data: AiReferrerData): void {
  if (typeof window === 'undefined') return

  try {
    const storageKey = 'sirius_ai_referrer'
    const expiryKey = 'sirius_ai_referrer_expiry'

    // Armazenar por 24h
    const expiryTime = Date.now() + (24 * 60 * 60 * 1000)

    localStorage.setItem(storageKey, JSON.stringify(data))
    localStorage.setItem(expiryKey, expiryTime.toString())
  } catch (error) {
    console.warn('Failed to store AI detection:', error)
  }
}

/**
 * Recupera detecção de AI armazenada (se ainda válida)
 */
export function getStoredAiDetection(): AiReferrerData | null {
  if (typeof window === 'undefined') return null

  try {
    const storageKey = 'sirius_ai_referrer'
    const expiryKey = 'sirius_ai_referrer_expiry'

    const stored = localStorage.getItem(storageKey)
    const expiry = localStorage.getItem(expiryKey)

    if (!stored || !expiry) return null

    // Verificar se expirou
    if (Date.now() > parseInt(expiry)) {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(expiryKey)
      return null
    }

    return JSON.parse(stored)
  } catch (error) {
    console.warn('Failed to get stored AI detection:', error)
    return null
  }
}

/**
 * Limpa dados armazenados de AI detection
 */
export function clearStoredAiDetection(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem('sirius_ai_referrer')
    localStorage.removeItem('sirius_ai_referrer_expiry')
  } catch (error) {
    console.warn('Failed to clear AI detection:', error)
  }
}

/**
 * Detecta e armazena automaticamente (helper all-in-one)
 *
 * @returns Dados do AI detectado ou armazenado previamente
 */
export function detectAndStoreAiReferrer(): AiReferrerData | null {
  // Primeiro, tentar detectar no referrer atual
  const detected = detectAiReferrer()

  if (detected) {
    storeAiDetection(detected)
    return detected
  }

  // Se não detectou, verificar se já tinha armazenado
  return getStoredAiDetection()
}
