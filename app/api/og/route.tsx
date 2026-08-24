import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { formatCurrency } from '@/lib/format'

export const runtime = 'edge'

/**
 * Geração Dinâmica de Open Graph Images com Satori
 *
 * Suporta parâmetros:
 * - roi: Valor monetário (ex: 47000)
 * - title: Título do artigo
 * - scenario: Cenário (pessimista/realista/otimista)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parâmetros com defaults
    const roi = searchParams.get('roi') || '94282'
    const title = searchParams.get('title') || 'O Custo Oculto da Inação no CRM'
    const scenario = searchParams.get('scenario') || 'realista'

    const roiFormatted = formatCurrency(parseFloat(roi), { minimumFractionDigits: 0, maximumFractionDigits: 0 })

    // Cores por cenário
    const scenarioColors: Record<string, { bg: string; accent: string; label: string }> = {
      pessimista: { bg: '#FEF3C7', accent: '#F59E0B', label: 'Conservador' },
      realista: { bg: '#DBEAFE', accent: '#3B82F6', label: 'Mediana de Mercado' },
      otimista: { bg: '#D1FAE5', accent: '#10B981', label: 'Top Performers' },
    }

    const colors = scenarioColors[scenario] || scenarioColors.realista

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.bg,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Content Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px',
              zIndex: 10,
            }}
          >
            {/* Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: colors.accent,
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: 20,
                fontWeight: 'bold',
                marginBottom: '24px',
              }}
            >
              {colors.label}
            </div>

            {/* Title */}
            <div
              style={{
                display: 'flex',
                fontSize: 48,
                fontWeight: 'bold',
                textAlign: 'center',
                color: '#18181B',
                marginBottom: '40px',
                maxWidth: '900px',
              }}
            >
              {title}
            </div>

            {/* ROI Value with Arrow */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'white',
                padding: '48px 64px',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              }}
            >
              {/* Arrow SVG Inline (conforme relatório) */}
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#DC2626" style={{ marginBottom: '16px' }}>
                <path d="M12 5v14M19 12l-7 7-7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              {/* ROI Amount */}
              <div
                style={{
                  display: 'flex',
                  fontSize: 80,
                  fontWeight: 'bold',
                  color: '#DC2626',
                  marginBottom: '8px',
                }}
              >
                {roiFormatted}
              </div>

              {/* Label */}
              <div
                style={{
                  display: 'flex',
                  fontSize: 28,
                  color: '#52525B',
                  fontWeight: '600',
                }}
              >
                Perda Mensal Estimada
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '48px',
                fontSize: 24,
                color: '#71717A',
              }}
            >
              <div style={{ display: 'flex', fontWeight: 'bold', color: colors.accent, marginRight: '12px' }}>
                Sirius CRM
              </div>
              <div style={{ display: 'flex' }}>
                • Calculadora de ROI
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (error: any) {
    console.error('Error generating OG image:', error)
    return new Response(`Failed to generate image: ${error.message}`, {
      status: 500,
    })
  }
}
