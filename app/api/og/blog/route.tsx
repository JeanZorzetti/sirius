import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { WORDMARK_VIEWBOX, WORDMARK_LETRAS, WORDMARK_PINGO } from '@/components/brand/wordmark'

const PINGO = '#d02d23' // --marca-pingo; next/og has no CSS variables

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const title = searchParams.get('title') || 'Sirius CRM Blog'
    const category = searchParams.get('category') || 'Blog'

    // Auto-adjust font size based on title length
    const titleFontSize = title.length > 80 ? 36 : title.length > 50 ? 42 : 48

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Brand ink (grafite), same as /og-image.png */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: '#141b24',
            }}
          />

          {/* Subtle grid pattern overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.08,
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              padding: '60px',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Top row: Logo + Category badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <svg width={148} height={60} viewBox={WORDMARK_VIEWBOX}>
                <path d={WORDMARK_LETRAS} fill="#f5f7f9" />
                <path d={WORDMARK_PINGO} fill={PINGO} />
              </svg>

              {/* Category badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                {category}
              </div>
            </div>

            {/* Title — centered area */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  fontSize: titleFontSize,
                  fontWeight: 'bold',
                  color: 'white',
                  lineHeight: 1.2,
                  maxWidth: '900px',
                }}
              >
                {title}
              </div>

              {/* Accent line */}
              <div
                style={{
                  width: '80px',
                  height: '4px',
                  borderRadius: '2px',
                  background: PINGO,
                }}
              />
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: '18px',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                siriuscrm.com.br
              </span>
              <span
                style={{
                  fontSize: '16px',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                Blog
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error generating blog OG image:', message)
    return new Response(`Failed to generate image: ${message}`, {
      status: 500,
    })
  }
}
