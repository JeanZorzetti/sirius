/**
 * Sales Funnel Service
 * Agrega dados de múltiplas fontes (GSC + DB) para análise de conversão end-to-end
 */

import { getSEOMetrics } from '@/lib/google-search-console'
import { prisma } from '@/lib/prisma'

/**
 * Organizações de teste que devem ser ignoradas nas métricas
 */
const TEST_ORGANIZATION_SLUGS = [
  'teste-funil-977',
  'v-rtice-marketing-35',
  'zorzetti-979',
  'nux-digital-883',
  'roi-labs-224',
]

export interface FunnelStage {
  name: string
  value: number
  conversionRate?: number // % em relação à etapa anterior
  dropOff?: number // Quantidade perdida
  dropOffRate?: number // % perdida
}

export interface FunnelMetrics {
  stages: {
    impressions: FunnelStage
    clicks: FunnelStage
    signups: FunnelStage
    activated: FunnelStage
    hitLimit: FunnelStage
    customers: FunnelStage
  }
  globalConversion: number // customers / impressions (%)
  dateRange: {
    startDate: string
    endDate: string
  }
  unitEconomics: {
    organicCAC: number // Custo de aquisição (estimado)
    averageTicket: number // Ticket médio
    estimatedLTV: number // Lifetime Value estimado
  }
  realizedRevenue: {
    gross: number
    net: number
  }
}

interface GetFunnelMetricsParams {
  startDate?: string
  endDate?: string
}

/**
 * Calcula conversion rate e drop-off entre duas etapas
 */
function calculateStageMetrics(
  current: number,
  previous: number
): { conversionRate: number; dropOff: number; dropOffRate: number } {
  const conversionRate = previous > 0 ? (current / previous) * 100 : 0
  const dropOff = previous - current
  const dropOffRate = previous > 0 ? ((previous - current) / previous) * 100 : 0

  return {
    conversionRate,
    dropOff,
    dropOffRate,
  }
}

/**
 * Busca métricas do funil completo
 * Agrega dados de GSC (impressões, cliques) e DB (signups, activated, customers)
 */
export async function getFunnelMetrics(
  params?: GetFunnelMetricsParams
): Promise<FunnelMetrics> {
  // Default: últimos 28 dias
  const endDate = params?.endDate || new Date().toISOString().split('T')[0]
  const startDate =
    params?.startDate ||
    new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Parse dates
  const start = new Date(startDate)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999) // End of day

  // Busca dados em paralelo (Performance!)
  const [seoMetrics, dbMetrics] = await Promise.all([
    // Top of Funnel: Google Search Console
    getSEOMetrics({ startDate, endDate }),

    // Mid + Bottom Funnel: Database (excluindo organizações de teste)
    prisma.$transaction([
      // Total de signups no período
      prisma.user.count({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
          organization: {
            isTestAccount: false,
          },
        },
      }),

      // Usuários ativados (completaram onboarding)
      prisma.onboardingProgress.count({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: start,
            lte: end,
          },
          organization: {
            isTestAccount: false,
          },
        },
      }),

      // Usuários que atingiram limite (proxy: organizações com >= 45 contacts)
      // Busca organizações e filtra por quantidade de contatos
      prisma.organization.findMany({
        where: {
          isTestAccount: false,
          users: {
            some: {
              createdAt: {
                gte: start,
                lte: end,
              },
            },
          },
        },
        include: {
          _count: {
            select: {
              contacts: true,
            },
          },
        },
      }),

      // Customers (quem pagou)
      // Count de organizações criadas no período que possuem tier PRO/STARTER/BUSINESS e não são de teste
      prisma.organization.count({
        where: {
          isTestAccount: false,
          tier: {
            in: ['STARTER', 'PRO', 'BUSINESS'],
          },
          users: {
            some: {
              createdAt: {
                gte: start,
                lte: end,
              },
            },
          },
        },
      }),

      // Receita Realizada (Net e Gross das transações com tipo PLAN_UPGRADE do mesmo cohort de usuários)
      prisma.transaction.aggregate({
        where: {
          type: 'PLAN_UPGRADE',
          status: 'COMPLETED',
          createdAt: {
            gte: start,
            lte: end,
          },
          organization: {
            isTestAccount: false,
            users: {
              some: {
                createdAt: {
                  gte: start,
                  lte: end,
                },
              },
            },
          },
        },
        _sum: {
          amount: true,
          netAmount: true,
        },
      }),
    ]),
  ])

  const [signups, activated, orgsWithUsers, customers, revenueData] = dbMetrics

  // Filtrar organizações que atingiram o limite (>= 45 contatos)
  const hitLimit = orgsWithUsers.filter((org) => org._count.contacts >= 45).length

  // Top Funnel
  const impressions = seoMetrics.totals.impressions
  const clicks = seoMetrics.totals.clicks

  // Construir estágios do funil com métricas calculadas
  const stages = {
    impressions: {
      name: 'Impressões (Google)',
      value: impressions,
    } as FunnelStage,
    clicks: {
      name: 'Cliques',
      value: clicks,
      ...calculateStageMetrics(clicks, impressions),
    } as FunnelStage,
    signups: {
      name: 'Cadastros',
      value: signups,
      ...calculateStageMetrics(signups, clicks),
    } as FunnelStage,
    activated: {
      name: 'Ativados (Onboarding)',
      value: activated,
      ...calculateStageMetrics(activated, signups),
    } as FunnelStage,
    hitLimit: {
      name: 'Engajados (45+ leads)',
      value: hitLimit,
      ...calculateStageMetrics(hitLimit, activated),
    } as FunnelStage,
    customers: {
      name: 'Pagantes (PRO)',
      value: customers,
      ...calculateStageMetrics(customers, hitLimit),
    } as FunnelStage,
  }

  // Global Conversion: impressions -> customers
  const globalConversion =
    impressions > 0 ? (customers / impressions) * 100 : 0

  // Unit Economics (valores estimados)
  const averageTicket = 147 // R$ 147/mês (plano PRO)
  const estimatedRetentionMonths = 12 // Retenção média estimada
  const estimatedLTV = averageTicket * estimatedRetentionMonths

  // CAC Orgânico (custo de hora do time / novos customers)
  // Assumindo custo de R$ 100/hora, 20h/mês em SEO
  const monthlySEOCost = 100 * 20 // R$ 2.000
  const organicCAC = customers > 0 ? monthlySEOCost / customers : 0

  const grossRevenue = Number(revenueData?._sum?.amount || 0)
  const netRevenue = Number(revenueData?._sum?.netAmount || 0)

  return {
    stages,
    globalConversion,
    dateRange: {
      startDate,
      endDate,
    },
    unitEconomics: {
      organicCAC: Math.round(organicCAC),
      averageTicket,
      estimatedLTV,
    },
    realizedRevenue: {
      gross: grossRevenue,
      net: netRevenue > 0 ? netRevenue : grossRevenue, // Fallback se transições antigas não tiverem netAmount
    },
  }
}

/**
 * Identifica o gargalo do funil (maior drop-off rate)
 */
export function identifyBottleneck(metrics: FunnelMetrics): {
  stage: string
  dropOffRate: number
  recommendation: string
} {
  const stagesArray = [
    { ...metrics.stages.clicks, key: 'clicks' },
    { ...metrics.stages.signups, key: 'signups' },
    { ...metrics.stages.activated, key: 'activated' },
    { ...metrics.stages.hitLimit, key: 'hitLimit' },
    { ...metrics.stages.customers, key: 'customers' },
  ]

  const bottleneck = stagesArray.reduce((max, stage) =>
    (stage.dropOffRate || 0) > (max.dropOffRate || 0) ? stage : max
  )

  const recommendations: Record<string, string> = {
    clicks: 'Melhorar CTR nos títulos do Google (adicione números e ano atual)',
    signups: 'Otimizar landing page e formulário de cadastro (reduzir atrito)',
    activated: 'Simplificar onboarding e adicionar gamificação',
    hitLimit: 'Criar campanhas de email para engajamento de usuários inativos',
    customers: 'Adicionar urgência (desconto limitado) e social proof na página de pricing',
  }

  return {
    stage: bottleneck.name,
    dropOffRate: bottleneck.dropOffRate || 0,
    recommendation: recommendations[bottleneck.key] || 'Analisar dados mais detalhados',
  }
}
