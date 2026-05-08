import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { buildLocaleAlternates } from '@/lib/seo/canonical'

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.contact.meta' })
  const alternates = buildLocaleAlternates(locale, '/contact')
  return {
    title: t('title'),
    description: t('description'),
    alternates,
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: alternates.canonical,
    },
  }
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
