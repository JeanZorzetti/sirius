/**
 * Spec 013: what the public /features pages say about each plan, read from PLAN_LIMITS / PLAN_FEATURES so the
 * marketing copy cannot drift from what the product enforces. The first column is the trial, which is the Pro plan
 * for TRIAL_DAYS (getEffectiveTier), not the read-only Free plan that follows it.
 */

import { SubscriptionTier } from '@prisma/client'
import { PLAN_FEATURES, PLAN_LIMITS } from './entitlements'
import { TRIAL_DAYS } from './trial'

type Celula = string | boolean
type Linha = { free: Celula; starter: Celula; pro: Celula; business: Celula }

const COLUNAS = {
  free: SubscriptionTier.PRO, // the trial
  starter: SubscriptionTier.STARTER,
  pro: SubscriptionTier.PRO,
  business: SubscriptionTier.BUSINESS,
} as const

// null and -1 both mean unlimited in PLAN_LIMITS
const numero = (n: number | null) => (n == null || n < 0 ? 'Ilimitado' : n.toLocaleString('pt-BR'))

function linha(valor: (tier: SubscriptionTier) => Celula): Linha {
  return {
    free: valor(COLUNAS.free),
    starter: valor(COLUNAS.starter),
    pro: valor(COLUNAS.pro),
    business: valor(COLUNAS.business),
  }
}

const integra = (tier: SubscriptionTier, nome: string) => {
  const lista = PLAN_LIMITS[tier].allowedIntegrations
  return lista.includes('*') || lista.includes(nome)
}

export function tabelaDePlanos() {
  const L = PLAN_LIMITS
  return {
    contacts: linha(t => numero(L[t].maxContacts)),
    deals: linha(t => numero(L[t].maxDeals)),
    pipelines: linha(t => numero(L[t].maxPipelines)),
    users: linha(t => numero(L[t].maxUsers)),
    tasks: linha(t => numero(L[t].maxTasks)),
    whatsapp: linha(t => {
      const n = L[t].maxWhatsAppInstances
      if (n === 0) return false
      const numeros = `${n} ${n === 1 ? 'número' : 'números'}`
      // The official API (WABA) is Business-only (spec 012)
      return t === SubscriptionTier.BUSINESS ? `${numeros} + API Oficial Meta` : numeros
    }),
    prospecting: {
      ...linha(t => (L[t].scrapingCreditsMonthly > 0 ? `${numero(L[t].scrapingCreditsMonthly)} leads` : false)),
      // An account that never paid gets 50 one-off credits (app/api/scraping/credits), not the Pro monthly quota
      free: '50 leads',
    },
    automations: linha(t => (L[t].maxEmailAutomations > 0 ? numero(L[t].maxEmailAutomations) : false)),
    agi: linha(t => PLAN_FEATURES[t].can_use_agi),
    advancedAnalytics: linha(t => L[t].advancedAnalytics),
    customReports: linha(t => L[t].customReports),
    api: linha(t => L[t].features.apiAccess),
    googleCalendar: linha(t => integra(t, 'google-calendar')),
    n8n: linha(t => integra(t, 'n8n')),
    roundRobin: linha(t => L[t].features.roundRobin),
  }
}

const LIMITE_POR_RECURSO = {
  contacts: ['maxContacts', 'contatos'],
  deals: ['maxDeals', 'negócios abertos'],
  pipelines: ['maxPipelines', 'funis'],
  tasks: ['maxTasks', 'tarefas'],
} as const

/** "Teste grátis (14 dias): 5.000 contatos | Starter: 1.000 | ..." for the /features/[slug] pages that have a limit. */
export function limitePorPlano(featureKey: string): string | null {
  const par = LIMITE_POR_RECURSO[featureKey as keyof typeof LIMITE_POR_RECURSO]
  if (!par) return null
  const [campo, nome] = par
  const v = (t: SubscriptionTier) => numero(PLAN_LIMITS[t][campo])
  return `Teste grátis (${TRIAL_DAYS} dias): ${v(COLUNAS.free)} ${nome} | Starter: ${v(SubscriptionTier.STARTER)} | Pro: ${v(SubscriptionTier.PRO)} | Business: ${v(SubscriptionTier.BUSINESS)}`
}
