import { Metadata } from 'next'
import Script from 'next/script'
import { DownloadInstructions } from '@/components/marketing/download-instructions'
import { getTranslations } from 'next-intl/server'
import { buildLocaleAlternates, DEFAULT_OG_IMAGES } from '@/lib/seo/canonical'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.download.meta' })
  const alternates = buildLocaleAlternates(locale, '/download', '/download')
  return {
    title: t('title'),
    description: t('description'),
    alternates,
    openGraph: {
      images: DEFAULT_OG_IMAGES,
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: alternates.canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
    },
  }
}

export default function DownloadPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://siriuscrm.com.br"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Download",
        "item": "https://siriuscrm.com.br/download"
      }
    ]
  }

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    "name": "Sirius CRM",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "iOS, Android, Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "BRL"
    },
    "description": "Progressive Web App para gestão de vendas com pipeline Kanban, WhatsApp integrado e suporte offline."
  }

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="software-app-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
    <div className="min-h-screen">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
      </div>

      <div className="relative z-10">
        <DownloadInstructions />
      </div>
    </div>
    </>
  )
}
