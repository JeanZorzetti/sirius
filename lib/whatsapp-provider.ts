/**
 * WhatsApp provider detection.
 *
 * Priority:
 * 1. WHATSAPP_PROVIDER env var ("whatsmeow" | "evolution") — global override
 * 2. Auto-detect per connection: no apiKey → whatsmeow, has apiKey → evolution
 */

type Provider = 'whatsmeow' | 'evolution'

const ENV_OVERRIDE = process.env.WHATSAPP_PROVIDER as Provider | undefined

export function detectProvider(connection: { apiKey?: string | null }): Provider {
  if (ENV_OVERRIDE === 'whatsmeow' || ENV_OVERRIDE === 'evolution') {
    return ENV_OVERRIDE
  }
  return !connection.apiKey ? 'whatsmeow' : 'evolution'
}

export function isWhatsmeow(connection: { apiKey?: string | null }): boolean {
  return detectProvider(connection) === 'whatsmeow'
}
