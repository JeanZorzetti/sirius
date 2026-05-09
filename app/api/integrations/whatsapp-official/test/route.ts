import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WhatsAppOfficialClient } from '@/lib/integrations/whatsapp-official-client'
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
      select: { organizationId: true, organization: { select: { tier: true } } }
    })

    if (!user?.organization) {
      return await apiError(ERR.USER_NOT_FOUND, 404)
    }

    if (!['PRO', 'BUSINESS'].includes(user.organization.tier)) {
      return NextResponse.json({ error: 'Plano PRO necessário' }, { status: 403 })
    }

    const { phoneNumberId, accessToken } = await request.json()

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { error: 'Phone Number ID e Access Token são obrigatórios para testar' },
        { status: 400 }
      )
    }

    const client = new WhatsAppOfficialClient(phoneNumberId, accessToken)
    const result = await client.testConnection()

    if (result.success) {
      return NextResponse.json({
        success: true,
        info: result.info
      })
    }

    return NextResponse.json(
      { success: false, error: result.error || 'Falha na conexão com a API Meta' },
      { status: 400 }
    )
  } catch (error: any) {
    logger.error({ error }, 'Error testing WhatsApp Official connection')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
