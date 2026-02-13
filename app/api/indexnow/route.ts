import { NextRequest, NextResponse } from 'next/server'
import { submitUrlToIndexNow, submitUrlsToIndexNow } from '@/lib/indexnow'
import { publicRateLimit } from '@/lib/ratelimit'

/**
 * POST /api/indexnow
 * Submit URL(s) to IndexNow for instant indexing
 *
 * Body:
 * - { url: string } - single URL
 * - { urls: string[] } - multiple URLs (max 10,000)
 *
 * Example:
 * POST /api/indexnow
 * { "url": "/blog/spin-selling-guia-completo" }
 *
 * Response:
 * { "success": true, "url": "...", "statusCode": 200 }
 */
export async function POST(request: NextRequest) {
  const blocked = await publicRateLimit(request)
  if (blocked) return blocked

  try {
    const body = await request.json()

    // Single URL submission
    if (body.url && typeof body.url === 'string') {
      const result = await submitUrlToIndexNow(body.url)
      return NextResponse.json(result, { status: result.success ? 200 : 500 })
    }

    // Multiple URLs submission
    if (body.urls && Array.isArray(body.urls)) {
      const result = await submitUrlsToIndexNow(body.urls)
      return NextResponse.json(result, { status: result.success ? 200 : 500 })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request. Provide "url" or "urls".' },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/indexnow
 * Check IndexNow integration status
 */
export async function GET() {
  const { verifyIndexNowKey, getIndexNowKey, getIndexNowKeyLocation } = await import(
    '@/lib/indexnow'
  )

  const isValid = await verifyIndexNowKey()

  return NextResponse.json({
    enabled: true,
    keyValid: isValid,
    key: getIndexNowKey(),
    keyLocation: getIndexNowKeyLocation(),
    endpoint: 'https://api.indexnow.org/indexnow',
    supportedEngines: ['Bing', 'Yandex', 'Seznam.cz', 'Naver'],
    documentation: 'https://www.indexnow.org/documentation',
  })
}
