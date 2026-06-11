/**
 * API Route: /api/whatsapp/send-message
 *
 * 410 Gone — o envio via conexões QR (gateway whatsmeow) foi descontinuado.
 * O caminho suportado é a API Oficial Meta (WABA): /api/whatsapp/send-waba.
 */

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Conexões QR de WhatsApp foram descontinuadas. Use a API Oficial Meta (plano Business) — o envio é feito via /api/whatsapp/send-waba.',
    },
    { status: 410 }
  )
}
