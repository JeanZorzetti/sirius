import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.contact.meta' })
  const canonical = `https://siriuscrm.com.br${locale === 'en' ? '/en' : ''}/contact`
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: canonical,
    },
  }
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
