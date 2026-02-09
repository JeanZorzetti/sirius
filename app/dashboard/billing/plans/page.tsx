'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X, Loader2, Sparkles, Zap, Building2, Crown } from 'lucide-react'
import { toast } from 'sonner'
import { PLAN_LIMITS, PLAN_PRICING, PLAN_NAMES, PLAN_DESCRIPTIONS } from '@/lib/entitlements'
import { SubscriptionTier } from '@prisma/client'

interface PlanFeature {
  name: string
  free: string | boolean
  starter: string | boolean
  pro: string | boolean
  business: string | boolean
}

const features: PlanFeature[] = [
  { name: 'Contatos', free: '100', starter: '500', pro: '2.000', business: 'Ilimitado' },
  { name: 'Negócios (Deals)', free: '50', starter: '200', pro: '1.000', business: 'Ilimitado' },
  { name: 'Pipelines', free: '1', starter: '3', pro: '10', business: '50' },
  { name: 'Usuários', free: '1', starter: '3', pro: '10', business: '50' },
  { name: 'Prospecção mensal', free: false, starter: '50 leads', pro: '200 leads', business: '1.000 leads' },
  { name: 'WhatsApp', free: false, starter: '1 instância', pro: '1 instância', business: '5 instâncias' },
  { name: 'Automações de Email', free: false, starter: '3', pro: '10', business: '50' },
  { name: 'Integrações', free: false, starter: 'Básicas', pro: 'Avançadas', business: 'Todas' },
  { name: 'Analytics Avançado', free: false, starter: false, pro: true, business: true },
  { name: 'Relatórios Customizados', free: false, starter: false, pro: false, business: true },
  { name: 'Distribuição Round-Robin', free: false, starter: false, pro: false, business: true },
  { name: 'Suporte', free: 'Comunidade', starter: 'Email', pro: 'Prioritário', business: 'Dedicado' },
]

export default function PlansPage() {
  const router = useRouter()
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<SubscriptionTier | null>(null)

  useEffect(() => {
    fetchCurrentPlan()
  }, [])

  const fetchCurrentPlan = async () => {
    try {
      const res = await fetch('/api/entitlements')
      if (res.ok) {
        const data = await res.json()
        setCurrentTier(data.tier)
      }
    } catch (error) {
      console.error('Error fetching plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === currentTier) return
    
    setProcessing(tier)
    
    try {
      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      const data = await res.json()

      if (data.url) {
        // Redirecionar para checkout do Stripe
        window.location.href = data.url
      } else if (data.success) {
        toast.success('Plano atualizado com sucesso!')
        router.refresh()
      } else {
        toast.error(data.error || 'Erro ao processar upgrade')
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

  const getButtonText = (tier: SubscriptionTier) => {
    if (processing === tier) return <Loader2 className="h-4 w-4 animate-spin" />
    if (tier === currentTier) return 'Plano Atual'
    if (tier === SubscriptionTier.FREE) return 'Usar Grátis'
    return 'Escolher Plano'
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

      {/* Cards dos Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.values(SubscriptionTier).map((tier) => (
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
                <span className="text-3xl font-bold">
                  R$ {PLAN_PRICING[tier].toFixed(2)}
                </span>
                {tier !== SubscriptionTier.FREE && (
                  <span className="text-muted-foreground">/mês</span>
                )}
              </div>
            </CardContent>
            
            <CardFooter>
              <Button
                className="w-full"
                variant={currentTier === tier ? 'secondary' : 'default'}
                disabled={processing !== null || currentTier === tier}
                onClick={() => handleUpgrade(tier)}
              >
                {getButtonText(tier)}
              </Button>
            </CardFooter>
          </Card>
        ))}
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
        </CardContent>
      </Card>

      {/* Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle>Add-ons Disponíveis</CardTitle>
          <CardDescription>
            Amplie seu plano com créditos extras e recursos adicionais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">+100 Leads</CardTitle>
                <CardDescription>Pacote de prospecção</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <span className="text-2xl font-bold">R$ 29,90</span>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/billing/addons')}>
                  Comprar
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">+500 Leads</CardTitle>
                <CardDescription>Pacote de prospecção</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <span className="text-2xl font-bold">R$ 99,90</span>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/billing/addons')}>
                  Comprar
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">WhatsApp Extra</CardTitle>
                <CardDescription>Instância adicional</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <span className="text-2xl font-bold">R$ 29,90</span>
                <span className="text-muted-foreground">/mês</span>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/billing/addons')}>
                  Assinar
                </Button>
              </CardFooter>
            </Card>
          </div>
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
