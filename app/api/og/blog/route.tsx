import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

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
          {/* Background gradient indigo → purple */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, #312e81 0%, #4c1d95 50%, #581c87 100%)',
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

          {/* Glow effects */}
          <div
            style={{
              position: 'absolute',
              top: '-120px',
              right: '-80px',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-100px',
              left: '-60px',
              width: '350px',
              height: '350px',
              background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
              borderRadius: '50%',
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
              {/* Logo area */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                {/* Logo circle placeholder */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  S
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <span
                    style={{
                      fontSize: '22px',
                      fontWeight: 'bold',
                      color: 'white',
                      letterSpacing: '0.05em',
                    }}
                  >
                    SIRIUS
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.6)',
                      letterSpacing: '0.15em',
                    }}
                  >
                    CRM
                  </span>
                </div>
              </div>

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
                  background: 'linear-gradient(90deg, #818cf8, #c084fc)',
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
                sirius.roilabs.com.br
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
