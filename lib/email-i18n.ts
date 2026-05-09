import { type ReactElement } from 'react'
import { sendEmail } from '@/lib/email'
import { resolveUserLocale, t } from '@/lib/i18n-server'
import { defaultLocale, type Locale } from '@/i18n/config'
import { prisma } from '@/lib/prisma'

interface SendLocalizedEmailOptions {
  to: string | string[]
  subjectKey: string
  subjectParams?: Record<string, unknown>
  react: ReactElement
  /** Resolve locale from this userId (preferred) */
  userId?: string
  /** Explicit override — skips userId lookup */
  locale?: Locale
}

export async function sendLocalizedEmail({
  to,
  subjectKey,
  subjectParams,
  react,
  userId,
  locale: explicitLocale,
}: SendLocalizedEmailOptions) {
  let locale: Locale = explicitLocale ?? defaultLocale

  if (!explicitLocale && userId) {
    try {
      locale = await resolveUserLocale(userId)
    } catch {
      locale = defaultLocale
    }
  }

  const subject = await t(locale, 'emails', subjectKey, subjectParams)
  return sendEmail({ to, subject, react })
}

/** Resolve locale for a user by email (for callers that only have email) */
export async function resolveUserLocaleByEmail(email: string): Promise<Locale> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, locale: true },
  })
  return (user?.locale as Locale) ?? defaultLocale
}
