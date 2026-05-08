import { prisma } from '@/lib/prisma'

const TIER_PRICES: Record<string, number> = {
  STARTER: 49,
  PRO: 97,
  BUSINESS: 149,
}

export async function calculateMRR(): Promise<number> {
  const paidOrgs = await prisma.organization.findMany({
    where: {
      tier: { in: ['STARTER', 'PRO', 'BUSINESS'] },
      isTestAccount: false,
    },
    select: { tier: true },
  })
  return paidOrgs.reduce((sum, org) => sum + (TIER_PRICES[org.tier] || 0), 0)
}

export async function calculateARR(): Promise<number> {
  return (await calculateMRR()) * 12
}

export async function calculateChurnRate(startDate: Date, endDate: Date): Promise<number> {
  const organizationsAtStart = await prisma.organization.count({
    where: { createdAt: { lte: startDate } },
  })
  if (organizationsAtStart === 0) return 0

  const downgrades = await prisma.userActivity.count({
    where: {
      type: 'FEATURE_USED',
      createdAt: { gte: startDate, lte: endDate },
      metadata: { path: ['action'], equals: 'downgrade' },
    },
  })

  return Math.round((downgrades / organizationsAtStart) * 10000) / 100
}

export async function calculateLTV(monthlyChurnRate: number = 0.05): Promise<number> {
  const paidOrgs = await prisma.organization.findMany({
    where: {
      tier: { in: ['STARTER', 'PRO', 'BUSINESS'] },
      isTestAccount: false,
    },
    select: { tier: true },
  })
  if (paidOrgs.length === 0 || monthlyChurnRate === 0) return 0

  const totalRevenue = paidOrgs.reduce((sum, org) => sum + (TIER_PRICES[org.tier] || 0), 0)
  const avgRevenue = totalRevenue / paidOrgs.length
  return Math.round((avgRevenue / monthlyChurnRate) * 100) / 100
}

export async function calculateCAC(month: number, year: number): Promise<number> {
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)

  const adSpendResult = await prisma.adsMetric.aggregate({
    where: { date: { gte: startOfMonth, lte: endOfMonth } },
    _sum: { spend: true },
  })
  const totalSpend = parseFloat(String(adSpendResult._sum.spend ?? 0))
  if (totalSpend === 0) return 0

  const newPaidOrgs = await prisma.organization.count({
    where: {
      tier: { in: ['STARTER', 'PRO', 'BUSINESS'] },
      isTestAccount: false,
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
  })
  return newPaidOrgs === 0 ? totalSpend : totalSpend / newPaidOrgs
}

export interface PlatformKPIs {
  mrr: number
  arr: number
  totalOrganizations: number
  proOrganizations: number
  freeOrganizations: number
  churnRate: number
  ltv: number
  cac: number
  ltvCacRatio: number
  month: number
  year: number
}

export async function calculatePlatformKPIs(month: number, year: number): Promise<PlatformKPIs> {
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)

  const [mrr, arr, totalOrgs, proOrgs, churnRate, cac] = await Promise.all([
    calculateMRR(),
    calculateARR(),
    prisma.organization.count(),
    prisma.organization.count({
      where: { tier: { in: ['STARTER', 'PRO', 'BUSINESS'] }, isTestAccount: false },
    }),
    calculateChurnRate(startOfMonth, endOfMonth),
    calculateCAC(month, year),
  ])

  const ltv = await calculateLTV((churnRate / 100) || 0.05)
  const ltvCacRatio = cac > 0 ? ltv / cac : 0

  return {
    mrr, arr,
    totalOrganizations: totalOrgs,
    proOrganizations: proOrgs,
    freeOrganizations: totalOrgs - proOrgs,
    churnRate, ltv, cac, ltvCacRatio, month, year,
  }
}
