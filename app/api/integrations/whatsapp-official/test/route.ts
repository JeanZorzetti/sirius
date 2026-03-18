import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WhatsAppOfficialClient } from '@/lib/integrations/whatsapp-official-client'
import logger from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true, organization: { select: { tier: true } } }
    })

    if (!user?.organization) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
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
    return NextResponse.json({ error: 'Erro ao testar conexão' }, { status: 500 })
  }
}
