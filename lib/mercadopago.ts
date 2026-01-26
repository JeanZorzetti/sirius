import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import logger from './logger'

// Inicializar cliente Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
    idempotencyKey: 'your-idempotency-key' // Será gerado dinamicamente
  }
})

const preferenceClient = new Preference(client)
const paymentClient = new Payment(client)

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
export async function createCheckoutPreference(
  organizationId: string,
  organizationName: string,
  userEmail: string,
  plan: 'PRO' = 'PRO'
) {
  try {
    const item: PreferenceItem = {
      id: `plan_${plan.toLowerCase()}`,
      title: `Plano ${plan} - ${organizationName}`,
      quantity: 1,
      unit_price: plan === 'PRO' ? 49.00 : 0, // R$ 49,00/mês para PRO
      currency_id: 'BRL'
    }

    const payer: Payer = {
      email: userEmail
    }

    const preference = await preferenceClient.create({
      body: {
        items: [item],
        payer,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?status=failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?status=pending`
        },
        auto_return: 'approved',
        payment_methods: {
          excluded_payment_types: [], // Aceitar todos (PIX, cartão, boleto)
          installments: 12 // Até 12x no cartão
        },
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
        external_reference: organizationId, // Usar org ID como referência
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
    const payment = await paymentClient.get({ id: paymentId })

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
  PRO: 49.00
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

export { client as mercadoPagoClient }
