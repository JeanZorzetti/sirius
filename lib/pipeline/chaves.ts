import { prisma } from '@/lib/prisma'

/**
 * Every record a deal points to must be in the deal's organization, and its stage in its pipeline: a deal linked to
 * another organization's contact would show that contact through the deal (spec 011).
 * Returns the name of the first key that points outside, or null when all are fine.
 */
export async function chaveDeNegocioForaDaConta(
  organizationId: string,
  pipelineId: string,
  chaves: { stageId?: string | null; contactId?: string | null; productId?: string | null },
): Promise<string | null> {
  const [etapa, contato, produto] = await Promise.all([
    chaves.stageId ? prisma.pipelineStage.count({ where: { id: chaves.stageId, pipelineId, organizationId } }) : 1,
    chaves.contactId ? prisma.contact.count({ where: { id: chaves.contactId, organizationId } }) : 1,
    chaves.productId ? prisma.product.count({ where: { id: chaves.productId, organizationId } }) : 1,
  ])
  if (etapa !== 1) return 'stageId'
  if (contato !== 1) return 'contactId'
  if (produto !== 1) return 'productId'
  return null
}

/** The user an item is assigned to must be a member of the organization. */
export async function usuarioForaDaConta(organizationId: string, userId?: string | null): Promise<boolean> {
  if (!userId) return false
  return (await prisma.user.count({ where: { id: userId, organizationId } })) !== 1
}
