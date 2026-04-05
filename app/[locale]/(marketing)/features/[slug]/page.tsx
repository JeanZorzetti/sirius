import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Lightbulb,
  Zap,
  Info,
} from 'lucide-react'
import { ALL_FEATURES, FEATURE_CATEGORIES, getFeatureBySlug } from '@/config/features-data'

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

// Helper to safely try a translation key — returns null if missing
function tryTranslation(t: any, key: string): string | null {
  try {
    const val = t(key)
    // next-intl returns the key itself (or key path) when missing
    if (typeof val === 'string' && !val.startsWith(key.split('.')[0])) return val
    return val
  } catch {
    return null
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

  // Try to load detail content (only CRM Core features have it for now)
  const detailPrefix = `${feature.sectionKey}.${feature.featureKey}.detail`
  const headline = tryTranslation(tSections, `${detailPrefix}.headline` as any)
  const planInfo = tryTranslation(tSections, `${detailPrefix}.planInfo` as any)
  const howItWorksTitle = tryTranslation(tSections, `${detailPrefix}.howItWorks.title` as any)

  // Load benefits (numbered keys)
  const benefits: string[] = []
  for (let i = 1; i <= 10; i++) {
    const b = tryTranslation(tSections, `${detailPrefix}.benefits.${i}` as any)
    if (b) benefits.push(b)
    else break
  }

  // Load use cases
  const useCases: string[] = []
  for (let i = 1; i <= 10; i++) {
    const u = tryTranslation(tSections, `${detailPrefix}.useCases.${i}` as any)
    if (u) useCases.push(u)
    else break
  }

  // Load how-it-works steps
  const howSteps: string[] = []
  for (let i = 1; i <= 10; i++) {
    const s = tryTranslation(tSections, `${detailPrefix}.howItWorks.${i}` as any)
    if (s) howSteps.push(s)
    else break
  }

  const hasDetail = benefits.length > 0

  // Find sibling features
  const parentCategory = FEATURE_CATEGORIES.find((cat) =>
    cat.sections.some((sec) => sec.features.some((f) => f.slug === slug))
  )
  const parentSection = parentCategory?.sections.find((sec) =>
    sec.features.some((f) => f.slug === slug)
  )
  const siblingFeatures = parentSection?.features.filter((f) => f.slug !== slug) ?? []

  // Prev/next navigation
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
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <div className="py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
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

            {headline && (
              <p className="text-xl font-medium text-foreground mt-4">{headline}</p>
            )}

            <p className="text-lg leading-relaxed text-muted-foreground max-w-3xl mt-4">
              {description}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg">
                <Link href="/register">
                  Testar Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">Ver Planos</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* ── Benefits ──────────────────────────────────────────────── */}
        {benefits.length > 0 && (
          <div className="bg-muted/30 py-16">
            <div className="mx-auto max-w-4xl px-6 lg:px-8">
              <h2 className="text-2xl font-bold tracking-tight mb-8">
                O que voce ganha
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map((benefit, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border bg-background p-4"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-sm leading-relaxed">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── How It Works ──────────────────────────────────────────── */}
        {howSteps.length > 0 && (
          <div className="py-16">
            <div className="mx-auto max-w-4xl px-6 lg:px-8">
              <h2 className="text-2xl font-bold tracking-tight mb-8">
                {howItWorksTitle || 'Como funciona'}
              </h2>
              <div className="space-y-6">
                {howSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {i + 1}
                    </div>
                    <p className="text-base leading-relaxed pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Use Cases ─────────────────────────────────────────────── */}
        {useCases.length > 0 && (
          <div className="bg-muted/30 py-16">
            <div className="mx-auto max-w-4xl px-6 lg:px-8">
              <h2 className="text-2xl font-bold tracking-tight mb-8">
                Casos de uso
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {useCases.map((useCase, i) => (
                  <Card key={i} className="border-primary/10">
                    <CardContent className="pt-5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 mb-3">
                        <Lightbulb className="h-5 w-5" />
                      </div>
                      <p className="text-sm leading-relaxed">{useCase}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Plan Info ─────────────────────────────────────────────── */}
        {planInfo && (
          <div className="py-10">
            <div className="mx-auto max-w-4xl px-6 lg:px-8">
              <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-500/20 dark:bg-blue-500/5 p-5">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-blue-900 dark:text-blue-300 mb-1">Limites por plano</p>
                  <p className="text-sm text-blue-700 dark:text-blue-400/80">{planInfo}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Sibling Features ──────────────────────────────────────── */}
        {siblingFeatures.length > 0 && (
          <div className={`${hasDetail ? '' : 'bg-muted/30'} py-16`}>
            <div className="mx-auto max-w-4xl px-6 lg:px-8">
              <h2 className="text-xl font-semibold mb-2">{sectionTitle}</h2>
              <p className="text-muted-foreground mb-8">{sectionSubtitle}</p>
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
            </div>
          </div>
        )}

        {/* ── Prev / Next ───────────────────────────────────────────── */}
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

        {/* ── Final CTA ─────────────────────────────────────────────── */}
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
