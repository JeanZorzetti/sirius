import { sendEmail } from './email'
import { WelcomeEmail } from '../emails/templates/welcome'
import { DealCreatedEmail } from '../emails/templates/deal-created'
import { DealStageChangedEmail } from '../emails/templates/deal-stage-changed'
import { UpgradeNudgeEmail } from '../emails/templates/upgrade-nudge'
import { PrismaClient, EmailAutomationType, EmailStatus } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Verifica se a automação está habilitada e retorna as configurações
 */
async function getAutomationSettings(organizationId: string, type: EmailAutomationType) {
  const setting = await prisma.emailAutomationSetting.findUnique({
    where: {
      organizationId_type: {
        organizationId,
        type
      }
    }
  })

  return setting
}

/**
 * Registra o envio de email no log
 */
async function logEmailSent({
  organizationId,
  userId,
  type,
  to,
  subject,
  status = 'SENT' as EmailStatus,
  errorMessage = null
}: {
  organizationId: string
  userId?: string
  type: EmailAutomationType
  to: string
  subject: string
  status?: EmailStatus
  errorMessage?: string | null
}) {
  await prisma.emailLog.create({
    data: {
      organizationId,
      userId: userId || null,
      type,
      to,
      subject,
      status,
      errorMessage
    }
  })
}

/**
 * Substitui variáveis no template customizado
 */
function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
  })
  return result
}

/**
 * Envia email de boas-vindas após registro
 */
export async function sendWelcomeEmail({
  to,
  userName,
  organizationName,
  organizationId,
  userId
}: {
  to: string
  userName: string
  organizationName: string
  organizationId: string
  userId?: string
}) {
  const settings = await getAutomationSettings(organizationId, 'WELCOME_EMAIL')

  // Se a automação estiver desabilitada, não envia
  if (!settings || !settings.enabled) {
    console.log('[EMAIL] Welcome email automation is disabled')
    return { success: false, error: 'Automation disabled' }
  }

  // Delay se configurado
  if (settings.sendDelayMinutes > 0) {
    // TODO: Implementar queue system para delays
    console.log(`[EMAIL] Would delay send by ${settings.sendDelayMinutes} minutes`)
  }

  const defaultSubject = `Bem-vindo ao Sirius CRM, ${userName}!`
  const subject = settings.customSubject
    ? replaceVariables(settings.customSubject, { userName, organizationName })
    : defaultSubject

  try {
    const result = await sendEmail({
      to,
      subject,
      react: WelcomeEmail({
        userName,
        organizationName,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      }),
    })

    // Log do envio
    await logEmailSent({
      organizationId,
      userId,
      type: 'WELCOME_EMAIL',
      to,
      subject,
      status: result.success ? 'SENT' : 'FAILED',
      errorMessage: result.success ? null : (result.error as string || 'Unknown error')
    })

    return result
  } catch (error: any) {
    await logEmailSent({
      organizationId,
      userId,
      type: 'WELCOME_EMAIL',
      to,
      subject,
      status: 'FAILED',
      errorMessage: error.message
    })
    throw error
  }
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
  organizationId,
  userId
}: {
  to: string
  userName: string
  dealTitle: string
  dealValue: number
  dealStage: string
  contactName: string
  dealUrl: string
  organizationId: string
  userId?: string
}) {
  const settings = await getAutomationSettings(organizationId, 'DEAL_CREATED')

  if (!settings || !settings.enabled) {
    console.log('[EMAIL] Deal created email automation is disabled')
    return { success: false, error: 'Automation disabled' }
  }

  if (settings.sendDelayMinutes > 0) {
    console.log(`[EMAIL] Would delay send by ${settings.sendDelayMinutes} minutes`)
  }

  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(dealValue)

  const defaultSubject = `Novo negócio criado: ${dealTitle}`
  const subject = settings.customSubject
    ? replaceVariables(settings.customSubject, {
        userName,
        dealTitle,
        dealValue: formattedValue,
        dealStage,
        contactName
      })
    : defaultSubject

  try {
    const result = await sendEmail({
      to,
      subject,
      react: DealCreatedEmail({
        userName,
        dealTitle,
        dealValue,
        dealStage,
        contactName,
        dealUrl,
      }),
    })

    await logEmailSent({
      organizationId,
      userId,
      type: 'DEAL_CREATED',
      to,
      subject,
      status: result.success ? 'SENT' : 'FAILED',
      errorMessage: result.success ? null : (result.error as string || 'Unknown error')
    })

    return result
  } catch (error: any) {
    await logEmailSent({
      organizationId,
      userId,
      type: 'DEAL_CREATED',
      to,
      subject,
      status: 'FAILED',
      errorMessage: error.message
    })
    throw error
  }
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
  organizationId,
  userId
}: {
  to: string
  assigneeName: string
  dealTitle: string
  dealValue: number
  oldStage: string
  newStage: string
  dealUrl: string
  organizationId: string
  userId?: string
}) {
  const settings = await getAutomationSettings(organizationId, 'DEAL_STAGE_CHANGED')

  if (!settings || !settings.enabled) {
    console.log('[EMAIL] Deal stage changed email automation is disabled')
    return { success: false, error: 'Automation disabled' }
  }

  if (settings.sendDelayMinutes > 0) {
    console.log(`[EMAIL] Would delay send by ${settings.sendDelayMinutes} minutes`)
  }

  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(dealValue)

  const defaultSubject = `${dealTitle} mudou para ${newStage}`
  const subject = settings.customSubject
    ? replaceVariables(settings.customSubject, {
        assigneeName,
        dealTitle,
        dealValue: formattedValue,
        oldStage,
        newStage
      })
    : defaultSubject

  try {
    const result = await sendEmail({
      to,
      subject,
      react: DealStageChangedEmail({
        assigneeName,
        dealTitle,
        dealValue,
        oldStage,
        newStage,
        dealUrl,
      }),
    })

    await logEmailSent({
      organizationId,
      userId,
      type: 'DEAL_STAGE_CHANGED',
      to,
      subject,
      status: result.success ? 'SENT' : 'FAILED',
      errorMessage: result.success ? null : (result.error as string || 'Unknown error')
    })

    return result
  } catch (error: any) {
    await logEmailSent({
      organizationId,
      userId,
      type: 'DEAL_STAGE_CHANGED',
      to,
      subject,
      status: 'FAILED',
      errorMessage: error.message
    })
    throw error
  }
}

/**
 * Envia email de upgrade quando usuário está próximo do limite
 */
export async function sendUpgradeNudgeEmail({
  to,
  userName,
  currentDeals,
  maxDeals = 10,
  organizationId,
  userId
}: {
  to: string
  userName: string
  currentDeals: number
  maxDeals?: number
  organizationId: string
  userId?: string
}) {
  const settings = await getAutomationSettings(organizationId, 'UPGRADE_NUDGE')

  if (!settings || !settings.enabled) {
    console.log('[EMAIL] Upgrade nudge email automation is disabled')
    return { success: false, error: 'Automation disabled' }
  }

  if (settings.sendDelayMinutes > 0) {
    console.log(`[EMAIL] Would delay send by ${settings.sendDelayMinutes} minutes`)
  }

  const defaultSubject = `Você está perto do limite de negócios! 📊`
  const subject = settings.customSubject
    ? replaceVariables(settings.customSubject, {
        userName,
        currentDeals: currentDeals.toString(),
        maxDeals: maxDeals.toString()
      })
    : defaultSubject

  try {
    const result = await sendEmail({
      to,
      subject,
      react: UpgradeNudgeEmail({
        userName,
        currentDeals,
        maxDeals,
        upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      }),
    })

    await logEmailSent({
      organizationId,
      userId,
      type: 'UPGRADE_NUDGE',
      to,
      subject,
      status: result.success ? 'SENT' : 'FAILED',
      errorMessage: result.success ? null : (result.error as string || 'Unknown error')
    })

    return result
  } catch (error: any) {
    await logEmailSent({
      organizationId,
      userId,
      type: 'UPGRADE_NUDGE',
      to,
      subject,
      status: 'FAILED',
      errorMessage: error.message
    })
    throw error
  }
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
