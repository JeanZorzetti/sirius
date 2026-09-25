import type { OrgRole, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { normalizeRole } from '@/lib/role-permissions'

/**
 * Who sees what inside an organization (spec 011). One place for every screen, export and query that reads deals or
 * tasks: the board, analytics, contacts, agenda, search, the AI chat and exports all go through these scopes.
 */
export type Acesso = {
  userId: string
  organizationId: string
  orgRole: OrgRole
  pipelineRestricted: boolean
  allowedPipelineIds: string[]
}

export async function carregarAcesso(quem: { id: string } | { email: string }): Promise<Acesso | null> {
  const user = await prisma.user.findUnique({
    where: 'id' in quem ? { id: quem.id } : { email: quem.email },
    select: { id: true, organizationId: true, orgRole: true, pipelineRestricted: true, allowedPipelineIds: true },
  })
  if (!user) return null
  return {
    userId: user.id,
    organizationId: user.organizationId,
    orgRole: user.orgRole,
    pipelineRestricted: user.pipelineRestricted,
    allowedPipelineIds: user.allowedPipelineIds,
  }
}

/** Owner and manager see everything in the organization and may export it. */
export const podeVerTudo = (a: Pick<Acesso, 'orgRole'>) => ['OWNER', 'GERENTE'].includes(normalizeRole(a.orgRole))
export const podeExportar = podeVerTudo

export function escopoPipeline(a: Acesso): Prisma.PipelineWhereInput {
  return a.pipelineRestricted
    ? { organizationId: a.organizationId, id: { in: a.allowedPipelineIds } }
    : { organizationId: a.organizationId }
}

export function escopoNegocio(a: Acesso): Prisma.DealWhereInput {
  return a.pipelineRestricted
    ? { organizationId: a.organizationId, pipelineId: { in: a.allowedPipelineIds } }
    : { organizationId: a.organizationId }
}

/** Keeps only the allowed ones from pipeline ids asked for (e.g. `?pid=` in the URL). */
export function pipelinesPermitidos(a: Acesso, pedidos: string[]): string[] {
  return a.pipelineRestricted ? pedidos.filter((id) => a.allowedPipelineIds.includes(id)) : pedidos
}

/**
 * Tasks: "admins only" is for owner and manager; "private" for creator, assignee, owner and manager.
 * Every other role (supervisor, coordinator, seller, legacy member) sees public ones and private ones that are theirs.
 */
export function escopoTarefa(a: Acesso): Prisma.TaskWhereInput {
  if (podeVerTudo(a)) return { organizationId: a.organizationId }
  return {
    organizationId: a.organizationId,
    OR: [
      { visibility: 'PUBLIC' },
      { visibility: 'PRIVATE', OR: [{ assigneeId: a.userId }, { creatorId: a.userId }] },
    ],
  }
}
