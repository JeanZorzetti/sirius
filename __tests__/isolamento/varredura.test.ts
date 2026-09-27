// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { varrerCodigo } from './varredura'

const achar = (codigo: string) => varrerCodigo('x.ts', codigo).map((a) => `${a.modelo}.${a.op}`)

describe('guarda estática: o que ela pega', () => {
  it('busca por id vindo da entrada, sem conta', () => {
    expect(achar(`export async function f(id: string) { return prisma.deal.findUnique({ where: { id } }) }`)).toEqual(['deal.findUnique'])
  })

  it('gravação ligada a registro da entrada sem busca nenhuma (nota em negócio de outra conta)', () => {
    expect(achar(`export async function addNote(dealId: string, content: string) {
      const user = await checkPermission()
      await prisma.note.create({ data: { content, dealId, userId: user.id } })
    }`)).toEqual(['note.create'])
  })

  it('ids de uma lista vinda da entrada, mesmo com a coluna conferida (reordenar)', () => {
    expect(achar(`export async function reorder(stageId: string, dealOrders: { id: string; order: number }[]) {
      const stage = await prisma.pipelineStage.findUnique({ where: { id: stageId } })
      if (!stage || stage.organizationId !== user.organizationId) throw new Error('x')
      await prisma.$transaction(dealOrders.map(({ id, order }) => prisma.deal.update({ where: { id }, data: { order } })))
    }`)).toEqual(['deal.update'])
  })

  it('conferência que não compara com a conta de quem pede (sempre verdadeira)', () => {
    expect(achar(`export async function f(dealId: string, productId: string) {
      const product = await prisma.product.findUnique({ where: { id: productId } })
      if (product && product.organizationId !== undefined || product) {
        await prisma.dealClosing.create({ data: { dealId: 'x', productId } })
      }
    }`)).toEqual(['product.findUnique', 'dealClosing.create'])
  })

  it('where montado numa variável sem conta', () => {
    expect(achar(`export async function f(taskId: string) {
      const where = { taskId }
      return prisma.taskActivity.findMany({ where })
    }`)).toEqual(['taskActivity.findMany'])
  })
})

describe('guarda estática: o que ela aceita', () => {
  it('where com a conta', () => {
    expect(achar(`export async function f(id: string, user: any) {
      return prisma.deal.findFirst({ where: { id, organizationId: user.organizationId } })
    }`)).toEqual([])
  })

  it('busca, conferência da conta (mesmo em relação aninhada) e depois gravação pelo mesmo id', () => {
    expect(achar(`export async function f(itemId: string, user: any) {
      const item = await prisma.taskChecklistItem.findUnique({ where: { id: itemId }, include: { checklist: { include: { task: true } } } })
      if (!item || item.checklist.task.organizationId !== user.organizationId) return null
      await prisma.taskChecklistItem.update({ where: { id: itemId }, data: { completed: true } })
      await prisma.taskActivity.create({ data: { taskId: item.checklist.taskId, type: 'x', description: 'y', userId: user.id } })
    }`)).toEqual([])
  })

  it('filho gravado depois de o pai ser buscado pela conta', () => {
    expect(achar(`export async function f(dealId: string, user: any) {
      const deal = await prisma.deal.findFirst({ where: { id: dealId, organizationId: user.organizationId } })
      if (!deal) return
      await prisma.note.create({ data: { dealId, content: 'x', userId: user.id } })
    }`)).toEqual([])
  })

  it('id que veio do banco, não da entrada (laço e callback sobre resultado de consulta)', () => {
    expect(achar(`export async function cron() {
      const orgs = await prisma.organization.findMany({ where: { agaasEnabled: true } })
      for (const org of orgs) {
        await prisma.organization.update({ where: { id: org.id }, data: { x: 1 } })
      }
      const posts = await prisma.instagramPost.findMany({ where: { status: 'scheduled' } })
      await Promise.all(posts.map((p) => prisma.instagramPost.update({ where: { id: p.id }, data: { status: 'posted' } })))
    }`)).toEqual([])
  })

  it('where em variável que carrega a conta', () => {
    expect(achar(`export async function f(user: any, projectId: string) {
      const where: any = { organizationId: user.organizationId, archived: false }
      if (projectId) where.projectId = projectId
      return prisma.task.findMany({ where })
    }`)).toEqual([])
  })

  it('justificativa escrita', () => {
    expect(achar(`export async function f(id: string) {
      // isolamento: painel da equipe ROI Labs, cruza contas por definição
      return prisma.supportTicket.findUnique({ where: { id } })
    }`)).toEqual([])
  })
})
