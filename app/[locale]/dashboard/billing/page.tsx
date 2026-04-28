import { Metadata } from 'next'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Users, ArrowUpRight, Zap, Crown, Building2, Sparkles } from "lucide-react"
import { BillingPageTracker } from "@/components/analytics/billing-page-tracker"
import { PurchaseTracker } from "@/components/analytics/purchase-tracker"
import { CopyReferralButton } from "./copy-referral-button"
import { CancelSubscriptionButton } from "./cancel-subscription-button"
import { PLAN_NAMES, PLAN_PRICING, PLAN_DESCRIPTIONS } from "@/lib/entitlements"
import { SubscriptionTier } from "@prisma/client"

export const metadata: Metadata = {
  title: 'Assinatura & Faturamento | Sirius CRM'
}

export const dynamic = 'force-dynamic'

const TIER_ICON: Record<string, React.ReactNode> = {
  FREE:     <Sparkles className="w-5 h-5" />,
  STARTER:  <Zap className="w-5 h-5" />,
  PRO:      <Crown className="w-5 h-5" />,
  BUSINESS: <Building2 className="w-5 h-5" />,
}

export default async function BillingPage() {
  const session = await getSession()

  let tier: SubscriptionTier = SubscriptionTier.FREE
  let isFounder = false
  let founderNumber: number | null = null
  let customPricing: number | null = null
  let referralCode: string | null = null
  let referralDiscount = 0
  let rewardedReferrals = 0

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        referralCode: true,
        organization: {
          select: {
            tier: true,
            isFounder: true,
            founderNumber: true,
            customPricing: true,
            referralDiscount: true,
            referrals: { where: { status: 'REWARDED' }, select: { id: true } },
          }
        }
      }
    })
    if (user) {
      tier = (user.organization?.tier ?? SubscriptionTier.FREE) as SubscriptionTier
      isFounder = user.organization?.isFounder ?? false
      founderNumber = user.organization?.founderNumber ?? null
      customPricing = user.organization?.customPricing ? Number(user.organization.customPricing) : null
      referralCode = user.referralCode ?? null
      referralDiscount = user.organization?.referralDiscount ?? 0
      rewardedReferrals = user.organization?.referrals?.length ?? 0
    }
  }

  const isPaid = tier !== SubscriptionTier.FREE

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://siriuscrm.com.br'
  const referralUrl = referralCode ? `${appUrl}/r/${referralCode}` : null

  // Preço exibido: customPricing para fundadores, PLAN_PRICING para regular
  const displayPrice = isFounder && customPricing
    ? customPricing
    : PLAN_PRICING[tier]

  const tierLabel = PLAN_NAMES[tier] ?? tier

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-4xl">
      <BillingPageTracker />
      <PurchaseTracker />

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Assinatura & Faturamento</h2>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/billing/plans">
            Ver todos os planos
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Plano Atual */}
      <Card className={isFounder ? 'border-amber-300 bg-amber-50/50' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isFounder ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'
              }`}>
                {isFounder ? <Star className="w-5 h-5 fill-amber-400" /> : TIER_ICON[tier]}
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Plano {tierLabel}
                  {isFounder && (
                    <Badge className="bg-amber-500 text-white text-xs">
                      Fundador #{founderNumber}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {isFounder
                    ? `Preço vitalício garantido — nunca sobe`
                    : PLAN_DESCRIPTIONS[tier]}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {displayPrice === 0 ? 'Grátis' : `R$${displayPrice}/mês`}
              </div>
              {isFounder && (
                <div className="text-xs text-amber-600 font-medium">
                  ~41% OFF vitalício (vs R${PLAN_PRICING[tier]}/mês regular)
                </div>
              )}
            </div>
          </div>
          {isPaid && !isFounder && (
            <div className="flex justify-end pt-2 border-t border-border/50 mt-2">
              <CancelSubscriptionButton planName={tierLabel} />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Upgrade CTA (para FREE/STARTER não-fundadores) */}
      {!isPaid && !isFounder && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-4 flex-wrap">
            <div>
              <p className="font-semibold">Pronto para escalar?</p>
              <p className="text-sm text-muted-foreground">
                Upgrade para Starter (R$67), Pro (R$147) ou Business (R$397/mês).
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/billing/plans">
                Ver Planos
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Referral Section */}
      {referralUrl && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-primary" />
                  Indique e Ganhe
                </CardTitle>
                <CardDescription className="mt-1.5">
                  Cada indicação ativa vale <strong>15% off recorrente</strong> na sua mensalidade.
                  Acumule até <strong>7 indicações e zere sua conta</strong>. Quem você indicar ganha{' '}
                  <strong>20% off por 3 meses</strong> no primeiro plano.
                </CardDescription>
              </div>
              {referralDiscount > 0 && (
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-primary">{referralDiscount}%</div>
                  <div className="text-xs text-muted-foreground">
                    desconto ativo · {rewardedReferrals} indicaç{rewardedReferrals === 1 ? 'ão' : 'ões'}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <code className="bg-muted rounded-md px-3 py-2 text-sm flex-1 min-w-0 truncate">
                {referralUrl}
              </code>
              <CopyReferralButton url={referralUrl} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
