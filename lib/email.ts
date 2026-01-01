import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error(
    'RESEND_API_KEY environment variable is required. ' +
    'Get your API key from: https://resend.com/api-keys'
  )
}

export const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Email configuration
 */
export const emailConfig = {
  from: 'Sirius CRM <noreply@sirius.roilabs.com.br>',
  replyTo: 'suporte@roilabs.com.br',
} as const

/**
 * Send email helper with error handling
 */
export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string | string[]
  subject: string
  react: React.ReactElement
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to,
      subject,
      react,
    })

    if (error) {
      console.error('Failed to send email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error }
  }
}
