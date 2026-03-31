import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.pricing.meta' })
  const baseUrl = 'https://sirius.roilabs.com.br'
  const canonicalUrl = locale === 'en' ? `${baseUrl}/en/pricing` : `${baseUrl}/pricing`

  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: canonicalUrl,
      images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
    },
  }
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
