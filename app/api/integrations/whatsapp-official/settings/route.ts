import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import logger from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user?.organization) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (!['PRO', 'BUSINESS'].includes(user.organization.tier)) {
      return NextResponse.json(
        { error: 'Integração WhatsApp Oficial disponível apenas no plano PRO' },
        { status: 403 }
      )
    }

    const { organizationId, enabled, phoneNumberId, accessToken, businessAccountId, webhookVerifyToken } =
      await request.json()

    if (organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    if (enabled) {
      const existingToken = user.organization.wabaAccessToken

      if (!phoneNumberId) {
        return NextResponse.json(
          { error: 'Phone Number ID é obrigatório quando WhatsApp Oficial está ativado' },
          { status: 400 }
        )
      }

      if (!existingToken && !accessToken) {
        return NextResponse.json(
          { error: 'Access Token é obrigatório ao configurar a integração pela primeira vez' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      wabaEnabled: enabled,
      wabaPhoneNumberId: phoneNumberId || null,
      wabaBusinessAccountId: businessAccountId || null,
      wabaWebhookVerifyToken: webhookVerifyToken || null
    }

    if (accessToken) {
      try {
        updateData.wabaAccessToken = encrypt(accessToken)
      } catch (encryptError) {
        logger.error({ error: encryptError, organizationId }, 'Failed to encrypt WABA Access Token')
        return NextResponse.json(
          { error: 'Erro ao criptografar Access Token. Verifique INTEGRATION_ENCRYPTION_KEY.' },
          { status: 500 }
        )
      }
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: updateData
    })

    logger.info(
      { organizationId, enabled, phoneNumberId, tokenUpdated: !!accessToken },
      'WhatsApp Official settings updated'
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error({ error }, 'Error updating WhatsApp Official settings')
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
