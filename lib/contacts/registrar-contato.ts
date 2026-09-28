/**
 * Spec 015: the door through which a contact enters the account. It keys the phone the same way the WhatsApp
 * inbound does (`55 + DDD + last 8`), trims and lowercases the e-mail, records the first-touch source and, when a
 * new lead arrives without an owner, hands it to round-robin (Business).
 *
 * Lead doors (form webhook, WhatsApp, API) reuse a contact that already has the same phone key or e-mail. A person
 * typing a contact creates it even when it looks like a duplicate: that is their call, and the key lets the screen
 * suggest the match later. Imports and seeds only use `chaveTelefone` to fill the key and never distribute.
 */

import { prisma } from '@/lib/prisma'
import { chaveTelefone } from '@/lib/whatsapp/telefone'
import { distributeLead } from '@/lib/round-robin'
import type { Contact, Prisma } from '@prisma/client'

export const normalizarEmail = (email: string | null | undefined) => {
  const e = (email ?? '').trim().toLowerCase()
  return e || null
}

type Dados = Omit<Prisma.ContactUncheckedCreateInput, 'organizationId' | 'phoneKey' | 'source'>

export async function registrarContato(p: {
  organizationId: string
  dados: Dados
  /** First-touch origin: "facebook_ads", "whatsapp", "api", "manual", "prospeccao"… Never overwritten. */
  origem: string
  /** 'reusar' for lead doors; 'criar' when a person types the contact. */
  seExistir: 'reusar' | 'criar'
  /** Hand a new contact without an owner to round-robin (only lead doors). */
  distribuir: boolean
}): Promise<{ contato: Contact; novo: boolean }> {
  const phoneKey = chaveTelefone(p.dados.phone ?? null)
  const email = normalizarEmail(p.dados.email)

  if (p.seExistir === 'reusar' && (phoneKey || email)) {
    const existente = await prisma.contact.findFirst({
      where: {
        organizationId: p.organizationId,
        OR: [...(phoneKey ? [{ phoneKey }] : []), ...(email ? [{ email: { equals: email, mode: 'insensitive' as const } }] : [])],
      },
      orderBy: { createdAt: 'asc' },
    })
    if (existente) {
      if (!existente.source) {
        // isolamento: existente was found by organizationId just above
        await prisma.contact.update({ where: { id: existente.id }, data: { source: p.origem } })
      }
      return { contato: existente, novo: false }
    }
  }

  const criado = await prisma.contact.create({
    data: { ...p.dados, email, phoneKey, source: p.origem, organizationId: p.organizationId },
  })

  if (p.distribuir && !criado.assignedToId) {
    // Returns null when the account is not Business or round-robin is off: the contact keeps no owner, as before
    const dono = await distributeLead(p.organizationId, criado.id)
    if (dono) criado.assignedToId = dono
  }
  return { contato: criado, novo: true }
}
