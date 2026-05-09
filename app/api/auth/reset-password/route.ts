import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import logger from '@/lib/logger'
import { authRateLimit } from '@/lib/ratelimit'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

// Password validation
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'A senha deve ter pelo menos 8 caracteres' }
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'A senha deve conter pelo menos uma letra maiuscula' }
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'A senha deve conter pelo menos uma letra minuscula' }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'A senha deve conter pelo menos um numero' }
  }

  return { valid: true }
}

export async function POST(request: NextRequest) {
  try {
    const blocked = await authRateLimit(request)
    if (blocked) return blocked

    const { token, password } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token invalido' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Senha e obrigatoria' },
        { status: 400 }
      )
    }

    // Validate password strength
    const validation = validatePassword(password)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Find the token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      logger.warn({ token: token.substring(0, 10) }, 'Invalid password reset token')
      return NextResponse.json(
        { error: 'Link invalido ou expirado' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } })
      return NextResponse.json(
        { error: 'Link expirado. Solicite um novo.' },
        { status: 400 }
      )
    }

    // Check if token was already used
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Este link ja foi utilizado' },
        { status: 400 }
      )
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    })

    if (!user) {
      logger.error({ email: resetToken.email }, 'User not found for password reset')
      return NextResponse.json(
        { error: 'Usuario nao encontrado' },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    })

    logger.info({ email: user.email }, 'Password reset successful')

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso',
    })
  } catch (error) {
    logger.error({ error }, 'Error in reset-password')
    return await apiError(ERR.RESET_PASSWORD, 500)
  }
}

// GET to validate token
export async function GET(request: NextRequest) {
  try {
    const blocked = await authRateLimit(request)
    if (blocked) return blocked

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token nao fornecido' },
        { status: 400 }
      )
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json({ valid: false, error: 'Token invalido' })
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, error: 'Token expirado' })
    }

    if (resetToken.used) {
      return NextResponse.json({ valid: false, error: 'Token ja utilizado' })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    logger.error({ error }, 'Error validating reset token')
    return await apiError(ERR.VALIDATE_TOKEN, 500)
  }
}
