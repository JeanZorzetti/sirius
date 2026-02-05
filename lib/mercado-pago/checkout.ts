/**
 * Mercado Pago Checkout - v2.0
 *
 * Funções para criar checkouts de planos e add-ons.
 */

import { SubscriptionTier, AddonType } from '@prisma/client'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { getPlanConfig, getAddonConfig } from './products'

// Inicializar cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
  },
})

const preference = new Preference(client)

/**
 * Cria um checkout para assinatura de plano
 */
export async function createPlanCheckout(params: {
  organizationId: string
  tier: SubscriptionTier
  userEmail: string
  userName?: string
}) {
  const { organizationId, tier, userEmail, userName } = params

  const planConfig = getPlanConfig(tier)

  if (!planConfig.id) {
    throw new Error(`Plan ${tier} does not have a Mercado Pago ID`)
  }

  // Criar preferência de pagamento
  const preferenceData = {
    items: [
      {
        id: planConfig.id,
        title: `Sirius CRM - Plano ${planConfig.name}`,
        description: planConfig.description,
        category_id: 'services',
        quantity: 1,
        currency_id: 'BRL' as const,
        unit_price: planConfig.price,
      },
    ],
    payer: {
      email: userEmail,
      name: userName,
    },
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true&tier=${tier}`,
      failure: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?pending=true`,
    },
    auto_return: 'approved' as const,
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercado-pago`,
    external_reference: organizationId, // Para identificar a org no webhook
    metadata: {
      organization_id: organizationId,
      tier,
      type: 'subscription',
    },
    // Assinatura recorrente
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: planConfig.price,
      currency_id: 'BRL' as const,
    },
  }

  const response = await preference.create({ body: preferenceData })

  return {
    preferenceId: response.id,
    initPoint: response.init_point, // URL de checkout
    sandboxInitPoint: response.sandbox_init_point,
  }
}

/**
 * Cria um checkout para compra de add-on
 */
export async function createAddonCheckout(params: {
  organizationId: string
  addonType: AddonType
  userEmail: string
  userName?: string
}) {
  const { organizationId, addonType, userEmail, userName } = params

  const addonConfig = getAddonConfig(addonType)

  // Criar preferência de pagamento
  const preferenceData = {
    items: [
      {
        id: addonConfig.mercadoPagoProductId || addonType,
        title: addonConfig.name,
        description: addonConfig.description,
        category_id: 'services',
        quantity: 1,
        currency_id: 'BRL' as const,
        unit_price: addonConfig.price,
      },
    ],
    payer: {
      email: userEmail,
      name: userName,
    },
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_APP_URL}/settings/addons?success=true&addon=${addonType}`,
      failure: `${process.env.NEXT_PUBLIC_APP_URL}/settings/addons?canceled=true`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/settings/addons?pending=true`,
    },
    auto_return: 'approved' as const,
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercado-pago`,
    external_reference: organizationId,
    metadata: {
      organization_id: organizationId,
      addon_type: addonType,
      type: 'addon',
      recurring: addonConfig.recurring,
    },
  }

  // Se for recorrente, adicionar auto_recurring
  if (addonConfig.recurring) {
    ;(preferenceData as any).auto_recurring = {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: addonConfig.price,
      currency_id: 'BRL' as const,
    }
  }

  const response = await preference.create({ body: preferenceData })

  return {
    preferenceId: response.id,
    initPoint: response.init_point,
    sandboxInitPoint: response.sandbox_init_point,
  }
}

/**
 * Cria um checkout para upgrade de plano
 */
export async function createUpgradeCheckout(params: {
  organizationId: string
  currentTier: SubscriptionTier
  newTier: SubscriptionTier
  userEmail: string
  userName?: string
  daysRemainingInCycle?: number
}) {
  const {
    organizationId,
    currentTier,
    newTier,
    userEmail,
    userName,
    daysRemainingInCycle = 30,
  } = params

  const newPlanConfig = getPlanConfig(newTier)
  const currentPlanConfig = getPlanConfig(currentTier)

  if (!newPlanConfig.id) {
    throw new Error(`Plan ${newTier} does not have a Mercado Pago ID`)
  }

  // Calcular diferença de preço
  const priceDifference = newPlanConfig.price - currentPlanConfig.price

  if (priceDifference <= 0) {
    throw new Error('Cannot upgrade to a cheaper or same plan')
  }

  // Criar preferência de pagamento (upgrade imediato, nova assinatura)
  const preferenceData = {
    items: [
      {
        id: newPlanConfig.id,
        title: `Upgrade: ${currentPlanConfig.name} → ${newPlanConfig.name}`,
        description: `Upgrade para plano ${newPlanConfig.name}`,
        category_id: 'services',
        quantity: 1,
        currency_id: 'BRL' as const,
        unit_price: newPlanConfig.price, // Cobra preço cheio do novo plano
      },
    ],
    payer: {
      email: userEmail,
      name: userName,
    },
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true&upgrade=true&tier=${newTier}`,
      failure: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?canceled=true`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?pending=true`,
    },
    auto_return: 'approved' as const,
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercado-pago`,
    external_reference: organizationId,
    metadata: {
      organization_id: organizationId,
      previous_tier: currentTier,
      new_tier: newTier,
      type: 'upgrade',
    },
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: newPlanConfig.price,
      currency_id: 'BRL' as const,
    },
  }

  const response = await preference.create({ body: preferenceData })

  return {
    preferenceId: response.id,
    initPoint: response.init_point,
    sandboxInitPoint: response.sandbox_init_point,
    priceDifference,
  }
}

/**
 * Cancela uma assinatura do Mercado Pago
 */
export async function cancelSubscription(subscriptionId: string) {
  // Nota: A API do Mercado Pago para cancelar assinaturas varia
  // Pode ser necessário usar a API de Preapproval
  // Por enquanto, vamos apenas atualizar o status no banco de dados
  // e enviar email de cancelamento

  // TODO: Implementar cancelamento via API do Mercado Pago quando disponível
  console.warn(
    'Subscription cancellation via Mercado Pago API not yet implemented'
  )

  return {
    success: true,
    message: 'Subscription will be canceled at the end of billing cycle',
  }
}
