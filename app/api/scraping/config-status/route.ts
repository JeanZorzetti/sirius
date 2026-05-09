import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getProvidersStatus } from '@/lib/scraping/providers'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session?.user) {
    return await apiError(ERR.UNAUTHORIZED, 401)
  }

  const providers = getProvidersStatus()
  const hasPremiumProvider = providers.some(
    p => p.configured && (p.name === 'SIRIUS_SCRAPER' || p.name === 'GOOGLE_PLACES')
  )

  return NextResponse.json({
    configured: hasPremiumProvider,
    providers: providers.map(p => ({
      name: p.name,
      configured: p.configured,
    })),
  })
}
