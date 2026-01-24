import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import crypto from 'crypto'
import logger from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email e obrigatorio' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists (but don't reveal this to the client)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    // Always return success to prevent email enumeration attacks
    if (!user) {
      logger.info({ email: normalizedEmail }, 'Password reset requested for non-existent email')
      return NextResponse.json({ success: true })
    }

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    })

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save the token
    await prisma.passwordResetToken.create({
      data: {
        token,
        email: normalizedEmail,
        expiresAt,
      },
    })

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sirius.roilabs.com.br'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    // Send email
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'Sirius CRM <noreply@sirius.roilabs.com.br>',
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
                <a href="${resetUrl}"
                   style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">
                  Redefinir Senha
                </a>
              </div>

              <p style="font-size: 14px; color: #6b7280;">
                Este link expira em <strong>1 hora</strong>.
              </p>
              <p style="font-size: 14px; color: #6b7280;">
                Se voce nao solicitou esta alteracao, ignore este email. Sua senha permanecera a mesma.
              </p>
            </div>

            <div style="text-align: center; font-size: 12px; color: #9ca3af;">
              <p>Se o botao nao funcionar, copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; color: #6366f1;">${resetUrl}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p>&copy; ${new Date().getFullYear()} Sirius CRM - ROI Labs</p>
            </div>
          </body>
          </html>
        `,
      })

      logger.info({ email: normalizedEmail }, 'Password reset email sent')
    } else {
      logger.warn('RESEND_API_KEY not configured, email not sent')
      // In development, log the reset URL
      if (process.env.NODE_ENV === 'development') {
        console.log('Reset URL:', resetUrl)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Error in forgot-password')
    return NextResponse.json(
      { error: 'Erro ao processar solicitacao' },
      { status: 500 }
    )
  }
}
