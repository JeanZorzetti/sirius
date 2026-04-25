import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Users, Target, Lightbulb, TrendingUp } from 'lucide-react'
import type { Metadata } from 'next'

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.about.meta' })
  const baseUrl = 'https://siriuscrm.com.br'

  return {
    title: t('title'),
    description: t('description'),
    keywords: ['sirius crm', 'roi labs', 'crm brasil', 'sobre', 'empresa'],
    alternates: { canonical: `${baseUrl}/about` },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: `${baseUrl}/about`,
      images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630, alt: t('ogImageAlt') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('twitterTitle'),
      description: t('twitterDescription'),
    },
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.about' })

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Sirius CRM",
    "url": "https://siriuscrm.com.br",
    "logo": "https://siriuscrm.com.br/logo.png",
    "description": t('schema.orgDescription'),
    "founder": { "@type": "Organization", "name": "ROI Labs" },
    "address": { "@type": "PostalAddress", "addressCountry": "BR" },
    "sameAs": ["https://roilabs.com.br"]
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": t('schema.breadcrumbHome'), "item": "https://siriuscrm.com.br" },
      { "@type": "ListItem", "position": 2, "name": t('schema.breadcrumbAbout'), "item": "https://siriuscrm.com.br/about" }
    ]
  }

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="bg-background">
        {/* Hero Section */}
        <section className="py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-primary">{t('hero.badge')}</h2>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t('hero.title')}
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                {t('hero.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 bg-muted/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 items-center">
              <div className="lg:pr-8">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t('mission.title')}</h2>
                <p className="mt-6 text-lg leading-8 text-muted-foreground">
                  {t('mission.paragraph1')}
                </p>
                <p className="mt-4 text-lg leading-8 text-muted-foreground">
                  {t('mission.paragraph2')}
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full h-64 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
                  <Target className="h-32 w-32 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground text-center sm:text-4xl mb-12">
              {t('values.title')}
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center p-6 border rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary mb-4">
                  <Lightbulb className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('values.simplicity.title')}</h3>
                <p className="text-muted-foreground">{t('values.simplicity.description')}</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 border rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary mb-4">
                  <Users className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('values.customer.title')}</h3>
                <p className="text-muted-foreground">{t('values.customer.description')}</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 border rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary mb-4">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('values.growth.title')}</h3>
                <p className="text-muted-foreground">{t('values.growth.description')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ROI Labs Section */}
        <section className="py-16 bg-muted/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-6">
                {t('roiLabs.title')}
              </h2>
              <p className="text-lg leading-8 text-muted-foreground mb-8">
                {t('roiLabs.description')}
              </p>
              <Button asChild variant="outline" size="lg">
                <Link href="https://roilabs.com.br" target="_blank" rel="noopener noreferrer">
                  {t('roiLabs.button')}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t('cta.title')}
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                {t('cta.subtitle')}
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button asChild size="lg">
                  <Link href="/register">{t('cta.button1')}</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/features">{t('cta.button2')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
