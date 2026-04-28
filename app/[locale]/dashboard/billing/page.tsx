import { Metadata } from 'next'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Star, Users, ArrowUpRight, Zap, Crown, Building2, Sparkles,
  Gift, Clock, AlertTriangle, CheckCircle2, TrendingDown, ExternalLink,
} from "lucide-react"
import { BillingPageTracker } from "@/components/analytics/billing-page-tracker"
import { PurchaseTracker } from "@/components/analytics/purchase-tracker"
import { CopyReferralButton } from "./copy-referral-button"
import { CancelSubscriptionButton } from "./cancel-subscription-button"
import { PLAN_NAMES, PLAN_PRICING, PLAN_DESCRIPTIONS } from "@/lib/entitlements"
import { SubscriptionTier } from "@prisma/client"
import { isTrialActive, isReadOnly } from "@/lib/entitlements"

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

const TIER_COLOR: Record<string, string> = {
  FREE:     'from-zinc-500/10 to-zinc-500/5 border-zinc-200 dark:border-zinc-800',
  STARTER:  'from-blue-500/10 to-blue-500/5 border-blue-200 dark:border-blue-900',
  PRO:      'from-violet-500/10 to-violet-500/5 border-violet-200 dark:border-violet-900',
  BUSINESS: 'from-amber-500/10 to-amber-500/5 border-amber-200 dark:border-amber-900',
}

const TIER_ACCENT: Record<string, string> = {
  FREE:     'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
  STARTER:  'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  PRO:      'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  BUSINESS: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

function getDaysRemaining(endsAt: Date): number {
  return Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
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
  let trialEndsAt: Date | null = null
  let trialStatus: string | null = null

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
            trialEndsAt: true,
            trialStatus: true,
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
      referralDiscount = user.organization?.referralDiscount ?? 0
      rewardedReferrals = user.organization?.referrals?.length ?? 0
      trialEndsAt = user.organization?.trialEndsAt ?? null
      trialStatus = user.organization?.trialStatus ?? null

      // Gerar referralCode se o usuário ainda não tiver (usuários antigos)
      if (user.referralCode) {
        referralCode = user.referralCode
      } else {
        let code = Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6)
        const conflict = await prisma.user.findUnique({ where: { referralCode: code } })
        if (conflict) code = code + Math.floor(Math.random() * 99)
        await prisma.user.update({ where: { email: session.user.email }, data: { referralCode: code } })
        referralCode = code
      }
    }
  }

  const isPaid = tier !== SubscriptionTier.FREE
  const orgInfo = { tier, trialEndsAt, trialStatus }
  const trialActive = isTrialActive(orgInfo)
  const readOnly = isReadOnly(orgInfo)
  const daysLeft = trialEndsAt ? getDaysRemaining(new Date(trialEndsAt)) : 0

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://siriuscrm.com.br'
  const referralUrl = referralCode ? `${appUrl}/r/${referralCode}` : null

  const displayPrice = isFounder && customPricing ? customPricing : PLAN_PRICING[tier]
  const tierLabel = PLAN_NAMES[tier] ?? tier
  const tierKey = tier as string

  // Referral progress (max 7 = 100%)
  const MAX_REFERRALS = 7
  const referralProgress = Math.min((rewardedReferrals / MAX_REFERRALS) * 100, 100)
  const nextMilestone = Math.min(rewardedReferrals + 1, MAX_REFERRALS)
  const discountAtNext = Math.min((nextMilestone / MAX_REFERRALS) * 100, 100)

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-3xl mx-auto">
      <BillingPageTracker />
      <PurchaseTracker />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assinatura & Faturamento</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie seu plano e programa de indicação</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/billing/plans">
            Ver planos
            <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </Button>
      </div>

      {/* Trial status banner */}
      {tier === SubscriptionTier.FREE && trialActive && (
        <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
          daysLeft <= 2
            ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
            : 'bg-primary/5 border-primary/20'
        }`}>
          <Clock className={`w-4 h-4 shrink-0 ${daysLeft <= 2 ? 'text-orange-600' : 'text-primary'}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${daysLeft <= 2 ? 'text-orange-700 dark:text-orange-400' : 'text-foreground'}`}>
              {daysLeft === 0
                ? 'Último dia do trial PRO'
                : `Trial PRO ativo — ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`}
            </p>
            <p className="text-xs text-muted-foreground">Você tem acesso completo ao plano PRO durante o trial.</p>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/dashboard/billing/plans">Fazer upgrade</Link>
          </Button>
        </div>
      )}

      {tier === SubscriptionTier.FREE && readOnly && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 text-destructive" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Trial expirado — conta em modo somente leitura</p>
            <p className="text-xs text-muted-foreground">Você pode visualizar seus dados, mas não criar ou editar registros.</p>
          </div>
          <Button asChild size="sm" variant="destructive" className="shrink-0">
            <Link href="/dashboard/billing/plans">Fazer upgrade</Link>
          </Button>
        </div>
      )}

      {/* Plano atual */}
      <Card className={`bg-gradient-to-br border ${isFounder ? 'from-amber-500/10 to-amber-500/5 border-amber-300 dark:border-amber-800' : TIER_COLOR[tierKey] ?? ''}`}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isFounder ? 'bg-amber-500/20 text-amber-600' : (TIER_ACCENT[tierKey] ?? 'bg-primary/10 text-primary')
              }`}>
                {isFounder ? <Star className="w-5 h-5 fill-amber-400" /> : TIER_ICON[tierKey]}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg">Plano {tierLabel}</CardTitle>
                  {isFounder && (
                    <Badge className="bg-amber-500 text-white text-xs">Fundador #{founderNumber}</Badge>
                  )}
                  {trialActive && (
                    <Badge variant="outline" className="text-xs border-primary/40 text-primary">Trial ativo</Badge>
                  )}
                  {isPaid && !isFounder && (
                    <Badge variant="outline" className="text-xs border-green-500/40 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3 mr-1" />Ativo
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-0.5">
                  {isFounder ? 'Preço vitalício garantido — nunca sobe' : PLAN_DESCRIPTIONS[tier]}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold tracking-tight">
                {displayPrice === 0 ? 'Grátis' : `R$${displayPrice}`}
              </div>
              {displayPrice !== 0 && <div className="text-xs text-muted-foreground">/mês</div>}
              {isFounder && (
                <div className="text-xs text-amber-600 font-medium mt-0.5">
                  ~41% OFF vitalício
                </div>
              )}
              {referralDiscount > 0 && !isFounder && (
                <div className="text-xs text-primary font-medium mt-0.5">
                  −{referralDiscount}% via indicações
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Upgrade row for free users */}
        {!isPaid && !trialActive && !isFounder && (
          <CardContent className="pt-0">
            <div className="border-t border-border/50 pt-4 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-muted-foreground">
                Starter R$67 · Pro R$147 · Business R$397/mês
              </p>
              <Button asChild size="sm">
                <Link href="/dashboard/billing/plans">
                  Ver planos <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        )}

        {/* Cancel for paid non-founders */}
        {isPaid && !isFounder && (
          <CardContent className="pt-0">
            <div className="border-t border-border/50 pt-4 flex justify-end">
              <CancelSubscriptionButton planName={tierLabel} />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Programa de Indicação */}
      {referralUrl && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Indique e Ganhe</CardTitle>
                  <CardDescription className="mt-0.5">
                    Cada indicação ativa = <strong className="text-foreground">+15% off</strong> recorrente na sua mensalidade
                  </CardDescription>
                </div>
              </div>
              {referralDiscount > 0 && (
                <div className="text-right shrink-0">
                  <div className="text-3xl font-bold tracking-tight text-primary">{referralDiscount}%</div>
                  <div className="text-xs text-muted-foreground">desconto ativo</div>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {rewardedReferrals} de {MAX_REFERRALS} indicações ativas
                </span>
                {rewardedReferrals < MAX_REFERRALS ? (
                  <span className="text-muted-foreground text-xs">
                    próxima → <span className="text-primary font-medium">{discountAtNext.toFixed(0)}% off</span>
                  </span>
                ) : (
                  <Badge className="text-xs bg-primary text-primary-foreground">Mensalidade zerada!</Badge>
                )}
              </div>
              <Progress value={referralProgress} className="h-2" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0%</span>
                <span>15%</span>
                <span>30%</span>
                <span>45%</span>
                <span>60%</span>
                <span>75%</span>
                <span>90%</span>
                <span className="font-semibold text-primary">100% grátis</span>
              </div>
            </div>

            {/* Benefícios do indicado */}
            <div className="rounded-lg bg-muted/50 border border-border/50 px-4 py-3 flex items-start gap-3">
              <TrendingDown className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Quem você indicar recebe <strong className="text-foreground">20% off por 3 meses</strong> no primeiro plano pago — o desconto é aplicado automaticamente pelo link.
              </p>
            </div>

            {/* Link copiável */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Seu link exclusivo</p>
              <div className="flex gap-2 flex-wrap">
                <code className="bg-muted border border-border/50 rounded-lg px-3 py-2.5 text-sm flex-1 min-w-0 truncate font-mono">
                  {referralUrl}
                </code>
                <CopyReferralButton url={referralUrl} />
              </div>
            </div>

            {/* Link para página do programa */}
            <div className="flex justify-end">
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
                <Link href="/indique">
                  Como funciona o programa
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/dashboard/billing/plans"
          className="group rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Comparar planos</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tabela completa de funcionalidades</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Link>
        <Link
          href="/indique"
          className="group rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Programa de indicação</p>
              <p className="text-xs text-muted-foreground mt-0.5">Regras, exemplos e calculadora</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  )
}
