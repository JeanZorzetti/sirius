import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Check, Star, Zap, Shield, Users, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FounderCheckoutButton } from './founder-checkout-button'

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.founders.meta' })
  const canonical = `https://sirius.roilabs.com.br${locale === 'en' ? '/en' : ''}/fundadores`

  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: canonical,
      images: [{ url: 'https://sirius.roilabs.com.br/og-image.png', width: 1200, height: 630 }],
    },
  }
}

export const dynamic = 'force-dynamic'

const FOUNDER_TIERS = [
  {
    plan: 'FOUNDER_STARTER' as const,
    tierKey: 'starter',
    regularPrice: 67,
    founderPrice: 39,
    limit: 100,
    highlight: false,
    color: 'border-muted',
  },
  {
    plan: 'FOUNDER_PRO' as const,
    tierKey: 'pro',
    regularPrice: 147,
    founderPrice: 87,
    limit: 50,
    highlight: true,
    color: 'border-primary ring-2 ring-primary/20 shadow-lg scale-105 z-10',
  },
  {
    plan: 'FOUNDER_BUSINESS' as const,
    tierKey: 'business',
    regularPrice: 397,
    founderPrice: 234,
    limit: 25,
    highlight: false,
    color: 'border-muted',
  },
]

const PERK_ICONS = [Star, Shield, Users, Clock, Zap]

export default async function FundadoresPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.founders' })

  const [starterCount, proCount, businessCount, totalFounders] = await Promise.all([
    prisma.organization.count({ where: { isFounder: true, tier: 'STARTER' } }),
    prisma.organization.count({ where: { isFounder: true, tier: 'PRO' } }),
    prisma.organization.count({ where: { isFounder: true, tier: 'BUSINESS' } }),
    prisma.organization.count({ where: { isFounder: true } }),
  ])

  const spotsByPlan: Record<string, number> = {
    FOUNDER_STARTER: starterCount,
    FOUNDER_PRO: proCount,
    FOUNDER_BUSINESS: businessCount,
  }

  const anyPlanOpen = FOUNDER_TIERS.some((tier) => spotsByPlan[tier.plan] < tier.limit)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-background to-primary/5 border-b">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            {t('hero.badge')}
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            {t('hero.title')}
          </h1>

          <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            <strong className="text-foreground">{t('hero.subtitle_bold')}</strong> {t('hero.subtitle_text')}
          </p>

          <p className="text-sm text-muted-foreground">
            {totalFounders} {t('hero.social_proof')}
          </p>
        </div>
      </section>

      {/* Tier cards */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6 items-center">
          {FOUNDER_TIERS.map((tier) => {
            const filled = spotsByPlan[tier.plan]
            const spotsLeft = tier.limit - filled
            const isSoldOut = spotsLeft <= 0
            const percentFilled = Math.round((filled / tier.limit) * 100)
            const nextFounderNumber = totalFounders + 1
            const tierFeatures = t.raw(`tiers.${tier.tierKey}.features`) as string[]

            return (
              <div
                key={tier.plan}
                className={`relative bg-card border rounded-2xl flex flex-col ${tier.color}`}
              >
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="rounded-full bg-gradient-to-r from-primary to-purple-600 px-4 py-1 text-xs font-bold text-white shadow-lg whitespace-nowrap">
                      {t(`tiers.${tier.tierKey}.badge`)}
                    </div>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Header */}
                  <div className="mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                      {t(`tiers.${tier.tierKey}.name`)}
                    </h2>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">R${tier.founderPrice}</span>
                      <span className="text-sm text-muted-foreground">{t(`tiers.${tier.tierKey}.price_label`)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm line-through text-muted-foreground">R${tier.regularPrice}/mês</span>
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {t(`tiers.${tier.tierKey}.discount_badge`)}
                      </span>
                    </div>
                  </div>

                  {/* Spots bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{t(`tiers.${tier.tierKey}.spots_label`)}</span>
                      <span className="font-semibold">{filled}/{tier.limit}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${isSoldOut ? 'bg-red-400' : 'bg-primary'}`}
                        style={{ width: `${Math.max(percentFilled, 2)}%` }}
                      />
                    </div>
                    <p className={`text-xs mt-1 font-medium ${isSoldOut ? 'text-red-500' : 'text-amber-600'}`}>
                      {isSoldOut
                        ? t(`tiers.${tier.tierKey}.sold_out`)
                        : `${spotsLeft} ${t(`tiers.${tier.tierKey}.spots_remaining`)}`}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {tierFeatures.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isSoldOut ? (
                    <Button className="w-full" variant="outline" disabled>
                      {t(`tiers.${tier.tierKey}.sold_out`)}
                    </Button>
                  ) : (
                    <FounderCheckoutButton
                      plan={tier.plan}
                      price={tier.founderPrice}
                      spotsLeft={spotsLeft}
                      founderNumber={nextFounderNumber}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">{t('security')}</p>
      </section>

      {/* Perks */}
      <section className="border-t bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">{t('perks.title')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(['perk1', 'perk2', 'perk3', 'perk4', 'perk5'] as const).map((key, i) => {
              const Icon = PERK_ICONS[i]
              return (
                <div key={key} className="flex items-start gap-3 bg-card border rounded-lg p-4">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-sm leading-relaxed">{t(`perks.${key}`)}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Price comparison table */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">{t('comparison.title')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">{t('comparison.header_plan')}</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">{t('comparison.header_regular')}</th>
                <th className="text-center py-3 px-4 font-semibold text-primary">{t('comparison.header_founder')}</th>
                <th className="text-center py-3 px-4 font-semibold text-green-600">{t('comparison.header_savings')}</th>
              </tr>
            </thead>
            <tbody>
              {FOUNDER_TIERS.map((tier) => (
                <tr key={tier.plan} className={`border-b ${tier.highlight ? 'bg-primary/5' : ''}`}>
                  <td className="py-3 px-4 font-medium">{t(`tiers.${tier.tierKey}.short_name`)}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground line-through">R${tier.regularPrice}/mês</td>
                  <td className="py-3 px-4 text-center font-bold text-primary">R${tier.founderPrice}/mês</td>
                  <td className="py-3 px-4 text-center text-green-600 font-semibold">
                    R${(tier.regularPrice - tier.founderPrice) * 12}/ano
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-muted/30">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">{t('faq.title')}</h2>
          <div className="space-y-4">
            {(['q1', 'q2', 'q3', 'q4', 'q5'] as const).map((qKey) => {
              const aKey = qKey.replace('q', 'a') as 'a1'|'a2'|'a3'|'a4'|'a5'
              return (
                <div key={qKey} className="bg-card border rounded-lg p-5">
                  <p className="font-semibold mb-2">{t(`faq.${qKey}`)}</p>
                  <p className="text-sm text-muted-foreground">{t(`faq.${aKey}`)}</p>
                </div>
              )
            })}
          </div>

          {anyPlanOpen && (
            <div className="mt-10 text-center">
              <p className="text-muted-foreground mb-4">{t('cta.doubt')}</p>
              <Button asChild size="lg" variant="default">
                <a href="/fundadores">{t('cta.button')}</a>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
