import { sendEmail } from './email'
import { WelcomeEmail } from '../emails/templates/welcome'
import { DealCreatedEmail } from '../emails/templates/deal-created'
import { DealStageChangedEmail } from '../emails/templates/deal-stage-changed'
import { UpgradeNudgeEmail } from '../emails/templates/upgrade-nudge'

/**
 * Envia email de boas-vindas após registro
 */
export async function sendWelcomeEmail({
  to,
  userName,
  organizationName,
}: {
  to: string
  userName: string
  organizationName: string
}) {
  return await sendEmail({
    to,
    subject: `Bem-vindo ao Sirius CRM, ${userName}!`,
    react: WelcomeEmail({
      userName,
      organizationName,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    }),
  })
}

/**
 * Envia notificação quando um negócio é criado
 */
export async function sendDealCreatedEmail({
  to,
  userName,
  dealTitle,
  dealValue,
  dealStage,
  contactName,
  dealUrl,
}: {
  to: string
  userName: string
  dealTitle: string
  dealValue: number
  dealStage: string
  contactName: string
  dealUrl: string
}) {
  return await sendEmail({
    to,
    subject: `Novo negócio criado: ${dealTitle}`,
    react: DealCreatedEmail({
      userName,
      dealTitle,
      dealValue,
      dealStage,
      contactName,
      dealUrl,
    }),
  })
}

/**
 * Envia notificação quando um negócio muda de etapa
 */
export async function sendDealStageChangedEmail({
  to,
  assigneeName,
  dealTitle,
  dealValue,
  oldStage,
  newStage,
  dealUrl,
}: {
  to: string
  assigneeName: string
  dealTitle: string
  dealValue: number
  oldStage: string
  newStage: string
  dealUrl: string
}) {
  return await sendEmail({
    to,
    subject: `${dealTitle} mudou para ${newStage}`,
    react: DealStageChangedEmail({
      assigneeName,
      dealTitle,
      dealValue,
      oldStage,
      newStage,
      dealUrl,
    }),
  })
}

/**
 * Envia email de upgrade quando usuário está próximo do limite
 */
export async function sendUpgradeNudgeEmail({
  to,
  userName,
  currentDeals,
  maxDeals = 10,
}: {
  to: string
  userName: string
  currentDeals: number
  maxDeals?: number
}) {
  return await sendEmail({
    to,
    subject: `Você está perto do limite de negócios! 📊`,
    react: UpgradeNudgeEmail({
      userName,
      currentDeals,
      maxDeals,
      upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    }),
  })
}

/**
 * Verifica se deve enviar email de upgrade (8/10 negócios)
 */
export function shouldSendUpgradeNudge(
  currentDeals: number,
  maxDeals: number = 10,
  tier: string
): boolean {
  // Só envia para usuários FREE
  if (tier !== 'FREE') return false

  // Envia quando atingir 80% do limite (8 de 10 deals)
  const threshold = Math.floor(maxDeals * 0.8)
  return currentDeals === threshold
}

/**
 * Helper para executar envio de email em background (non-blocking)
 */
export function sendEmailAsync(emailPromise: Promise<any>) {
  // Executa em background sem bloquear a response
  emailPromise
    .then((result) => {
      if (result.success) {
        console.log('✅ Email sent successfully:', result.data?.id)
      } else {
        console.error('❌ Failed to send email:', result.error)
      }
    })
    .catch((error) => {
      console.error('❌ Email sending crashed:', error)
    })
}
