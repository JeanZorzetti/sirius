import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCheckoutPreference } from '@/lib/mercadopago'
import logger from '@/lib/logger'

/**
 * POST /api/mercadopago/checkout
 * Cria preferência de checkout para upgrade PRO
 */
export async function POST() {
  try {
    const session = await getSession()

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar usuário e organização
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: true
      }
    })

    if (!user || !user.organization) {
      return NextResponse.json(
        { error: 'Usuário ou organização não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se já é PRO
    if (user.organization.plan === 'PRO') {
      return NextResponse.json(
        { error: 'Organização já está no plano PRO' },
        { status: 400 }
      )
    }

    // Criar preferência de checkout
    const { preferenceId, initPoint, sandboxInitPoint } = await createCheckoutPreference(
      user.organization.id,
      user.organization.name,
      user.email,
      'PRO'
    )

    // Salvar preferenceId na organização
    await prisma.organization.update({
      where: { id: user.organization.id },
      data: {
        mercadoPagoPreferenceId: preferenceId
      }
    })

    logger.info({
      organizationId: user.organization.id,
      preferenceId,
      userEmail: user.email
    }, 'Checkout preference created')

    // Retornar URL do checkout
    // Em produção, usar initPoint. Em desenvolvimento, usar sandboxInitPoint
    const checkoutUrl = process.env.NODE_ENV === 'production' ? initPoint : (sandboxInitPoint || initPoint)

    return NextResponse.json({
      success: true,
      preferenceId,
      checkoutUrl
    })

  } catch (error) {
    logger.error({
      error,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 'Error creating checkout preference')

    return NextResponse.json(
      { error: 'Erro ao criar preferência de checkout' },
      { status: 500 }
    )
  }
}
