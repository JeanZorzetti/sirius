import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * GET /api/openapi.json
 * Serve OpenAPI specification
 */
export async function GET() {
  try {
    const openapiPath = join(process.cwd(), 'public', 'openapi.json')
    const openapiSpec = readFileSync(openapiPath, 'utf-8')
    const spec = JSON.parse(openapiSpec)

    return NextResponse.json(spec, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    })
  } catch (error) {
    console.error('Error loading OpenAPI spec:', error)
    return NextResponse.json(
      { error: 'Failed to load OpenAPI specification' },
      { status: 500 }
    )
  }
}
