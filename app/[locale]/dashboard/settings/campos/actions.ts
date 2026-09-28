'use server'

/**
 * Spec 017: custom field definitions and values, and the contact's companies with their role.
 * Every read and write resolves the record inside the caller's organization and, for deals, inside what the caller
 * may see (spec 011, escopoNegocio). Defining fields is for owners and managers.
 */

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { carregarAcesso, escopoNegocio, podeVerTudo, type Acesso } from '@/lib/visibilidade'
import { colunasDoValor, type TipoCampo } from '@/lib/campos-personalizados'
import type { EntidadeCampo, PapelNaEmpresa } from '@prisma/client'

type Resultado<T = undefined> = { ok: true; dados?: T } | { ok: false; erro: string }

async function acesso(): Promise<Acesso | null> {
  const session = await getSession()
  if (!session?.user?.email) return null
  return carregarAcesso({ email: session.user.email })
}

/** The record, inside the organization and inside what this person may see. */
async function registroVisivel(a: Acesso, entity: EntidadeCampo, recordId: string): Promise<boolean> {
  if (entity === 'CONTACT') {
    return !!(await prisma.contact.findFirst({ where: { id: recordId, organizationId: a.organizationId }, select: { id: true } }))
  }
  return !!(await prisma.deal.findFirst({
    where: { id: recordId, organizationId: a.organizationId, ...escopoNegocio(a) },
    select: { id: true },
  }))
}

// ─── Definitions ─────────────────────────────────────────────────────────────

export async function listarCampos(entity: EntidadeCampo) {
  const a = await acesso()
  if (!a) return []
  return prisma.customFieldDefinition.findMany({
    where: { organizationId: a.organizationId, entity },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, label: true, type: true, options: true },
  })
}

export async function criarCampo(p: { entity: EntidadeCampo; label: string; type: TipoCampo; options?: string[] }): Promise<Resultado> {
  const a = await acesso()
  if (!a) return { ok: false, erro: 'Sessão expirada. Entre de novo.' }
  if (!podeVerTudo(a)) return { ok: false, erro: 'Só o dono e o gerente da conta criam campos.' }
  const label = p.label.trim()
  if (!label || label.length > 60) return { ok: false, erro: 'Dê um nome de até 60 caracteres ao campo.' }
  const options = p.type === 'SELECAO' ? [...new Set((p.options ?? []).map(o => o.trim()).filter(Boolean))] : []
  if (p.type === 'SELECAO' && options.length < 2) return { ok: false, erro: 'Um campo de seleção precisa de pelo menos 2 opções.' }
  const existentes = await prisma.customFieldDefinition.count({ where: { organizationId: a.organizationId, entity: p.entity } })
  if (existentes >= 30) return { ok: false, erro: 'Cada ficha comporta até 30 campos.' }
  try {
    await prisma.customFieldDefinition.create({
      data: { organizationId: a.organizationId, entity: p.entity, label, type: p.type, options, order: existentes },
    })
  } catch (e) {
    if ((e as { code?: string }).code === 'P2002') return { ok: false, erro: `Já existe um campo chamado "${label}".` }
    throw e
  }
  revalidatePath('/dashboard/settings/campos')
  return { ok: true }
}

export async function apagarCampo(id: string): Promise<Resultado> {
  const a = await acesso()
  if (!a) return { ok: false, erro: 'Sessão expirada. Entre de novo.' }
  if (!podeVerTudo(a)) return { ok: false, erro: 'Só o dono e o gerente da conta apagam campos.' }
  // The values go with it (onDelete: Cascade)
  const r = await prisma.customFieldDefinition.deleteMany({ where: { id, organizationId: a.organizationId } })
  if (r.count === 0) return { ok: false, erro: 'Campo não encontrado.' }
  revalidatePath('/dashboard/settings/campos')
  return { ok: true }
}

// ─── Values ──────────────────────────────────────────────────────────────────

export async function lerValores(entity: EntidadeCampo, recordId: string) {
  const a = await acesso()
  if (!a || !(await registroVisivel(a, entity, recordId))) return { campos: [], valores: [] }
  const [campos, valores] = await Promise.all([
    prisma.customFieldDefinition.findMany({
      where: { organizationId: a.organizationId, entity },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, label: true, type: true, options: true },
    }),
    prisma.customFieldValue.findMany({
      where: { organizationId: a.organizationId, recordId },
      select: { definitionId: true, valueText: true, valueNumber: true, valueDate: true, valueBool: true },
    }),
  ])
  return { campos, valores }
}

export async function salvarValor(definitionId: string, recordId: string, bruto: string | boolean | null): Promise<Resultado> {
  const a = await acesso()
  if (!a) return { ok: false, erro: 'Sessão expirada. Entre de novo.' }
  const campo = await prisma.customFieldDefinition.findFirst({ where: { id: definitionId, organizationId: a.organizationId } })
  if (!campo) return { ok: false, erro: 'Campo não encontrado.' }
  if (!(await registroVisivel(a, campo.entity, recordId))) return { ok: false, erro: 'Registro não encontrado.' }
  const r = colunasDoValor(campo.type as TipoCampo, bruto, campo.options)
  if (!r.ok) return r
  // isolamento: campo loaded with organizationId; recordId checked by registroVisivel (organization + visibility)
  await prisma.customFieldValue.upsert({
    where: { definitionId_recordId: { definitionId, recordId } },
    create: { organizationId: a.organizationId, definitionId, recordId, ...r.colunas },
    update: r.colunas,
  })
  return { ok: true }
}

// ─── Companies and the contact's role ────────────────────────────────────────

export async function empresasDoContato(contactId: string) {
  const a = await acesso()
  if (!a || !(await registroVisivel(a, 'CONTACT', contactId))) return []
  return prisma.contactCompany.findMany({
    where: { contactId, organizationId: a.organizationId },
    select: { id: true, role: true, company: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  })
}

export async function vincularEmpresa(contactId: string, nome: string, role: PapelNaEmpresa): Promise<Resultado> {
  const a = await acesso()
  if (!a) return { ok: false, erro: 'Sessão expirada. Entre de novo.' }
  if (!(await registroVisivel(a, 'CONTACT', contactId))) return { ok: false, erro: 'Contato não encontrado.' }
  const name = nome.trim()
  if (!name || name.length > 120) return { ok: false, erro: 'Digite o nome da empresa (até 120 caracteres).' }
  const company = await prisma.company.upsert({
    where: { organizationId_nameKey: { organizationId: a.organizationId, nameKey: name.toLowerCase() } },
    create: { organizationId: a.organizationId, name, nameKey: name.toLowerCase() },
    update: {},
    select: { id: true },
  })
  // isolamento: contactId checked by registroVisivel; company upserted inside this organization just above
  await prisma.contactCompany.upsert({
    where: { contactId_companyId: { contactId, companyId: company.id } },
    create: { organizationId: a.organizationId, contactId, companyId: company.id, role },
    update: { role },
  })
  return { ok: true }
}

export async function mudarPapel(vinculoId: string, role: PapelNaEmpresa): Promise<Resultado> {
  const a = await acesso()
  if (!a) return { ok: false, erro: 'Sessão expirada. Entre de novo.' }
  const r = await prisma.contactCompany.updateMany({ where: { id: vinculoId, organizationId: a.organizationId }, data: { role } })
  return r.count ? { ok: true } : { ok: false, erro: 'Vínculo não encontrado.' }
}

export async function desvincularEmpresa(vinculoId: string): Promise<Resultado> {
  const a = await acesso()
  if (!a) return { ok: false, erro: 'Sessão expirada. Entre de novo.' }
  const r = await prisma.contactCompany.deleteMany({ where: { id: vinculoId, organizationId: a.organizationId } })
  return r.count ? { ok: true } : { ok: false, erro: 'Vínculo não encontrado.' }
}
