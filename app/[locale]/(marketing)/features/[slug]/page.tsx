import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { ALL_FEATURES, FEATURE_CATEGORIES, getFeatureBySlug } from '@/config/features-data'

// Generate static params for all feature slugs
export function generateStaticParams() {
  return ALL_FEATURES.map((f) => ({ slug: f.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const feature = getFeatureBySlug(slug)
  if (!feature) return {}

  const t = await getTranslations('marketing.features.sections')
  const name = t(`${feature.sectionKey}.${feature.featureKey}.name` as any)
  const description = t(`${feature.sectionKey}.${feature.featureKey}.description` as any)

  return {
    title: `${name} | Sirius CRM`,
    description,
    alternates: { canonical: `https://sirius.roilabs.com.br/features/${slug}` },
    openGraph: {
      title: `${name} — Sirius CRM`,
      description,
      url: `https://sirius.roilabs.com.br/features/${slug}`,
    },
  }
}

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const feature = getFeatureBySlug(slug)
  if (!feature) notFound()

  const t = await getTranslations('marketing.features')
  const tSections = await getTranslations('marketing.features.sections')

  const name = tSections(`${feature.sectionKey}.${feature.featureKey}.name` as any)
  const description = tSections(`${feature.sectionKey}.${feature.featureKey}.description` as any)
  const sectionTitle = tSections(`${feature.sectionKey}.title` as any)
  const sectionSubtitle = tSections(`${feature.sectionKey}.subtitle` as any)
  const Icon = feature.icon

  // Find sibling features in the same section
  const parentCategory = FEATURE_CATEGORIES.find((cat) =>
    cat.sections.some((sec) => sec.features.some((f) => f.slug === slug))
  )
  const parentSection = parentCategory?.sections.find((sec) =>
    sec.features.some((f) => f.slug === slug)
  )
  const siblingFeatures = parentSection?.features.filter((f) => f.slug !== slug) ?? []

  // Find next/prev feature for navigation
  const currentIndex = ALL_FEATURES.findIndex((f) => f.slug === slug)
  const prevFeature = currentIndex > 0 ? ALL_FEATURES[currentIndex - 1] : null
  const nextFeature = currentIndex < ALL_FEATURES.length - 1 ? ALL_FEATURES[currentIndex + 1] : null

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sirius.roilabs.com.br' },
      { '@type': 'ListItem', position: 2, name: 'Funcionalidades', item: 'https://sirius.roilabs.com.br/features' },
      { '@type': 'ListItem', position: 3, name, item: `https://sirius.roilabs.com.br/features/${slug}` },
    ],
  }

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="bg-background">
        {/* Hero */}
        <div className="py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
              <Link href="/features" className="hover:text-foreground transition-colors">
                Funcionalidades
              </Link>
              <span>/</span>
              <span className="text-foreground">{sectionTitle}</span>
            </nav>

            <div className="flex items-start gap-5 mb-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-8 w-8" />
              </div>
              <div>
                <Badge variant="outline" className="mb-3 text-primary border-primary/30">
                  {sectionTitle}
                </Badge>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{name}</h1>
              </div>
            </div>

            <p className="text-lg leading-relaxed text-muted-foreground max-w-3xl mt-6">
              {description}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg">
                <Link href="/register">
                  Testar Grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">Ver Planos</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Section context */}
        <div className="bg-muted/30 py-16">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <h2 className="text-xl font-semibold mb-2">{sectionTitle}</h2>
            <p className="text-muted-foreground mb-8">{sectionSubtitle}</p>

            {siblingFeatures.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {siblingFeatures.map((sibling) => {
                  const SibIcon = sibling.icon
                  return (
                    <Link key={sibling.slug} href={`/features/${sibling.slug}`}>
                      <Card className="group hover:border-primary/30 transition-colors h-full">
                        <CardContent className="pt-5 pb-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              <SibIcon className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-sm">
                              {tSections(`${sibling.sectionKey}.${sibling.featureKey}.name` as any)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Prev / Next navigation */}
        <div className="py-12">
          <div className="mx-auto max-w-4xl px-6 lg:px-8 flex justify-between items-center">
            {prevFeature ? (
              <Link
                href={`/features/${prevFeature.slug}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {tSections(`${prevFeature.sectionKey}.${prevFeature.featureKey}.name` as any)}
              </Link>
            ) : (
              <div />
            )}
            {nextFeature ? (
              <Link
                href={`/features/${nextFeature.slug}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {tSections(`${nextFeature.sectionKey}.${nextFeature.featureKey}.name` as any)}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="py-20 border-t">
          <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t('cta.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{t('cta.subtitle')}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/register">
                  {t('cta.ctaPrimary')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">{t('cta.ctaSecondary')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
