/**
 * Mercado Pago Products Configuration - v2.0
 *
 * Configuração de produtos (planos e add-ons) do Mercado Pago.
 */

import { SubscriptionTier, AddonType } from '@prisma/client'

/**
 * IDs dos planos de assinatura no Mercado Pago
 * IMPORTANTE: Criar estes planos no painel do Mercado Pago e substituir os IDs reais aqui
 */
export const MERCADO_PAGO_PLAN_IDS: Record<SubscriptionTier, string | null> = {
  FREE: null, // FREE não tem plano pago
  STARTER: process.env.MERCADOPAGO_PLAN_STARTER_ID || 'STARTER_PLAN_ID', // R$ 67/mês
  PRO: process.env.MERCADOPAGO_PLAN_PRO_ID || 'PRO_PLAN_ID', // R$ 147/mês
  BUSINESS: process.env.MERCADOPAGO_PLAN_BUSINESS_ID || 'BUSINESS_PLAN_ID', // R$ 397/mês
}

/**
 * Configuração completa dos planos
 */
export interface PlanConfig {
  id: string | null
  name: string
  description: string
  price: number // Em reais (BRL)
  currency: 'BRL'
  frequency: 'monthly'
  features: string[]
}

export const PLANS: Record<SubscriptionTier, PlanConfig> = {
  FREE: {
    id: null,
    name: 'Grátis',
    description: 'Para começar e conhecer o Sirius CRM',
    price: 0,
    currency: 'BRL',
    frequency: 'monthly',
    features: [
      'Até 100 deals ativos',
      '2 usuários',
      '1 pipeline',
      'Kanban board completo',
      'Gestão de contatos',
      '3 gerações de IA por mês',
      '5 créditos de prospecção (inicial)',
      'WhatsApp via link (click-to-chat)',
      'Analytics básico',
    ],
  },

  STARTER: {
    id: MERCADO_PAGO_PLAN_IDS.STARTER,
    name: 'Starter',
    description: 'Organização ilimitada para autônomos',
    price: 67,
    currency: 'BRL',
    frequency: 'monthly',
    features: [
      'Deals ilimitados',
      '1 usuário',
      '1 pipeline',
      'Kanban board completo',
      'Gestão de contatos avançada',
      'WhatsApp via link (click-to-chat)',
      'Analytics básico',
      'Integração Google Agenda',
      'Mobile PWA',
    ],
  },

  PRO: {
    id: MERCADO_PAGO_PLAN_IDS.PRO,
    name: 'PRO',
    description: 'Automação e inteligência para vendedores profissionais',
    price: 147,
    currency: 'BRL',
    frequency: 'monthly',
    features: [
      'Tudo do Starter +',
      'Usuários ilimitados',
      'Pipelines ilimitados',
      'Chat Center (WhatsApp integrado)',
      'IA ilimitada (AGI Sirius)',
      '50 créditos de prospecção/mês',
      'Automações de email',
      'Analytics PRO (8 KPIs + 4 gráficos)',
      'Suporte prioritário',
    ],
  },

  BUSINESS: {
    id: MERCADO_PAGO_PLAN_IDS.BUSINESS,
    name: 'Business',
    description: 'Gestão completa de equipes de vendas',
    price: 397,
    currency: 'BRL',
    frequency: 'monthly',
    features: [
      'Tudo do PRO +',
      'Distribuição automática de leads (Round-robin)',
      'Relatórios de equipe e ranking',
      'Team performance analytics',
      'Analytics Business',
      'Suporte VIP',
      'Treinamento personalizado',
    ],
  },
}

/**
 * Configuração dos add-ons (compra única ou recorrente)
 */
export interface AddonConfig {
  type: AddonType
  name: string
  description: string
  price: number
  quantity: number
  recurring: boolean // true = assinatura mensal, false = compra única
  mercadoPagoProductId?: string // ID do produto no Mercado Pago
}

export const ADDONS: Record<AddonType, AddonConfig> = {
  SCRAPING_100: {
    type: 'SCRAPING_100',
    name: 'Pacote 100 Leads',
    description: '100 créditos de prospecção para buscar leads no Google Maps',
    price: 29.9,
    quantity: 100,
    recurring: false, // Compra única
    mercadoPagoProductId: process.env.MERCADOPAGO_ADDON_SCRAPING_100_ID,
  },

  SCRAPING_500: {
    type: 'SCRAPING_500',
    name: 'Pacote 500 Leads',
    description: '500 créditos de prospecção para buscar leads no Google Maps',
    price: 99.9,
    quantity: 500,
    recurring: false, // Compra única
    mercadoPagoProductId: process.env.MERCADOPAGO_ADDON_SCRAPING_500_ID,
  },

  WHATSAPP_EXTRA_INSTANCE: {
    type: 'WHATSAPP_EXTRA_INSTANCE',
    name: 'Instância WhatsApp Extra',
    description: 'Conecte um número de WhatsApp adicional',
    price: 29.9,
    quantity: 1,
    recurring: true, // Assinatura mensal
    mercadoPagoProductId: process.env.MERCADOPAGO_ADDON_WHATSAPP_EXTRA_ID,
  },
}

/**
 * Obtém a configuração de um plano
 */
export function getPlanConfig(tier: SubscriptionTier): PlanConfig {
  return PLANS[tier]
}

/**
 * Obtém a configuração de um add-on
 */
export function getAddonConfig(type: AddonType): AddonConfig {
  return ADDONS[type]
}

/**
 * Verifica se um plano é válido
 */
export function isValidPlan(tier: string): tier is SubscriptionTier {
  return tier in PLANS
}

/**
 * Verifica se um add-on é válido
 */
export function isValidAddon(type: string): type is AddonType {
  return type in ADDONS
}

/**
 * Obtém o ID do plano no Mercado Pago
 */
export function getMercadoPagoPlanId(tier: SubscriptionTier): string | null {
  return MERCADO_PAGO_PLAN_IDS[tier]
}

/**
 * Calcula o preço total de um upgrade (diferença proporcional)
 */
export function calculateProrationAmount(
  fromTier: SubscriptionTier,
  toTier: SubscriptionTier,
  daysRemainingInCycle: number
): number {
  const fromPrice = PLANS[fromTier].price
  const toPrice = PLANS[toTier].price

  const priceDifference = toPrice - fromPrice

  if (priceDifference <= 0) {
    return 0 // Downgrade ou mesmo plano
  }

  // Cálculo proporcional (30 dias por mês)
  const dailyRate = priceDifference / 30
  const prorationAmount = dailyRate * daysRemainingInCycle

  return Math.round(prorationAmount * 100) / 100 // Arredonda para 2 casas decimais
}

/**
 * Formata preço para exibição
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)
}
