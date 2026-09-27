import { prisma } from '@/lib/prisma'

/**
 * Every record a task points to must be in the task's organization (and statuses/labels in its project):
 * a task linked to another organization's deal or contact would show it through the task (spec 011).
 * Returns the name of the first key that points outside, or null when all are fine.
 */
export async function chaveDeTarefaForaDaConta(
  organizationId: string,
  projectId: string,
  chaves: {
    statusId?: string | null
    assigneeId?: string | null
    dealId?: string | null
    contactId?: string | null
    parentId?: string | null
    labelIds?: string[] | null
  },
): Promise<string | null> {
  const conferencias: Promise<string | null>[] = []
  const conferir = (chave: string, contagem: Promise<number>, esperado = 1) =>
    conferencias.push(contagem.then((n) => (n === esperado ? null : chave)))

  if (chaves.statusId) conferir('statusId', prisma.taskStatus.count({ where: { id: chaves.statusId, projectId, project: { organizationId } } }))
  if (chaves.assigneeId) conferir('assigneeId', prisma.user.count({ where: { id: chaves.assigneeId, organizationId } }))
  if (chaves.dealId) conferir('dealId', prisma.deal.count({ where: { id: chaves.dealId, organizationId } }))
  if (chaves.contactId) conferir('contactId', prisma.contact.count({ where: { id: chaves.contactId, organizationId } }))
  if (chaves.parentId) conferir('parentId', prisma.task.count({ where: { id: chaves.parentId, organizationId } }))
  if (chaves.labelIds?.length) {
    const ids = [...new Set(chaves.labelIds)]
    conferir('labelIds', prisma.taskLabel.count({ where: { id: { in: ids }, projectId, project: { organizationId } } }), ids.length)
  }

  return (await Promise.all(conferencias)).find(Boolean) ?? null
}
