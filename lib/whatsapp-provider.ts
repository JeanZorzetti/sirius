/**
 * WhatsApp provider detection.
 * The only supported provider is Whatsmeow Gateway.
 */

export function isWhatsmeow(_connection: { apiKey?: string | null }): boolean {
  return true
}
