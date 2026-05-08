import Link from 'next/link'
import Script from 'next/script'
import { Badge } from '@/components/ui/badge'
import { GitBranch, Sparkles, Bug, Zap, Shield, Users, Smartphone, Bell } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildLocaleAlternates } from '@/lib/seo/canonical'

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.changelog.meta' })
  const alternates = buildLocaleAlternates(locale, '/changelog')
  return {
    title: t('title'),
    description: t('description'),
    alternates,
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: alternates.canonical,
      images: [{ url: 'https://siriuscrm.com.br/og-image.png', width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title: t('ogTitle'), description: t('ogDescription') },
  }
}

const CHANGELOG = [
  { version: 'v1.4.0', versionKey: 'v140', date: '2026-01-09', type: 'major', items: [{ type: 'feature', icon: Smartphone }, { type: 'feature', icon: Bell }, { type: 'feature', icon: Zap }, { type: 'feature', icon: Bell }, { type: 'feature', icon: Sparkles }] },
  { version: 'v1.3.0', versionKey: 'v130', date: '2026-01-05', type: 'major', items: [{ type: 'feature', icon: Sparkles }, { type: 'feature', icon: Users }] },
  { version: 'v1.2.0', versionKey: 'v120', date: '2026-01-02', type: 'major', items: [{ type: 'feature', icon: Sparkles }, { type: 'feature', icon: Sparkles }, { type: 'improvement', icon: Zap }] },
  { version: 'v1.1.0', versionKey: 'v110', date: '2026-01-01', type: 'major', items: [{ type: 'feature', icon: Sparkles }, { type: 'feature', icon: Sparkles }, { type: 'feature', icon: Sparkles }, { type: 'improvement', icon: Shield }] },
  { version: 'v1.0.0', versionKey: 'v100', date: '2025-12-29', type: 'major', items: [{ type: 'feature', icon: Sparkles }, { type: 'feature', icon: GitBranch }, { type: 'feature', icon: Users }, { type: 'feature', icon: Zap }, { type: 'feature', icon: Shield }, { type: 'feature', icon: Shield }] },
  { version: 'v0.9.0', versionKey: 'v090', date: '2025-12-20', type: 'beta', items: [{ type: 'feature', icon: Sparkles }, { type: 'feature', icon: Zap }, { type: 'improvement', icon: Shield }, { type: 'improvement', icon: Zap }] },
]

const typeColors = {
  major: 'bg-primary text-primary-foreground',
  beta: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
}

const itemTypeColors: Record<string, string> = {
  feature: 'bg-green-500/10 text-green-700 dark:text-green-400',
  improvement: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  fix: 'bg-red-500/10 text-red-700 dark:text-red-400',
  security: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
}

export default async function ChangelogPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.changelog' })

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://siriuscrm.com.br" },
      { "@type": "ListItem", "position": 2, "name": "Changelog", "item": "https://siriuscrm.com.br/changelog" },
    ]
  }

  const softwareVersionSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Sirius CRM",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, iOS, Android",
    "softwareVersion": "1.4.0",
    "datePublished": "2026-01-09",
    "releaseNotes": "https://siriuscrm.com.br/changelog",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "BRL" },
    "provider": { "@type": "Organization", "name": "ROI Labs", "url": "https://roilabs.com.br", "telephone": "+55-62-98344-3919", "email": "roilabs.ia@gmail.com" }
  }

  return (
    <>
      <Script id="breadcrumb-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Script id="software-version-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareVersionSchema) }} />

      <div className="bg-background">
        {/* Hero */}
        <section className="py-20 sm:py-32">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <GitBranch className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Changelog</h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">{t('hero.subtitle')}</p>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="space-y-12">
              {CHANGELOG.map((release, idx) => {
                const items = t.raw(`releases.${release.versionKey}.items`) as Array<{ title: string; description: string }>
                return (
                  <div key={release.version} className="relative">
                    {idx !== CHANGELOG.length - 1 && (
                      <div className="absolute left-8 top-16 -bottom-12 w-px bg-border" />
                    )}
                    <div className="relative flex gap-6">
                      <div className="flex-shrink-0">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-8 ring-background">
                          <GitBranch className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-center gap-3 mb-4">
                          <h2 className="text-2xl font-bold text-foreground">{release.version}</h2>
                          <Badge className={typeColors[release.type as keyof typeof typeColors]}>
                            {t(`releaseTypes.${release.type}`)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(release.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="space-y-4">
                          {release.items.map((item, i) => {
                            const Icon = item.icon
                            const itemData = items[i]
                            return (
                              <div key={i} className="flex gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                                <div className="flex-shrink-0">
                                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${itemTypeColors[item.type]}`}>
                                    <Icon className="h-5 w-5" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-foreground">{itemData?.title}</h3>
                                    <Badge variant="outline" className="text-xs">
                                      {t(`itemTypes.${item.type}`)}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{itemData?.description}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Subscribe CTA */}
        <section className="py-16 bg-muted/50">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="text-center bg-background border rounded-2xl p-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">{t('subscribe.title')}</h2>
              <p className="text-muted-foreground mb-6">{t('subscribe.subtitle')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
                  {t('subscribe.cta')}
                </Link>
                <Link href="/blog" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-semibold hover:bg-accent hover:text-accent-foreground transition-colors">
                  {t('subscribe.blog')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap Teaser */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-6">{t('roadmap.title')}</h2>
              <p className="text-lg text-muted-foreground mb-8">{t('roadmap.subtitle')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(t.raw('roadmap.items') as Array<{ title: string; description: string }>).map((item, i) => (
                  <div key={i} className="p-6 border rounded-lg text-left">
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
