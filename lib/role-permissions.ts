import { OrgRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// Hierarchy: lower index = higher in hierarchy
export const ROLE_HIERARCHY: OrgRole[] = ['OWNER', 'GERENTE', 'COORDENADOR', 'SUPERVISOR', 'VENDEDOR']

export const ROLE_LABELS: Record<OrgRole, string> = {
  OWNER: 'Owner',
  GERENTE: 'Gerente',
  COORDENADOR: 'Coordenador',
  SUPERVISOR: 'Supervisor',
  VENDEDOR: 'Vendedor',
  MEMBER: 'Vendedor', // legacy alias
}

// Normalize legacy MEMBER → VENDEDOR for permission lookups
export function normalizeRole(role: OrgRole): OrgRole {
  return role === 'MEMBER' ? 'VENDEDOR' : role
}

function rank(role: OrgRole): number {
  const normalized = normalizeRole(role)
  const idx = ROLE_HIERARCHY.indexOf(normalized)
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
}

// Returns true if `actor` is strictly above `target` in the hierarchy.
// OWNER can manage everyone (including other OWNERs, with the 1-OWNER-min guard at the action level).
export function canManageRole(actor: OrgRole, target: OrgRole): boolean {
  if (normalizeRole(actor) === 'OWNER') return true
  return rank(actor) < rank(target)
}

// What roles can `actor` assign to a member?
// E.g. GERENTE can assign COORDENADOR, SUPERVISOR, VENDEDOR (anyone strictly below).
export function assignableRoles(actor: OrgRole): OrgRole[] {
  const actorNormalized = normalizeRole(actor)
  if (actorNormalized === 'OWNER') {
    return ['OWNER', 'GERENTE', 'COORDENADOR', 'SUPERVISOR', 'VENDEDOR']
  }
  const actorRank = rank(actorNormalized)
  return ROLE_HIERARCHY.filter((r) => rank(r) > actorRank)
}

export type RoleFeatures = {
  canAccessAgenda: boolean
  canAccessTasks: boolean
}

const OWNER_FEATURES: RoleFeatures = {
  canAccessAgenda: true,
  canAccessTasks: true,
}

const DEFAULT_ROLE_FEATURES: RoleFeatures = {
  canAccessAgenda: true,
  canAccessTasks: true,
}

// Fetches features for a role within an org. OWNER always has all features.
export async function getRoleFeatures(organizationId: string, role: OrgRole): Promise<RoleFeatures> {
  const normalized = normalizeRole(role)
  if (normalized === 'OWNER') return OWNER_FEATURES

  const row = await prisma.rolePermissions.findUnique({
    where: { organizationId_role: { organizationId, role: normalized } },
  })

  if (!row) return DEFAULT_ROLE_FEATURES

  return {
    canAccessAgenda: row.canAccessAgenda,
    canAccessTasks: row.canAccessTasks,
  }
}

// Fetch all role permissions for an org as a map.
// Missing roles fall back to defaults.
export async function getAllRolePermissions(organizationId: string): Promise<Record<OrgRole, RoleFeatures>> {
  const rows = await prisma.rolePermissions.findMany({ where: { organizationId } })
  const byRole = new Map(rows.map((r) => [r.role, { canAccessAgenda: r.canAccessAgenda, canAccessTasks: r.canAccessTasks }]))

  return {
    OWNER: OWNER_FEATURES,
    GERENTE: byRole.get('GERENTE') ?? DEFAULT_ROLE_FEATURES,
    COORDENADOR: byRole.get('COORDENADOR') ?? DEFAULT_ROLE_FEATURES,
    SUPERVISOR: byRole.get('SUPERVISOR') ?? DEFAULT_ROLE_FEATURES,
    VENDEDOR: byRole.get('VENDEDOR') ?? DEFAULT_ROLE_FEATURES,
    MEMBER: byRole.get('VENDEDOR') ?? DEFAULT_ROLE_FEATURES, // legacy
  }
}

// Roles that have configurable feature templates (everyone except OWNER and the legacy MEMBER alias)
export const CONFIGURABLE_ROLES: OrgRole[] = ['GERENTE', 'COORDENADOR', 'SUPERVISOR', 'VENDEDOR']
