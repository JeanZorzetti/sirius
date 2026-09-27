import type { OrgRole, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'
import { normalizeRole } from '@/lib/role-permissions'

/**
 * Who sees what inside an organization (spec 011). One place for every screen, export and query that reads deals or
 * tasks: the board, analytics, contacts, agenda, search, the AI chat and exports all go through these scopes.
 */
export type Acesso = {
  userId: string
  nome: string | null
  organizationId: string
  orgRole: OrgRole
  pipelineRestricted: boolean
  allowedPipelineIds: string[]
}

export async function carregarAcesso(quem: { id: string } | { email: string }): Promise<Acesso | null> {
  // isolamento: the caller's own user, by the id or email of the session
  const user = await prisma.user.findUnique({
    where: 'id' in quem ? { id: quem.id } : { email: quem.email },
    select: { id: true, name: true, organizationId: true, orgRole: true, pipelineRestricted: true, allowedPipelineIds: true },
  })
  if (!user) return null
  return {
    userId: user.id,
    nome: user.name,
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
/**
 * For task sub-routes (`/api/tasks/[taskId]/…`): the task in the URL, only if it is in the caller's organization and
 * visible to them; otherwise the error response to return. Children (comments, checklists, attachments…) are then
 * read and written through the returned `taskId`.
 */
export async function tarefaDoPedido(taskId: string): Promise<{ acesso: Acesso; taskId: string } | Response> {
  const session = await getSession()
  if (!session?.user?.email) return apiError(ERR.UNAUTHORIZED, 401)
  const acesso = await carregarAcesso({ email: session.user.email })
  if (!acesso) return apiError(ERR.USER_NOT_FOUND, 404)
  const task = await prisma.task.findFirst({ where: { id: taskId, ...escopoTarefa(acesso) }, select: { id: true } })
  if (!task) return apiError(ERR.NOT_FOUND, 404)
  return { acesso, taskId: task.id }
}

/** Roles a project's `allowedRoles` may list for this user (legacy MEMBER counts as VENDEDOR too) */
const papeisDoUsuario = (a: Acesso): OrgRole[] => [...new Set([a.orgRole, normalizeRole(a.orgRole)])]

/** Task projects: owner and manager see all; the others only projects open to every role or to theirs. */
export function escopoProjeto(a: Acesso): Prisma.TaskProjectWhereInput {
  if (podeVerTudo(a)) return { organizationId: a.organizationId }
  return {
    organizationId: a.organizationId,
    OR: [{ allowedRoles: { isEmpty: true } }, { allowedRoles: { hasSome: papeisDoUsuario(a) } }],
  }
}

/** For project sub-routes (`/api/task-projects/[projectId]/…`), like `tarefaDoPedido`. */
export async function projetoDoPedido(projectId: string): Promise<{ acesso: Acesso; projectId: string } | Response> {
  const session = await getSession()
  if (!session?.user?.email) return apiError(ERR.UNAUTHORIZED, 401)
  const acesso = await carregarAcesso({ email: session.user.email })
  if (!acesso) return apiError(ERR.USER_NOT_FOUND, 404)
  const projeto = await prisma.taskProject.findFirst({ where: { id: projectId, ...escopoProjeto(acesso) }, select: { id: true } })
  if (!projeto) return apiError(ERR.NOT_FOUND, 404)
  return { acesso, projectId: projeto.id }
}

export function escopoTarefa(a: Acesso): Prisma.TaskWhereInput {
  if (podeVerTudo(a)) return { organizationId: a.organizationId }
  return {
    organizationId: a.organizationId,
    OR: [
      { visibility: 'PUBLIC' },
      { visibility: 'PRIVATE', OR: [{ assigneeId: a.userId }, { creatorId: a.userId }] },
    ],
    project: { OR: [{ allowedRoles: { isEmpty: true } }, { allowedRoles: { hasSome: papeisDoUsuario(a) } }] },
  }
}
