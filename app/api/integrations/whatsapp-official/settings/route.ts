import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt, encrypt } from '@/lib/encryption'
import { prismaWa } from '@/lib/prisma-wa'
import { WhatsAppOfficialClient } from '@/lib/integrations/whatsapp-official-client'
import { chaveTelefone } from '@/lib/whatsapp/telefone'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'
import { autorizarConfiguracao } from '@/lib/visibilidade'

export async function POST(request: Request) {
  try {
    const quem = await autorizarConfiguracao()
    if (quem instanceof Response) return quem

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

    // Same rule as the settings page: Business, or an account that had access before the Business-only gate
    if (user.organization.tier !== 'BUSINESS' && !user.organization.wabaGrandfathered) {
      return NextResponse.json(
        { error: 'Integração WhatsApp Oficial disponível apenas no plano Business' },
        { status: 403 }
      )
    }

    const { organizationId, enabled, phoneNumberId, accessToken, appSecret, businessAccountId, webhookVerifyToken } =
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

    // One number fits in only one connection per account (FR-008): the official number may not be an integrator's
    if (enabled && (await numeroEmConexaoPorIntegrador(user.organizationId, phoneNumberId, accessToken, user.organization.wabaAccessToken))) {
      return NextResponse.json(
        { error: 'Este número já está conectado por integrador. Desconecte-o na tela do chat antes de ativar a API oficial.' },
        { status: 409 }
      )
    }

    const updateData: any = {
      wabaEnabled: enabled,
      wabaPhoneNumberId: phoneNumberId || null,
      wabaBusinessAccountId: businessAccountId || null,
      wabaWebhookVerifyToken: webhookVerifyToken || null
    }

    try {
      if (accessToken) updateData.wabaAccessToken = encrypt(accessToken)
      // Write-only: the app secret signs Meta's webhook notices and never goes back to the screen
      if (appSecret) updateData.wabaAppSecret = encrypt(String(appSecret).trim())
    } catch (encryptError) {
      logger.error({ error: encryptError, organizationId }, 'Failed to encrypt WABA credentials')
      return await apiError(ERR.ENCRYPT_TOKEN, 500)
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: updateData
    })

    logger.info(
      { organizationId, enabled, phoneNumberId, tokenUpdated: !!accessToken, appSecretUpdated: !!appSecret },
      'WhatsApp Official settings updated'
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error({ error }, 'Error updating WhatsApp Official settings')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}

async function numeroEmConexaoPorIntegrador(
  organizationId: string,
  phoneNumberId: string,
  tokenNovo: string | undefined,
  tokenGuardado: string | null
): Promise<boolean> {
  let token = tokenNovo
  try {
    token ||= tokenGuardado ? decrypt(tokenGuardado) : undefined
  } catch {
    token = undefined
  }
  if (!token) return false
  // ponytail: Meta unreachable does not block saving; the integrator side checks again when it pairs
  const info = await new WhatsAppOfficialClient(phoneNumberId, token).getPhoneNumberInfo().catch(() => null)
  const chave = chaveTelefone(info?.display_phone_number)
  if (!chave) return false
  const conexoes = await prismaWa.whatsAppConnection.findMany({
    where: { organizationId, provider: { not: null }, apiKey: { not: null }, phoneNumber: { not: null } },
    select: { phoneNumber: true },
  })
  return conexoes.some((c) => chaveTelefone(c.phoneNumber) === chave)
}
