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
  // Celular BR 11 dígitos (DDD + 9 dígitos)
  if (cleaned.length === 11 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
  }
  // Fixo BR 10 dígitos (DDD + 8 dígitos)
  if (cleaned.length === 10 && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
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
