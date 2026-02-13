import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCheckoutPreference } from '@/lib/mercadopago'
import logger from '@/lib/logger'

const FOUNDER_LIMIT = 100

/**
 * POST /api/mercadopago/checkout
 * Cria preferência de checkout para upgrade PRO ou FOUNDER
 * Body: { plan?: 'PRO' | 'FOUNDER' }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Parse body — default to PRO
    let plan: 'PRO' | 'FOUNDER' = 'PRO'
    try {
      const body = await request.json()
      if (body?.plan === 'FOUNDER') plan = 'FOUNDER'
    } catch {
      // No body is fine — defaults to PRO
    }

    // Buscar usuário e organização
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user || !user.organization) {
      return NextResponse.json(
        { error: 'Usuário ou organização não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se já é PRO ou BUSINESS (e não está tentando virar fundador)
    if (['PRO', 'BUSINESS'].includes(user.organization.tier) && plan !== 'FOUNDER') {
      return NextResponse.json(
        { error: 'Organização já está no plano PRO' },
        { status: 400 }
      )
    }

    // Se já é fundador, não deixar comprar novamente
    if (user.organization.isFounder) {
      return NextResponse.json(
        { error: 'Organização já é fundadora do Sirius CRM' },
        { status: 400 }
      )
    }

    // Verificar vagas para programa de fundadores
    if (plan === 'FOUNDER') {
      const foundersCount = await prisma.organization.count({
        where: { isFounder: true }
      })
      if (foundersCount >= FOUNDER_LIMIT) {
        return NextResponse.json(
          { error: 'Todas as vagas do programa de fundadores foram preenchidas.' },
          { status: 400 }
        )
      }
    }

    // Criar preferência de checkout
    const { preferenceId, initPoint, sandboxInitPoint } = await createCheckoutPreference(
      user.organization.id,
      user.organization.name,
      user.email,
      plan
    )

    // Salvar preferenceId na organização
    await prisma.organization.update({
      where: { id: user.organization.id },
      data: { mercadoPagoPreferenceId: preferenceId }
    })

    logger.info({
      organizationId: user.organization.id,
      preferenceId,
      userEmail: user.email,
      plan
    }, 'Checkout preference created')

    const checkoutUrl = process.env.NODE_ENV === 'production' ? initPoint : (sandboxInitPoint || initPoint)

    return NextResponse.json({ success: true, preferenceId, checkoutUrl })

  } catch (error) {
    logger.error({
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 'Error creating checkout preference')

    return NextResponse.json(
      {
        error: 'Erro ao criar preferência de checkout',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
