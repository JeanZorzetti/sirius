import { MercadoPagoConfig, Preference, Payment, PreApproval } from 'mercadopago'
import logger from './logger'

// Lazy singleton — avoid top-level instantiation (breaks Docker standalone build)
let _client: MercadoPagoConfig | null = null
function getClient() {
  if (!_client) {
    _client = new MercadoPagoConfig({
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
      options: { timeout: 5000 },
    })
  }
  return _client
}

let _preferenceClient: Preference | null = null
function getPreferenceClient() {
  if (!_preferenceClient) _preferenceClient = new Preference(getClient())
  return _preferenceClient
}

let _paymentClient: Payment | null = null
function getPaymentClient() {
  if (!_paymentClient) _paymentClient = new Payment(getClient())
  return _paymentClient
}

let _preApprovalClient: PreApproval | null = null
function getPreApprovalClient() {
  if (!_preApprovalClient) _preApprovalClient = new PreApproval(getClient())
  return _preApprovalClient
}

/**
 * Interface para item de preferência
 */
export interface PreferenceItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  currency_id?: string
}

/**
 * Interface para payer (comprador)
 */
export interface Payer {
  name?: string
  surname?: string
  email: string
  phone?: {
    area_code?: string
    number?: string
  }
}

/**
 * Criar preferência de pagamento para plano PRO
 * Suporta PIX, Cartão de Crédito e Boleto
 */
export type CheckoutPlan =
  | 'STARTER'
  | 'PRO'
  | 'BUSINESS'
  | 'STARTER_ANNUAL'
  | 'PRO_ANNUAL'
  | 'BUSINESS_ANNUAL'
  | 'FOUNDER_STARTER'
  | 'FOUNDER_PRO'
  | 'FOUNDER_BUSINESS'
  | 'WHATSAPP_SETUP'

export async function createCheckoutPreference(
  organizationId: string,
  organizationName: string,
  userEmail: string,
  plan: CheckoutPlan = 'STARTER'
) {
  try {
    const planPrices: Record<string, number> = {
      STARTER: 67.00,
      PRO: 147.00,
      BUSINESS: 397.00,
      STARTER_ANNUAL: 643.20,
      PRO_ANNUAL: 1411.20,
      BUSINESS_ANNUAL: 3811.20,
      FOUNDER_STARTER: 39.00,
      FOUNDER_PRO: 87.00,
      FOUNDER_BUSINESS: 234.00,
      WHATSAPP_SETUP: 297.00,
    }
    const planTitles: Record<string, string> = {
      STARTER: `Plano Starter Mensal - ${organizationName}`,
      PRO: `Plano Pro Mensal - ${organizationName}`,
      BUSINESS: `Plano Business Mensal - ${organizationName}`,
      STARTER_ANNUAL: `Plano Starter Anual - ${organizationName} (20% off)`,
      PRO_ANNUAL: `Plano Pro Anual - ${organizationName} (20% off)`,
      BUSINESS_ANNUAL: `Plano Business Anual - ${organizationName} (20% off)`,
      FOUNDER_STARTER: `Fundador Starter - ${organizationName} (R$39/mês vitalício)`,
      FOUNDER_PRO: `Fundador Pro - ${organizationName} (R$87/mês vitalício)`,
      FOUNDER_BUSINESS: `Fundador Business - ${organizationName} (R$234/mês vitalício)`,
      WHATSAPP_SETUP: `Implantação WhatsApp Oficial - ${organizationName}`,
    }

    const item: PreferenceItem = {
      id: `plan_${plan.toLowerCase()}`,
      title: planTitles[plan] || `Plano ${plan} - ${organizationName}`,
      quantity: 1,
      unit_price: planPrices[plan] ?? 67.00,
      currency_id: 'BRL'
    }

    const payer: Payer = {
      email: userEmail
    }

    const preference = await getPreferenceClient().create({
      body: {
        items: [item],
        payer,
        back_urls: {
          success: plan === 'WHATSAPP_SETUP'
            ? `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations/whatsapp-official?setup_paid=1`
            : `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso`,
          failure: `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?status=failure`,
          pending: `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?status=pending`
        },
        auto_return: 'approved',
        payment_methods: {
          excluded_payment_types: [
            { id: 'ticket' },       // boleto
            { id: 'bank_transfer' }, // PIX
            { id: 'debit_card' }    // débito (não é recorrente automático)
          ],
          installments: 12
        },
        notification_url: `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
        external_reference: `${organizationId}_${plan}`, // "orgId_TIER" para parsing no webhook
        statement_descriptor: 'SIRIUS CRM',
        expires: false,
        metadata: {
          organization_id: organizationId,
          plan
        }
      }
    })

    logger.info({
      organizationId,
      preferenceId: preference.id,
      plan
    }, 'Mercado Pago checkout preference created')

    return {
      preferenceId: preference.id,
      initPoint: preference.init_point!, // URL do checkout
      sandboxInitPoint: preference.sandbox_init_point
    }
  } catch (error) {
    logger.error({
      error,
      organizationId,
      plan
    }, 'Failed to create Mercado Pago preference')
    throw new Error('Erro ao criar preferência de pagamento')
  }
}

/**
 * Buscar informações de um pagamento
 */
export async function getPayment(paymentId: string) {
  try {
    const payment = await getPaymentClient().get({ id: paymentId })

    logger.info({
      paymentId,
      status: payment.status,
      statusDetail: payment.status_detail
    }, 'Payment info retrieved')

    return payment
  } catch (error) {
    logger.error({
      error,
      paymentId
    }, 'Failed to get payment info')
    throw new Error('Erro ao buscar informações do pagamento')
  }
}

/**
 * Verificar se um pagamento foi aprovado
 */
export async function isPaymentApproved(paymentId: string): Promise<boolean> {
  try {
    const payment = await getPayment(paymentId)
    return payment.status === 'approved'
  } catch (error) {
    logger.error({ error, paymentId }, 'Failed to verify payment status')
    return false
  }
}

/**
 * Status de pagamento do Mercado Pago
 */
export type PaymentStatus =
  | 'pending'       // Aguardando pagamento
  | 'approved'      // Aprovado
  | 'authorized'    // Autorizado (cartão)
  | 'in_process'    // Em processamento
  | 'in_mediation'  // Em disputa
  | 'rejected'      // Rejeitado
  | 'cancelled'     // Cancelado
  | 'refunded'      // Reembolsado
  | 'charged_back'  // Chargeback

/**
 * Tipo de pagamento
 */
export type PaymentType =
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer' // PIX
  | 'ticket'        // Boleto
  | 'atm'

/**
 * Obter texto amigável para status de pagamento
 */
export function getPaymentStatusText(status: PaymentStatus): string {
  const statusMap: Record<PaymentStatus, string> = {
    pending: 'Aguardando Pagamento',
    approved: 'Aprovado',
    authorized: 'Autorizado',
    in_process: 'Em Processamento',
    in_mediation: 'Em Disputa',
    rejected: 'Rejeitado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
    charged_back: 'Estornado'
  }

  return statusMap[status] || 'Desconhecido'
}

/**
 * Obter texto amigável para tipo de pagamento
 */
export function getPaymentTypeText(type: PaymentType): string {
  const typeMap: Record<PaymentType, string> = {
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    bank_transfer: 'PIX',
    ticket: 'Boleto',
    atm: 'Caixa Eletrônico'
  }

  return typeMap[type] || 'Outro'
}

/**
 * Preços dos planos
 */
export const PLAN_PRICES = {
  FREE: 0,
  STARTER: 67.00,
  PRO: 147.00,
  BUSINESS: 397.00,
  STARTER_ANNUAL: 643.20,
  PRO_ANNUAL: 1411.20,
  BUSINESS_ANNUAL: 3811.20,
  FOUNDER_STARTER: 39.00,
  FOUNDER_PRO: 87.00,
  FOUNDER_BUSINESS: 234.00,
} as const

/**
 * Validar credenciais do Mercado Pago
 */
export function validateMercadoPagoCredentials(): boolean {
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    logger.error('MERCADO_PAGO_ACCESS_TOKEN not configured')
    return false
  }

  return true
}

/**
 * Cria assinatura recorrente mensal (PreApproval) — apenas cartão de crédito.
 * Retorna subscriptionId que deve ser salvo na organização.
 */
export async function createSubscription(
  organizationId: string,
  organizationName: string,
  userEmail: string,
  plan: CheckoutPlan,
  customPrice?: number
) {
  const planPrices: Record<string, number> = {
    STARTER: 67.00,
    PRO: 147.00,
    BUSINESS: 397.00,
    FOUNDER_STARTER: 39.00,
    FOUNDER_PRO: 87.00,
    FOUNDER_BUSINESS: 234.00,
  }

  const planTitles: Record<string, string> = {
    STARTER: `Sirius CRM Starter - ${organizationName}`,
    PRO: `Sirius CRM Pro - ${organizationName}`,
    BUSINESS: `Sirius CRM Business - ${organizationName}`,
    FOUNDER_STARTER: `Sirius CRM Fundador Starter - ${organizationName}`,
    FOUNDER_PRO: `Sirius CRM Fundador Pro - ${organizationName}`,
    FOUNDER_BUSINESS: `Sirius CRM Fundador Business - ${organizationName}`,
  }

  const price = customPrice ?? planPrices[plan]
  if (!price) throw new Error(`Plano ${plan} não suporta assinatura recorrente`)

  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL

  try {
    const subscription = await getPreApprovalClient().create({
      body: {
        reason: planTitles[plan] || `Sirius CRM ${plan} - ${organizationName}`,
        payer_email: userEmail,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: price,
          currency_id: 'BRL',
        },
        back_url: `${baseUrl}/checkout/sucesso`,
        // notification_url is accepted by the MP API but missing from the SDK's PreApprovalRequest type
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        external_reference: `${organizationId}_${plan}`,
        status: 'pending',
      } as Parameters<ReturnType<typeof getPreApprovalClient>['create']>[0]['body'] & { notification_url: string },
    })

    logger.info({ organizationId, subscriptionId: subscription.id, plan }, 'MP subscription created')

    return {
      subscriptionId: subscription.id!,
      initPoint: subscription.init_point!,
    }
  } catch (error) {
    logger.error({ error, organizationId, plan }, 'Failed to create MP subscription')
    throw new Error('Erro ao criar assinatura recorrente')
  }
}

/**
 * Cancela uma assinatura ativa no Mercado Pago.
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    await getPreApprovalClient().update({
      id: subscriptionId,
      body: { status: 'cancelled' },
    })
    logger.info({ subscriptionId }, 'MP subscription cancelled')
  } catch (error) {
    logger.error({ error, subscriptionId }, 'Failed to cancel MP subscription')
    throw new Error('Erro ao cancelar assinatura')
  }
}

export { getClient as getMercadoPagoClient }
