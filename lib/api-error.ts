import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { type Locale } from '@/i18n/config'
import { resolveRequestLocale, t } from '@/lib/i18n-server'

export async function apiError(
  key: string,
  status: number,
  opts?: { locale?: Locale; params?: Record<string, unknown>; req?: NextRequest }
): Promise<NextResponse> {
  const locale = opts?.locale ?? (opts?.req ? await resolveRequestLocale(opts.req) : await resolveRequestLocale())
  const message = await t(locale, 'api', key, opts?.params)
  return NextResponse.json({ error: message }, { status })
}
