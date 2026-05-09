import { getRequestConfig } from 'next-intl/server'
import { createTranslator } from 'next-intl'
import { locales, defaultLocale, type Locale } from '@/i18n/config'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { type NextRequest } from 'next/server'

// In-memory cache for User.locale (TTL: 60s)
const localeCache = new Map<string, { locale: Locale; expiresAt: number }>()

export async function resolveUserLocale(userId: string): Promise<Locale> {
  const now = Date.now()
  const cached = localeCache.get(userId)
  if (cached && cached.expiresAt > now) return cached.locale

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { locale: true },
  })

  const locale = (user?.locale as Locale) ?? defaultLocale
  localeCache.set(userId, { locale, expiresAt: now + 60_000 })
  return locale
}

export function invalidateLocaleCache(userId: string) {
  localeCache.delete(userId)
}

export async function resolveRequestLocale(req?: NextRequest): Promise<Locale> {
  // 1. Authenticated user's saved locale
  const session = await getSession()
  if (session?.user?.id) {
    try {
      return await resolveUserLocale(session.user.id)
    } catch {
      // fall through
    }
  }

  if (req) {
    // 2. URL prefix
    const pathname = req.nextUrl?.pathname ?? ''
    if (pathname.startsWith('/en') || pathname.startsWith('/en/')) return 'en'

    // 3. Accept-Language header
    const acceptLang = req.headers.get('accept-language') ?? ''
    if (acceptLang.toLowerCase().includes('en')) return 'en'
  }

  return defaultLocale
}

// Lazy-loaded message cache per namespace+locale
const messageCache = new Map<string, unknown>()

async function loadMessages(locale: Locale, namespace: string): Promise<Record<string, unknown>> {
  const key = `${locale}:${namespace}`
  if (messageCache.has(key)) return messageCache.get(key) as Record<string, unknown>

  const mod = await import(`../messages/${locale}/${namespace}.json`).catch(() => null)
  const messages = mod?.default ?? {}
  messageCache.set(key, messages)
  return messages as Record<string, unknown>
}

export async function t(
  locale: Locale,
  namespace: string,
  key: string,
  params?: Record<string, unknown>
): Promise<string> {
  const messages = await loadMessages(locale, namespace)

  const translator = createTranslator({
    locale,
    messages: { [namespace]: messages },
    namespace,
  })

  try {
    return translator(key as never, params as never)
  } catch {
    // Fallback to pt-BR if key missing in en
    if (locale !== defaultLocale) {
      const fallbackMessages = await loadMessages(defaultLocale, namespace)
      const fallbackTranslator = createTranslator({
        locale: defaultLocale,
        messages: { [namespace]: fallbackMessages },
        namespace,
      })
      try {
        return fallbackTranslator(key as never, params as never)
      } catch {
        return key
      }
    }
    return key
  }
}
