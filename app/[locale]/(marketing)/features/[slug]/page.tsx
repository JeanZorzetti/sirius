import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { buildLocaleAlternates } from '@/lib/seo/canonical'
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
  Info,
  ChevronDown,
  User,
  Briefcase,
  Building2,
  Zap,
  HelpCircle,
} from 'lucide-react'
import { ALL_FEATURES, FEATURE_CATEGORIES, getFeatureBySlug } from '@/config/features-data'

export function generateStaticParams() {
  return ALL_FEATURES.map((f) => ({ slug: f.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const feature = getFeatureBySlug(slug)
  if (!feature) return {}

  const t = await getTranslations({ locale, namespace: 'marketing.features.sections' })
  const name = t(`${feature.sectionKey}.${feature.featureKey}.name` as any)
  const description = t(`${feature.sectionKey}.${feature.featureKey}.description` as any)
  const alternates = buildLocaleAlternates(locale, `/features/${slug}`)

  return {
    title: `${name} | Sirius CRM`,
    description,
    alternates,
    openGraph: {
      title: `${name} — Sirius CRM`,
      description,
      url: alternates.canonical,
    },
  }
}

// Safely try a translation key — returns null if missing.
// next-intl returns the raw key path when a key doesn't exist, so we detect that.
function tryT(t: any, key: string): string | null {
  try {
    const val = t(key)
    if (typeof val !== 'string') return null
    // next-intl returns the last segment or the full key when missing
    if (val === key) return null
    // Also detect when it returns just the last segment (e.g. "title" for "x.y.title")
    const lastSegment = key.split('.').pop()
    if (val === lastSegment) return null
    // Detect raw key paths like "marketing.features.sections.crm.contacts.detail.benefits.7.title"
    if (val.includes('marketing.features.sections.')) return null
    if (val.includes('.detail.')) return null
    return val
  } catch {
    return null
  }
}

// Color themes per section
const SECTION_THEMES: Record<string, { accent: string; accentBg: string; accentBorder: string; gradient: string }> = {
  crm: { accent: 'text-indigo-600', accentBg: 'bg-indigo-500/10', accentBorder: 'border-indigo-500/20', gradient: 'from-indigo-500/5 via-purple-500/5 to-transparent' },
  comunicacao: { accent: 'text-green-600', accentBg: 'bg-green-500/10', accentBorder: 'border-green-500/20', gradient: 'from-green-500/5 via-emerald-500/5 to-transparent' },
  ia: { accent: 'text-purple-600', accentBg: 'bg-purple-500/10', accentBorder: 'border-purple-500/20', gradient: 'from-purple-500/5 via-pink-500/5 to-transparent' },
  prospeccao: { accent: 'text-blue-600', accentBg: 'bg-blue-500/10', accentBorder: 'border-blue-500/20', gradient: 'from-blue-500/5 via-cyan-500/5 to-transparent' },
  analytics: { accent: 'text-amber-600', accentBg: 'bg-amber-500/10', accentBorder: 'border-amber-500/20', gradient: 'from-amber-500/5 via-orange-500/5 to-transparent' },
  integracoes: { accent: 'text-cyan-600', accentBg: 'bg-cyan-500/10', accentBorder: 'border-cyan-500/20', gradient: 'from-cyan-500/5 via-blue-500/5 to-transparent' },
  equipe: { accent: 'text-rose-600', accentBg: 'bg-rose-500/10', accentBorder: 'border-rose-500/20', gradient: 'from-rose-500/5 via-pink-500/5 to-transparent' },
  mobile: { accent: 'text-teal-600', accentBg: 'bg-teal-500/10', accentBorder: 'border-teal-500/20', gradient: 'from-teal-500/5 via-emerald-500/5 to-transparent' },
  seguranca: { accent: 'text-slate-600', accentBg: 'bg-slate-500/10', accentBorder: 'border-slate-500/20', gradient: 'from-slate-500/5 via-zinc-500/5 to-transparent' },
}

const PERSONA_ICONS = [User, Briefcase, Building2]

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const feature = getFeatureBySlug(slug)
  if (!feature) notFound()

  const t = await getTranslations('marketing.features')
  const tS = await getTranslations('marketing.features.sections')
  const dp = `${feature.sectionKey}.${feature.featureKey}.detail`

  const name = tS(`${feature.sectionKey}.${feature.featureKey}.name` as any)
  const description = tS(`${feature.sectionKey}.${feature.featureKey}.description` as any)
  const sectionTitle = tS(`${feature.sectionKey}.title` as any)
  const sectionSubtitle = tS(`${feature.sectionKey}.subtitle` as any)
  const Icon = feature.icon
  const theme = SECTION_THEMES[feature.sectionKey] || SECTION_THEMES.crm

  // Detail data
  const headline = tryT(tS, `${dp}.headline` as any)
  const planInfo = tryT(tS, `${dp}.planInfo` as any)
  const howTitle = tryT(tS, `${dp}.howItWorks.title` as any)

  // Benefits with title + text
  type Benefit = { title: string; text: string }
  const benefits: Benefit[] = []
  for (let i = 1; i <= 10; i++) {
    const title = tryT(tS, `${dp}.benefits.${i}.title` as any)
    const text = tryT(tS, `${dp}.benefits.${i}.text` as any)
    if (title && text) benefits.push({ title, text })
    else break
  }

  // Use cases with persona + scenario
  type UseCase = { persona: string; scenario: string }
  const useCases: UseCase[] = []
  for (let i = 1; i <= 10; i++) {
    const persona = tryT(tS, `${dp}.useCases.${i}.persona` as any)
    const scenario = tryT(tS, `${dp}.useCases.${i}.scenario` as any)
    if (persona && scenario) useCases.push({ persona, scenario })
    else break
  }

  // How it works with title + text
  type Step = { title: string; text: string }
  const howSteps: Step[] = []
  for (let i = 1; i <= 10; i++) {
    const title = tryT(tS, `${dp}.howItWorks.${i}.title` as any)
    const text = tryT(tS, `${dp}.howItWorks.${i}.text` as any)
    if (title && text) howSteps.push({ title, text })
    else break
  }

  // FAQ
  type FAQ = { q: string; a: string }
  const faqs: FAQ[] = []
  for (let i = 1; i <= 10; i++) {
    const q = tryT(tS, `${dp}.faq.${i}.q` as any)
    const a = tryT(tS, `${dp}.faq.${i}.a` as any)
    if (q && a) faqs.push({ q, a })
    else break
  }

  const hasDetail = benefits.length > 0

  // Sibling features
  const parentCategory = FEATURE_CATEGORIES.find((cat) =>
    cat.sections.some((sec) => sec.features.some((f) => f.slug === slug))
  )
  const parentSection = parentCategory?.sections.find((sec) =>
    sec.features.some((f) => f.slug === slug)
  )
  const siblingFeatures = parentSection?.features.filter((f) => f.slug !== slug) ?? []

  // Prev/next
  const idx = ALL_FEATURES.findIndex((f) => f.slug === slug)
  const prev = idx > 0 ? ALL_FEATURES[idx - 1] : null
  const next = idx < ALL_FEATURES.length - 1 ? ALL_FEATURES[idx + 1] : null

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://siriuscrm.com.br' },
      { '@type': 'ListItem', position: 2, name: 'Funcionalidades', item: 'https://siriuscrm.com.br/features' },
      { '@type': 'ListItem', position: 3, name, item: `https://siriuscrm.com.br/features/${slug}` },
    ],
  }

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="bg-background min-h-screen">
        {/* ════════════════════════════════════════════════════════════
            HERO — gradient background, large icon, headline
           ════════════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} pointer-events-none`} />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-30 pointer-events-none bg-primary/10" />

          <div className="relative py-24 sm:py-32">
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-10">
                <Link href="/features" className="hover:text-foreground transition-colors">
                  Funcionalidades
                </Link>
                <span className="text-muted-foreground/50">/</span>
                <Link href={`/features#${feature.sectionKey}`} className="hover:text-foreground transition-colors">
                  {sectionTitle}
                </Link>
                <span className="text-muted-foreground/50">/</span>
                <span className="text-foreground font-medium">{name}</span>
              </nav>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-start">
                <div>
                  <Badge className={`mb-6 ${theme.accentBg} ${theme.accent} border-0 font-medium px-3 py-1`}>
                    {sectionTitle}
                  </Badge>

                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
                    {name}
                  </h1>

                  {headline && (
                    <p className="mt-6 text-xl sm:text-2xl font-medium text-muted-foreground/80 leading-relaxed max-w-2xl">
                      {headline}
                    </p>
                  )}

                  <p className="mt-6 text-base leading-relaxed text-muted-foreground max-w-2xl">
                    {description}
                  </p>

                  <div className="mt-10 flex flex-col sm:flex-row gap-4">
                    <Button asChild size="lg" className="h-12 px-8 text-base">
                      <Link href="/register">
                        Testar Gratis
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
                      <Link href="/pricing">Ver Planos</Link>
                    </Button>
                  </div>
                </div>

                {/* Large icon */}
                <div className={`hidden lg:flex h-40 w-40 items-center justify-center rounded-3xl ${theme.accentBg} border ${theme.accentBorder}`}>
                  <Icon className={`h-20 w-20 ${theme.accent} opacity-80`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            BENEFITS — 2x3 grid with icon, title, description
           ════════════════════════════════════════════════════════════ */}
        {benefits.length > 0 && (
          <div className="py-24 border-t">
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
              <div className="mb-14">
                <Badge variant="outline" className="mb-4">Beneficios</Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  O que voce ganha
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {benefits.map((b, i) => (
                  <div key={i} className="group flex gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.accentBg} mt-1 group-hover:scale-110 transition-transform duration-200`}>
                      <Check className={`h-5 w-5 ${theme.accent}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base mb-1">{b.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{b.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            HOW IT WORKS — vertical timeline with numbers
           ════════════════════════════════════════════════════════════ */}
        {howSteps.length > 0 && (
          <div className="py-24 bg-muted/30 border-t">
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
              <div className="mb-14">
                <Badge variant="outline" className="mb-4">Passo a passo</Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {howTitle || 'Como funciona na pratica'}
                </h2>
              </div>

              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-border hidden md:block" />

                <div className="space-y-10">
                  {howSteps.map((step, i) => (
                    <div key={i} className="relative flex gap-6 md:gap-8">
                      {/* Number circle */}
                      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20">
                        {i + 1}
                      </div>

                      <div className="pb-2">
                        <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                        <p className="text-muted-foreground leading-relaxed max-w-xl">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            USE CASES — persona cards with gradient borders
           ════════════════════════════════════════════════════════════ */}
        {useCases.length > 0 && (
          <div className="py-24 border-t">
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
              <div className="mb-14">
                <Badge variant="outline" className="mb-4">Casos de uso</Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Quem usa e como
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {useCases.map((uc, i) => {
                  const PersonaIcon = PERSONA_ICONS[i % PERSONA_ICONS.length]
                  return (
                    <div
                      key={i}
                      className="group relative rounded-2xl border bg-background p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${theme.accentBg} mb-5 group-hover:scale-110 transition-transform duration-200`}>
                        <PersonaIcon className={`h-6 w-6 ${theme.accent}`} />
                      </div>

                      <div className="mb-3">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${theme.accent}`}>
                          {uc.persona}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">{uc.scenario}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PLAN INFO — gradient banner
           ════════════════════════════════════════════════════════════ */}
        {planInfo && (
          <div className="py-12 border-t">
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
              <div className={`relative overflow-hidden rounded-2xl border ${theme.accentBorder} p-6 sm:p-8`}>
                <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} opacity-50`} />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme.accentBg}`}>
                    <Info className={`h-6 w-6 ${theme.accent}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm mb-1">Limites por plano</p>
                    <p className="text-sm text-muted-foreground">{planInfo}</p>
                  </div>
                  <div className="sm:ml-auto shrink-0">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/pricing">Comparar planos</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            FAQ — clean accordion-style
           ════════════════════════════════════════════════════════════ */}
        {faqs.length > 0 && (
          <div className="py-24 bg-muted/30 border-t">
            <div className="mx-auto max-w-3xl px-6 lg:px-8">
              <div className="mb-14 text-center">
                <Badge variant="outline" className="mb-4">FAQ</Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Perguntas frequentes
                </h2>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <details
                    key={i}
                    className="group rounded-xl border bg-background transition-all duration-200 hover:shadow-sm"
                  >
                    <summary className="flex items-center justify-between cursor-pointer p-5 text-sm font-medium select-none">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                        {faq.q}
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="px-5 pb-5 pt-0 text-sm text-muted-foreground leading-relaxed ml-7">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            RELATED FEATURES — explore more
           ════════════════════════════════════════════════════════════ */}
        {siblingFeatures.length > 0 && (
          <div className="py-24 border-t">
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
              <div className="mb-14">
                <Badge variant="outline" className="mb-4">{sectionTitle}</Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Explore mais
                </h2>
                <p className="mt-3 text-muted-foreground max-w-xl">{sectionSubtitle}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {siblingFeatures.map((sibling) => {
                  const SibIcon = sibling.icon
                  return (
                    <Link key={sibling.slug} href={`/features/${sibling.slug}`}>
                      <div className="group relative overflow-hidden rounded-2xl border bg-background p-5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 h-full">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.accentBg} mb-4 group-hover:scale-110 transition-transform duration-200`}>
                          <SibIcon className={`h-5 w-5 ${theme.accent}`} />
                        </div>
                        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                          {tS(`${sibling.sectionKey}.${sibling.featureKey}.name` as any)}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {tS(`${sibling.sectionKey}.${sibling.featureKey}.description` as any)}
                        </p>
                        <ArrowRight className="absolute top-5 right-5 h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PREV / NEXT NAVIGATION
           ════════════════════════════════════════════════════════════ */}
        <div className="border-t">
          <div className="mx-auto max-w-5xl px-6 lg:px-8 py-8 flex justify-between items-center">
            {prev ? (
              <Link
                href={`/features/${prev.slug}`}
                className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                <div className="text-left">
                  <span className="text-xs text-muted-foreground/60 block">Anterior</span>
                  <span className="font-medium">{tS(`${prev.sectionKey}.${prev.featureKey}.name` as any)}</span>
                </div>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/features/${next.slug}`}
                className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="text-right">
                  <span className="text-xs text-muted-foreground/60 block">Proxima</span>
                  <span className="font-medium">{tS(`${next.sectionKey}.${next.featureKey}.name` as any)}</span>
                </div>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            FINAL CTA — with glass effect
           ════════════════════════════════════════════════════════════ */}
        <div className="py-24 border-t bg-muted/20">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border bg-background p-10 sm:p-14 text-center shadow-xl shadow-primary/5">
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] opacity-20 pointer-events-none bg-primary" />
              <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full blur-[80px] opacity-10 pointer-events-none bg-primary" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-sm text-green-600 dark:text-green-400 mb-6">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium">Gratuito para sempre</span>
                </div>

                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {t('cta.title')}
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto">{t('cta.subtitle')}</p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20">
                    <Link href="/register">
                      {t('cta.ctaPrimary')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
                    <Link href="/pricing">{t('cta.ctaSecondary')}</Link>
                  </Button>
                </div>

                <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-green-500" />
                    Sem cartao de credito
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-green-500" />
                    5 min para configurar
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
