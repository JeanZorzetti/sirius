import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import crypto from 'crypto'
import { authRateLimit } from '@/lib/ratelimit'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function POST(request: NextRequest) {
  try {
    const blocked = await authRateLimit(request)
    if (blocked) return blocked

    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email e obrigatorio' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return NextResponse.json({ success: true })
    }

    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.passwordResetToken.create({
      data: { token, email: normalizedEmail, expiresAt },
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'https://siriuscrm.com.br'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    const apiKey = process.env.RESEND_API_KEY
    console.log('[forgot-password] RESEND_API_KEY set:', !!apiKey, '| key prefix:', apiKey?.slice(0, 8))

    if (!apiKey) {
      console.error('[forgot-password] RESEND_API_KEY is not set — email not sent')
      return NextResponse.json({ error: 'Configuracao de email ausente.' }, { status: 500 })
    }

    const resend = new Resend(apiKey)
    const { data, error: resendError } = await resend.emails.send({
      from: 'Sirius CRM <noreply@siriuscrm.com.br>',
      to: normalizedEmail,
      subject: 'Redefinir sua senha - Sirius CRM',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6366f1; margin: 0;">Sirius CRM</h1>
          </div>
          <div style="background: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #111827;">Redefinir sua senha</h2>
            <p>Ola${user.name ? `, ${user.name}` : ''}!</p>
            <p>Recebemos uma solicitacao para redefinir a senha da sua conta no Sirius CRM.</p>
            <p>Clique no botao abaixo para criar uma nova senha:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
                Redefinir Senha
              </a>
            </div>
            <p style="font-size: 14px; color: #6b7280;">Este link expira em <strong>1 hora</strong>.</p>
            <p style="font-size: 14px; color: #6b7280;">Se voce nao solicitou esta alteracao, ignore este email.</p>
          </div>
          <div style="text-align: center; font-size: 12px; color: #9ca3af;">
            <p>Se o botao nao funcionar, copie e cole este link:</p>
            <p style="word-break: break-all; color: #6366f1;">${resetUrl}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p>&copy; ${new Date().getFullYear()} Sirius CRM - ROI Labs</p>
          </div>
        </body>
        </html>
      `,
    })

    if (resendError) {
      console.error('[forgot-password] Resend error:', JSON.stringify(resendError))
      return NextResponse.json({ error: 'Falha ao enviar email. Tente novamente.' }, { status: 500 })
    }

    console.log('[forgot-password] Email sent successfully. messageId:', data?.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[forgot-password] Unexpected error:', error)
    return await apiError(ERR.FORGOT_PASSWORD, 500)
  }
}
