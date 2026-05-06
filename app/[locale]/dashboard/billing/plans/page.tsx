'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X, Loader2, Sparkles, Zap, Building2, Crown, Bot } from 'lucide-react'
import { toast } from 'sonner'
import { PLAN_LIMITS, PLAN_PRICING, PLAN_PRICING_ANNUAL, PLAN_NAMES, PLAN_DESCRIPTIONS } from '@/lib/entitlements'
import { SubscriptionTier } from '@prisma/client'

interface PlanFeature {
  name: string
  free: string | boolean
  starter: string | boolean
  pro: string | boolean
  business: string | boolean
}

const features: PlanFeature[] = [
  { name: 'Contatos', free: '250', starter: '1.000', pro: '5.000', business: 'Ilimitado' },
  { name: 'Negócios (Deals)', free: '100', starter: '500', pro: '2.500', business: 'Ilimitado' },
  { name: 'Pipelines', free: '1', starter: '5', pro: '15', business: '50' },
  { name: 'Usuários', free: '2', starter: '5', pro: '15', business: '50' },
  { name: 'WhatsApp Oficial (Meta)', free: false, starter: false, pro: false, business: 'API Oficial Meta' },
  { name: 'Automações de Email', free: false, starter: '5', pro: '15', business: '50' },
  { name: 'Integrações', free: false, starter: 'Básicas', pro: 'Avançadas', business: 'Todas' },
  { name: 'Analytics Avançado', free: false, starter: false, pro: true, business: true },
  { name: 'Relatórios Customizados', free: false, starter: false, pro: false, business: true },
  { name: 'Distribuição Round-Robin', free: false, starter: false, pro: false, business: true },
  { name: 'Suporte (Tickets + Chat)', free: 'Tickets + WhatsApp*', starter: 'Tickets + WhatsApp*', pro: 'Tickets + WhatsApp', business: 'Tickets + WhatsApp' },
  { name: 'Agentes IA (Sofia)', free: false, starter: '1 agente', pro: '3 agentes', business: '5 agentes' },
  { name: 'Ações autônomas/mês', free: false, starter: '200', pro: '1.000', business: '3.000' },
  { name: 'Aprovação de ações IA', free: false, starter: true, pro: true, business: true },
]

export default function PlansPage() {
  const router = useRouter()
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null)
  const [customPricing, setCustomPricing] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<SubscriptionTier | null>(null)
  const [isAnnual, setIsAnnual] = useState(false)

  useEffect(() => {
    fetchCurrentPlan()
  }, [])

  const fetchCurrentPlan = async () => {
    try {
      const res = await fetch('/api/entitlements')
      if (res.ok) {
        const data = await res.json()
        setCurrentTier(data.tier)
        setCustomPricing(data.customPricing ?? null)
      }
    } catch (error) {
      console.error('Error fetching plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === currentTier || tier === SubscriptionTier.FREE) return

    setProcessing(tier)

    try {
      const res = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: tier, billingPeriod: isAnnual ? 'ANNUAL' : 'MONTHLY' }),
      })

      const data = await res.json()

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        toast.error(data.error || 'Erro ao iniciar checkout')
      }
    } catch (error) {
      toast.error('Erro ao processar upgrade')
    } finally {
      setProcessing(null)
    }
  }

  const getPlanIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case SubscriptionTier.FREE:
        return <Sparkles className="h-5 w-5" />
      case SubscriptionTier.STARTER:
        return <Zap className="h-5 w-5" />
      case SubscriptionTier.PRO:
        return <Crown className="h-5 w-5" />
      case SubscriptionTier.BUSINESS:
        return <Building2 className="h-5 w-5" />
    }
  }

  const TIER_ORDER: Record<SubscriptionTier, number> = {
    [SubscriptionTier.FREE]: 0,
    [SubscriptionTier.STARTER]: 1,
    [SubscriptionTier.PRO]: 2,
    [SubscriptionTier.BUSINESS]: 3,
  }

  const getButtonText = (tier: SubscriptionTier) => {
    if (processing === tier) return <Loader2 className="h-4 w-4 animate-spin" />
    if (tier === currentTier) return 'Plano Atual'
    if (tier === SubscriptionTier.FREE) return 'Plano Gratuito'
    if (currentTier && TIER_ORDER[tier] < TIER_ORDER[currentTier]) return 'Fazer Downgrade'
    return 'Fazer Upgrade'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planos e Preços</h1>
        <p className="text-muted-foreground">
          Escolha o plano ideal para o seu negócio. Faça upgrade ou downgrade a qualquer momento.
        </p>
      </div>

      {/* Referral Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between gap-4 py-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-primary shrink-0" />
            <div>
              <p className="font-semibold">Indique e ganhe até 100% de desconto recorrente</p>
              <p className="text-sm text-muted-foreground">
                Cada indicação ativa = 15% off na sua mensalidade. 7 indicações = mensalidade zerada.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/dashboard/billing">
              Ver programa de indicação
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Toggle Mensal/Anual */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
          Mensal
        </span>
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
            isAnnual ? 'bg-primary' : 'bg-muted'
          }`}
          aria-label="Alternar entre mensal e anual"
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
              isAnnual ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
          Anual
        </span>
        {isAnnual && (
          <Badge variant="secondary" className="text-green-600 bg-green-50">20% OFF</Badge>
        )}
      </div>

      {/* Cards dos Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.values(SubscriptionTier).map((tier) => {
          const isProWithCustom = tier === SubscriptionTier.PRO && customPricing !== null
          const monthlyPrice = isProWithCustom ? customPricing! : PLAN_PRICING[tier]
          const annualMonthly = isProWithCustom ? customPricing! * 0.8 : PLAN_PRICING_ANNUAL[tier] / 12
          const displayPrice = isAnnual ? annualMonthly : monthlyPrice

          return (
            <Card
              key={tier}
              className={`relative ${
                currentTier === tier
                  ? 'border-primary ring-2 ring-primary/20'
                  : ''
              }`}
            >
              {currentTier === tier && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Atual
                </Badge>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  {getPlanIcon(tier)}
                </div>
                <CardTitle className="text-lg">{PLAN_NAMES[tier]}</CardTitle>
                <CardDescription>{PLAN_DESCRIPTIONS[tier]}</CardDescription>
              </CardHeader>

              <CardContent className="pb-3">
                <div className="flex items-baseline gap-1">
                  {isProWithCustom && !isAnnual && (
                    <span className="text-lg line-through text-muted-foreground mr-1">
                      R$ {PLAN_PRICING[tier].toFixed(2)}
                    </span>
                  )}
                  <span className="text-3xl font-bold">
                    R$ {displayPrice.toFixed(2)}
                  </span>
                  {tier !== SubscriptionTier.FREE && (
                    <span className="text-muted-foreground">/mês</span>
                  )}
                </div>
                {isProWithCustom && !isAnnual && (
                  <p className="text-xs text-green-500 font-medium mt-1">
                    Preço especial aplicado
                  </p>
                )}
                {isAnnual && tier !== SubscriptionTier.FREE && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cobrado R$ {(isProWithCustom ? customPricing! * 0.8 * 12 : PLAN_PRICING_ANNUAL[tier]).toFixed(2)}/ano
                  </p>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={currentTier === tier ? 'secondary' : 'default'}
                  disabled={processing !== null || currentTier === tier || tier === SubscriptionTier.FREE}
                  onClick={() => handleUpgrade(tier)}
                >
                  {getButtonText(tier)}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Tabela Comparativa */}
      <Card>
        <CardHeader>
          <CardTitle>Compare os Planos</CardTitle>
          <CardDescription>
            Veja todos os recursos disponíveis em cada plano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Recurso</th>
                  <th className="text-center py-3 px-4 font-medium">Gratuito</th>
                  <th className="text-center py-3 px-4 font-medium">Starter</th>
                  <th className="text-center py-3 px-4 font-medium">Pro</th>
                  <th className="text-center py-3 px-4 font-medium">Business</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-3 px-4">{feature.name}</td>
                    <td className="text-center py-3 px-4">
                      {renderFeatureValue(feature.free)}
                    </td>
                    <td className="text-center py-3 px-4">
                      {renderFeatureValue(feature.starter)}
                    </td>
                    <td className="text-center py-3 px-4">
                      {renderFeatureValue(feature.pro)}
                    </td>
                    <td className="text-center py-3 px-4">
                      {renderFeatureValue(feature.business)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            * Suporte via WhatsApp disponível por tempo limitado nos planos Gratuito e Starter.
          </p>
        </CardContent>
      </Card>

    </div>
  )
}

function renderFeatureValue(value: string | boolean) {
  if (value === true) {
    return <Check className="h-4 w-4 text-green-500 mx-auto" />
  }
  if (value === false) {
    return <X className="h-4 w-4 text-muted-foreground mx-auto" />
  }
  return <span className="text-muted-foreground">{value}</span>
}
