/**
 * GET /api/whatsapp/connections/whatsmeow/[id]/status
 * Retorna status da instância diretamente do gateway.
 * Usado para polling pós-QR scan.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { whatsmeowClient } from '@/lib/integrations/whatsmeow-client'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user) {
    return await apiError(ERR.UNAUTHORIZED, 401)
  }

  const { id } = await params

  try {
    const status = await whatsmeowClient.getStatus(id)
    return NextResponse.json(status)
  } catch {
    return NextResponse.json({ status: 'unknown', connected: false })
  }
}
