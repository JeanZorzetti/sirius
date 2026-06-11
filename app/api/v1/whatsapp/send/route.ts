/**
 * API v1: POST /api/v1/whatsapp/send
 *
 * 410 Gone — o envio via conexões QR (gateway whatsmeow) foi descontinuado.
 * Mensagens de WhatsApp agora são enviadas exclusivamente pela API Oficial
 * Meta (WABA), disponível no plano Business.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'

export async function POST(request: NextRequest) {
  return withApiMiddleware(request, async (_req, context) => {
    return NextResponse.json(
      apiResponse(context.requestId, undefined, {
        code: 'GONE',
        message:
          'QR-code WhatsApp connections were discontinued. WhatsApp messaging is now available exclusively through the official Meta API (Business plan).',
      }),
      { status: 410 }
    )
  })
}
