/**
 * GET  /api/integrations/omie/settings — retorna configuração atual
 * PATCH /api/integrations/omie/settings — salva app_key e app_secret
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listarClientes } from '@/lib/integrations/omie'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function GET() {
  const session = await getSession()
  if (!session?.user?.email) return await apiError(ERR.UNAUTHORIZED, 401)

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organization: { select: { omieAppKey: true, omieAppSecret: true, omieEnabled: true } } },
  })

  return NextResponse.json({
    omieAppKey:    user?.organization?.omieAppKey    ? '••••••••' : '',
    omieAppSecret: user?.organization?.omieAppSecret ? '••••••••' : '',
    omieEnabled:   user?.organization?.omieEnabled   ?? false,
    configured:    !!(user?.organization?.omieAppKey && user.organization.omieAppSecret),
  })
}

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) return await apiError(ERR.UNAUTHORIZED, 401, { req: request })

  const { omieAppKey, omieAppSecret, omieEnabled } = await request.json()

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true },
  })
  if (!user?.organizationId) return await apiError(ERR.ORG_NOT_FOUND, 404, { req: request })

  const data: Record<string, unknown> = {}
  if (omieAppKey    !== undefined && !omieAppKey.startsWith('•'))    data.omieAppKey    = omieAppKey
  if (omieAppSecret !== undefined && !omieAppSecret.startsWith('•')) data.omieAppSecret = omieAppSecret
  if (omieEnabled   !== undefined) data.omieEnabled = omieEnabled

  // Valida credenciais se foram fornecidas
  if (data.omieAppKey && data.omieAppSecret) {
    try {
      await listarClientes(
        { appKey: data.omieAppKey as string, appSecret: data.omieAppSecret as string },
        1, 1
      )
      data.omieEnabled = true
    } catch {
      return NextResponse.json({ error: 'Credenciais inválidas — verifique App Key e App Secret' }, { status: 400 })
    }
  }

  await prisma.organization.update({ where: { id: user.organizationId }, data })
  return NextResponse.json({ success: true })
}
