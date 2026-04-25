'use client'

import Link from 'next/link'
import Script from 'next/script'
import { Check, Star, Building2 } from 'lucide-react'
import { PricingToggle } from './pricing-toggle'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { PricingPageTracker } from '@/components/analytics/pricing-page-tracker'
import { TrackedSignupButton } from '@/components/analytics/tracked-signup-button'

const TIER_IDS = ['free', 'starter', 'pro', 'business'] as const
type TierId = typeof TIER_IDS[number]
const FEATURED_TIER: TierId = 'pro'

export default function PricingPage() {
    const t = useTranslations('marketing.pricing')

    const tiers = TIER_IDS.map((id) => ({
        id,
        name: t(`tiers.${id}.name`),
        href: '/register',
        priceMonthly: t(`tiers.${id}.price_monthly`),
        priceAnnual: t(`tiers.${id}.price_annual`),
        description: t(`tiers.${id}.description`),
        features: t.raw(`tiers.${id}.features`) as string[],
        featured: id === FEATURED_TIER,
    }))

    const faqPairs = [
        ['q1', 'a1'], ['q2', 'a2'], ['q3', 'a3'], ['q4', 'a4'],
        ['q5', 'a5'], ['q6', 'a6'], ['q7', 'a7'], ['q8', 'a8'],
    ] as const
    type FaqQ = 'q1'|'q2'|'q3'|'q4'|'q5'|'q6'|'q7'|'q8'
    type FaqA = 'a1'|'a2'|'a3'|'a4'|'a5'|'a6'|'a7'|'a8'

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://siriuscrm.com.br" },
            { "@type": "ListItem", "position": 2, "name": t('tagline'), "item": "https://siriuscrm.com.br/pricing" }
        ]
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqPairs.map(([qKey, aKey]) => ({
            "@type": "Question",
            "name": t(`faq.${qKey as FaqQ}`),
            "acceptedAnswer": { "@type": "Answer", "text": t(`faq.${aKey as FaqA}`) }
        }))
    };

    const offersSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Sirius CRM Plans",
        "itemListElement": tiers.map((tier, i) => ({
            "@type": "Offer",
            "name": tier.name,
            "price": i === 0 ? "0" : tier.priceMonthly.replace(/[^\d]/g, ''),
            "priceCurrency": "BRL",
            "availability": "https://schema.org/InStock",
            "description": tier.description
        }))
    };

    const softwareAppSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Sirius CRM",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web, iOS, Android",
        "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "BRL",
            "lowPrice": "0",
            "highPrice": "397",
            "offerCount": "4"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "12"
        }
    };

    return (
        <>
            <PricingPageTracker />
            <Script
                id="breadcrumb-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <Script
                id="faq-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <Script
                id="offers-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(offersSchema) }}
            />
            <Script
                id="software-app-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
            />
            <div className="relative isolate bg-background px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-sm text-green-600 dark:text-green-400 mb-6">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{t('badge')}</span>
                </div>
                <h2 className="text-base font-semibold leading-7 text-primary">{t('tagline')}</h2>
                <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                    {t('title')}
                </h1>
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground">
                {t('subtitle')}
            </p>

            {/* Founders CTA Banner */}
            <div className="mx-auto mt-10 max-w-4xl">
                <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Star className="w-6 h-6 text-amber-500 fill-amber-400 shrink-0" />
                        <div>
                            <p className="font-semibold text-amber-900">{t('founders.badge')}</p>
                            <p className="text-sm text-amber-700">{t('founders.details')}</p>
                        </div>
                    </div>
                    <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white shrink-0">
                        <Link href="/fundadores">
                            <Star className="w-4 h-4 mr-2 fill-white" />
                            {t('founders.cta')}
                        </Link>
                    </Button>
                </div>
            </div>

            <PricingToggle labelMonthly={t('labelMonthly')} labelAnnual={t('labelAnnual')}>
                {(isAnnual) => (
                    <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-y-6 sm:gap-y-0 lg:grid-cols-4 lg:gap-x-6">
                        {tiers.map((tier) => {
                            const price = isAnnual ? tier.priceAnnual : tier.priceMonthly
                            const isFree = tier.id === 'free'
                            return (
                                <Card
                                    key={tier.id}
                                    className={`flex flex-col justify-between relative ${tier.featured ? 'border-primary shadow-lg scale-105 z-10 ring-2 ring-primary/20' : ''}`}
                                >
                                    {tier.featured && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                                            <div className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                                                {t('mostPopular')}
                                            </div>
                                        </div>
                                    )}
                                    <CardHeader>
                                        <CardTitle id={`tier-${tier.id}`} className="text-2xl font-bold">{tier.name}</CardTitle>
                                        <CardDescription>{tier.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="mt-4 flex items-baseline gap-x-2">
                                            <span className="text-4xl font-bold tracking-tight">{price}</span>
                                            {!isFree && <span className="text-sm font-semibold leading-6 text-muted-foreground">{t('perMonth')}</span>}
                                        </div>
                                        {isAnnual && !isFree && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {t('billedAnnually')} · <span className="line-through">{tier.priceMonthly}{t('perMonth')}</span>
                                            </p>
                                        )}
                                        <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-muted-foreground">
                                            {tier.features.map((feature) => (
                                                <li key={feature} className="flex gap-x-3">
                                                    <Check className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter className="flex flex-col gap-3">
                                        <Button asChild className="w-full" variant={tier.featured ? 'default' : 'outline'}>
                                            <Link href={tier.href} aria-describedby={`tier-${tier.id}`}>
                                                {t('getStarted')}
                                            </Link>
                                        </Button>
                                        {tier.featured && (
                                            <div className="flex items-center justify-center gap-2 text-xs text-green-600 dark:text-green-400">
                                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="font-medium">{t('guarantee')}</span>
                                            </div>
                                        )}
                                    </CardFooter>
                                </Card>
                            )
                        })}

                        {/* Enterprise Card */}
                        <Card className="flex flex-col justify-between relative border-dashed lg:col-span-4 mt-6">
                            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
                                <div className="flex items-center gap-4">
                                    <Building2 className="h-8 w-8 text-muted-foreground shrink-0" />
                                    <div>
                                        <h3 className="text-lg font-bold">{t('enterprise.name')}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {t('enterprise.description')}
                                        </p>
                                    </div>
                                </div>
                                <Button asChild variant="outline" className="shrink-0">
                                    <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                                        {t('enterprise.cta')}
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </PricingToggle>

            {/* ROI Calculator Section */}
            <div className="mx-auto mt-24 max-w-3xl">
                <div className="rounded-2xl border bg-card p-8 shadow-sm">
                    <h3 className="text-2xl font-bold text-center mb-2">{t('roi.title')}</h3>
                    <p className="text-center text-muted-foreground mb-8">
                        {t('roi.subtitle')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="text-center p-6 rounded-xl bg-primary/5">
                            <div className="text-3xl font-bold text-primary mb-2">{t('roi.stat1Value')}</div>
                            <div className="text-sm text-muted-foreground">{t('roi.stat1Label')}</div>
                        </div>
                        <div className="text-center p-6 rounded-xl bg-green-500/5">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{t('roi.stat2Value')}</div>
                            <div className="text-sm text-muted-foreground">{t('roi.stat2Label')}</div>
                        </div>
                        <div className="text-center p-6 rounded-xl bg-purple-500/5">
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">{t('roi.stat3Value')}</div>
                            <div className="text-sm text-muted-foreground">{t('roi.stat3Label')}</div>
                        </div>
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                        💡 {t('roi.note')}
                    </div>
                </div>
            </div>

            {/* Calculadoras — Internal Links */}
            <div className="mx-auto mt-16 max-w-4xl">
                <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold mb-2">{t('calculators.title')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('calculators.subtitle')}
                    </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                        { href: '/ferramentas/calculadora-roi', labelKey: 'calculators.links.general' },
                        { href: '/ferramentas/calculadora-roi-corretores', labelKey: 'calculators.links.realtors' },
                        { href: '/ferramentas/calculadora-roi-agencias', labelKey: 'calculators.links.agencies' },
                        { href: '/ferramentas/calculadora-roi-consultores', labelKey: 'calculators.links.consultants' },
                        { href: '/ferramentas/calculadora-roi-energia-solar', labelKey: 'calculators.links.solar' },
                        { href: '/ferramentas/calculadora-roi-representantes', labelKey: 'calculators.links.reps' },
                    ].map((calc) => (
                        <Link
                            key={calc.href}
                            href={calc.href}
                            className="rounded-lg border bg-card p-3 text-center text-sm font-medium hover:border-primary/50 hover:bg-primary/5 transition-colors"
                        >
                            {t(calc.labelKey as any)}
                        </Link>
                    ))}
                </div>
            </div>

            {/* FAQ Section */}
            <div className="mx-auto mt-24 max-w-4xl">
                <h3 className="text-3xl font-bold text-center mb-12">{t('faq.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {faqPairs.map(([qKey, aKey]) => (
                        <div key={qKey}>
                            <h4 className="font-semibold mb-2 text-primary">{t(`faq.${qKey as FaqQ}`)}</h4>
                            <p className="text-sm text-muted-foreground">
                                {t(`faq.${aKey as FaqA}`)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Final CTA */}
            <div className="mx-auto mt-24 max-w-2xl text-center">
                <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-purple-500/5 p-8">
                    <h3 className="text-2xl font-bold mb-3">{t('finalCta.title')}</h3>
                    <p className="text-muted-foreground mb-6">
                        {t('finalCta.subtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <TrackedSignupButton
                            href="/register"
                            source="pricing_page_cta"
                            plan="free"
                            size="lg"
                            variant="default"
                        >
                            {t('finalCta.btnPrimary')}
                        </TrackedSignupButton>
                        <Button asChild size="lg" variant="outline">
                            <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                                {t('finalCta.btnSecondary')}
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}
