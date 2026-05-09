import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'
import { captureLeadFromCalculator } from '@/lib/email-marketing'
import { leadCaptureRateLimit } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  try {
    const blocked = await leadCaptureRateLimit(request)
    if (blocked) return blocked

    const body = await request.json()

    const { email, nome, empresa, volumeLeads, ticketMedio, perdaMensal, origem } = body

    // Validações básicas
    if (!email || !volumeLeads || !ticketMedio || !perdaMensal || !origem) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Capturar lead e enviar emails
    await captureLeadFromCalculator({
      email,
      nome,
      empresa,
      volumeLeads,
      ticketMedio,
      perdaMensal,
      origem
    })

    return NextResponse.json({
      success: true,
      message: 'Lead capturado com sucesso'
    })
  } catch (error) {
    logger.error({ err: error }, 'Error capturing calculator lead')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
