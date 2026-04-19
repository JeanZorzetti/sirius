/**
 * WhatsApp Sync Utilities
 *
 * Utilitários compartilhados usados pelo webhook Whatsmeow e rotas de envio.
 */

import { prisma } from '@/lib/prisma'

// --- Shared utilities (used by sync + webhook) ---

/**
 * Normaliza phone para formato canônico: apenas dígitos, com DDI 55.
 * Ex: "19998442269" → "5519998442269", "5519998442269" → "5519998442269"
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
  }
  if (cleaned.length === 10 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
  }
  // WhatsApp BR: for DDDs >= 31 (MG, NE, N, CO), strip the 9th digit.
  // DDDs 11-30 (SP/RJ/ES/Sul) keep the 9. Ref: ANATEL plan + WhatsApp JID rules.
  if (cleaned.length === 13 && cleaned.startsWith('55') && cleaned[4] === '9') {
    const ddd = parseInt(cleaned.slice(2, 4), 10)
    if (ddd >= 31) {
      cleaned = cleaned.slice(0, 4) + cleaned.slice(5)
    }
  }
  return cleaned
}

/**
 * Busca contato por phone em TODAS as variações possíveis.
 * Retorna o primeiro match encontrado.
 */
export async function findContactByPhone(organizationId: string, phone: string) {
  // Gera todas as variações possíveis do phone
  const normalized = normalizePhoneNumber(phone)
  const withoutCountry = normalized.startsWith('55') ? normalized.substring(2) : normalized
  const last8 = normalized.slice(-8)

  const variations = [...new Set([phone, normalized, withoutCountry, '55' + withoutCountry])]

  // Busca por match exato em qualquer variação
  const contact = await prisma.contact.findFirst({
    where: {
      organizationId,
      phone: { in: variations },
    }
  })
  if (contact) return contact

  // Fallback: busca por sufixo (últimos 8 dígitos)
  return prisma.contact.findFirst({
    where: {
      organizationId,
      phone: { endsWith: last8 },
    }
  })
}
