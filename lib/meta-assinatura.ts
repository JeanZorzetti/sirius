import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Checks Meta's `X-Hub-Signature-256` header (WhatsApp Cloud API, Lead Ads, Instagram webhooks):
 * `sha256=` + hex HMAC-SHA256 of the raw request body, keyed with the app secret.
 * Missing secret or header → false: an unsigned notice never gets in.
 */
export function assinaturaMetaValida(corpoCru: string, cabecalho: string | null, segredo: string | null | undefined): boolean {
  if (!segredo || !cabecalho?.startsWith('sha256=')) return false
  const recebida = Buffer.from(cabecalho.slice('sha256='.length), 'hex')
  const esperada = createHmac('sha256', segredo).update(corpoCru, 'utf8').digest()
  return recebida.length === esperada.length && timingSafeEqual(recebida, esperada)
}
