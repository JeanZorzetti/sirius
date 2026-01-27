import { NextRequest, NextResponse } from 'next/server'
import { captureLeadFromCalculator } from '@/lib/email-marketing'

export async function POST(request: NextRequest) {
  try {
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
    console.error('Error capturing calculator lead:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
}
