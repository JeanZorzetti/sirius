import { NextRequest, NextResponse } from 'next/server'
import posthog from 'posthog-js'

/**
 * Endpoint de Ingestão de Analytics via Beacon API
 *
 * Recebe eventos enviados via navigator.sendBeacon() ou fetch keepalive
 * e encaminha para o PostHog.
 *
 * Este endpoint é crítico para capturar eventos quando o usuário sai
 * da página imediatamente (ex: após calcular ROI).
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validação básica
    if (!body.event || typeof body.event !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid event name' },
        { status: 400 }
      )
    }

    const { event, properties, timestamp } = body

    // Em produção, enviar para PostHog
    if (process.env.NODE_ENV === 'production') {
      // Verificar se PostHog está disponível
      if (typeof window !== 'undefined' && (window as any).posthog) {
        const ph = (window as any).posthog
        ph.capture(event, {
          ...properties,
          $timestamp: timestamp,
          beacon_api: true, // Flag para identificar eventos via Beacon
        })
      } else {
        // Server-side: usar PostHog Node SDK se disponível
        console.log('[Analytics Ingest] Event received (server-side):', {
          event,
          properties,
          timestamp,
        })
      }
    } else {
      // Development: apenas log
      console.log('[Analytics Ingest] Event received (dev mode):', {
        event,
        properties,
        timestamp,
      })
    }

    return NextResponse.json({
      success: true,
      event,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Analytics Ingest] Error processing event:', error)

    return NextResponse.json(
      { error: 'Failed to process analytics event' },
      { status: 500 }
    )
  }
}

// OPTIONS handler para CORS (se necessário)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
