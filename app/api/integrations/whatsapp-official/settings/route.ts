import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user?.organization) {
      return await apiError(ERR.USER_NOT_FOUND, 404)
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
      return await apiError(ERR.FORBIDDEN, 403)
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
        return await apiError(ERR.ENCRYPT_TOKEN, 500)
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
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
