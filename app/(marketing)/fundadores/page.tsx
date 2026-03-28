import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Check, Star, Zap, Shield, Users, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FounderCheckoutButton } from './founder-checkout-button'

export const metadata: Metadata = {
  title: 'Programa de Fundadores | Sirius CRM — 42% OFF vitalício',
  description: 'Seja um dos fundadores do Sirius CRM. Starter R$39, Pro R$87 ou Business R$234/mês para sempre. Até 42% de desconto vitalício em qualquer plano.',
  alternates: { canonical: 'https://sirius.roilabs.com.br/fundadores' },
  openGraph: {
    title: 'Programa de Fundadores | Sirius CRM — 42% OFF vitalício',
    description: 'Starter R$39, Pro R$87 ou Business R$234/mês para sempre. Vagas limitadas.',
    url: 'https://sirius.roilabs.com.br/fundadores',
    images: [{ url: 'https://sirius.roilabs.com.br/og-image.png', width: 1200, height: 630 }],
  },
}

export const dynamic = 'force-dynamic'

const FOUNDER_TIERS = [
  {
    plan: 'FOUNDER_STARTER' as const,
    name: 'Fundador Starter',
    regularPrice: 67,
    founderPrice: 39,
    limit: 100,
    highlight: false,
    color: 'border-muted',
    features: [
      '1.000 Contatos',
      '500 Negócios ativos',
      '5 Pipelines Kanban',
      'Até 5 usuários',
      '1 instância WhatsApp',
      '75 créditos de prospecção/mês',
      '1 Agente IA autônomo',
      '200 ações autônomas/mês',
      'Suporte por e-mail',
    ],
  },
  {
    plan: 'FOUNDER_PRO' as const,
    name: 'Fundador Pro',
    regularPrice: 147,
    founderPrice: 87,
    limit: 50,
    highlight: true,
    color: 'border-primary ring-2 ring-primary/20 shadow-lg scale-105 z-10',
    features: [
      '5.000 Contatos',
      '2.500 Negócios ativos',
      '15 Pipelines Kanban',
      'Até 15 usuários',
      '3 instâncias WhatsApp',
      '300 créditos de prospecção/mês',
      '3 Agentes IA autônomos',
      '1.000 ações autônomas/mês',
      'Webhooks + API pública',
      'Analytics avançado',
      'Suporte prioritário',
    ],
  },
  {
    plan: 'FOUNDER_BUSINESS' as const,
    name: 'Fundador Business',
    regularPrice: 397,
    founderPrice: 234,
    limit: 25,
    highlight: false,
    color: 'border-muted',
    features: [
      'Contatos Ilimitados',
      'Negócios Ilimitados',
      '50 Pipelines Kanban',
      'Até 50 usuários',
      '5 instâncias WhatsApp',
      '1.500 créditos de prospecção/mês',
      '5 Agentes IA autônomos',
      '3.000 ações autônomas/mês',
      'Round-Robin de leads',
      'Relatórios personalizados',
      'SSO & Audit Log',
      'Gerente de conta dedicado',
    ],
  },
]

const FOUNDER_PERKS = [
  { icon: Star,   text: 'Badge exclusivo "Fundador #N" no dashboard' },
  { icon: Shield, text: 'Preço nunca aumenta — garantido para sempre' },
  { icon: Users,  text: 'Acesso antecipado a todas as novas funcionalidades' },
  { icon: Clock,  text: 'Canal direto com os fundadores da ROI Labs no WhatsApp' },
  { icon: Zap,    text: 'Prioridade máxima no roadmap e feature requests' },
]

export default async function FundadoresPage() {
  // Contar vagas preenchidas por tier
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

  const anyPlanOpen = FOUNDER_TIERS.some(t => spotsByPlan[t.plan] < t.limit)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-background to-primary/5 border-b">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            Programa de Fundadores — Vagas Limitadas
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Seja Fundador do Sirius CRM
          </h1>

          <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            <strong className="text-foreground">Até 42% de desconto vitalício</strong> em qualquer plano.
            Seu preço nunca muda — mesmo quando os planos subirem.
          </p>

          <p className="text-sm text-muted-foreground">
            {totalFounders} pessoas já garantiram seu desconto vitalício · Vagas esgotando rapidamente
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

            return (
              <div
                key={tier.plan}
                className={`relative bg-card border rounded-2xl flex flex-col ${tier.color}`}
              >
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="rounded-full bg-gradient-to-r from-primary to-purple-600 px-4 py-1 text-xs font-bold text-white shadow-lg whitespace-nowrap">
                      ⚡ Mais Popular
                    </div>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Header */}
                  <div className="mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                      {tier.name}
                    </h2>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">R${tier.founderPrice}</span>
                      <span className="text-sm text-muted-foreground">/mês para sempre</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm line-through text-muted-foreground">R${tier.regularPrice}/mês</span>
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        ~41% OFF vitalício
                      </span>
                    </div>
                  </div>

                  {/* Spots bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Vagas preenchidas</span>
                      <span className="font-semibold">{filled}/{tier.limit}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${isSoldOut ? 'bg-red-400' : 'bg-primary'}`}
                        style={{ width: `${Math.max(percentFilled, 2)}%` }}
                      />
                    </div>
                    <p className={`text-xs mt-1 font-medium ${isSoldOut ? 'text-red-500' : 'text-amber-600'}`}>
                      {isSoldOut ? 'Esgotado' : `${spotsLeft} vagas restantes`}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isSoldOut ? (
                    <Button className="w-full" variant="outline" disabled>Esgotado</Button>
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

        <p className="text-center text-sm text-muted-foreground mt-6">
          Pagamento seguro via Mercado Pago · PIX, cartão (12x) ou boleto · Cancele a qualquer momento
        </p>
      </section>

      {/* Perks */}
      <section className="border-t bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">Benefícios exclusivos do Fundador</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FOUNDER_PERKS.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3 bg-card border rounded-lg p-4">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Price comparison table */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Comparação de Preço</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">Plano</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Preço Regular</th>
                <th className="text-center py-3 px-4 font-semibold text-primary">Preço Fundador</th>
                <th className="text-center py-3 px-4 font-semibold text-green-600">Economia/ano</th>
              </tr>
            </thead>
            <tbody>
              {FOUNDER_TIERS.map((tier) => (
                <tr key={tier.plan} className={`border-b ${tier.highlight ? 'bg-primary/5' : ''}`}>
                  <td className="py-3 px-4 font-medium">{tier.name.replace('Fundador ', '')}</td>
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
          <h2 className="text-2xl font-bold text-center mb-10">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {[
              {
                q: 'O desconto é realmente para sempre?',
                a: 'Sim. Como Fundador, seu preço nunca muda — independente do quanto o plano suba no futuro. O desconto vitalício é garantido contratualmente.'
              },
              {
                q: 'Posso mudar de plano fundador depois?',
                a: 'Não é possível fazer downgrade após a compra, mas você pode fazer upgrade para um tier fundador superior enquanto ainda tiver vagas disponíveis.'
              },
              {
                q: 'O que acontece quando as vagas esgotam?',
                a: 'O programa encerra para aquele tier e o preço volta ao regular. Não haverá exceções após o encerramento.'
              },
              {
                q: 'Tenho acesso imediato?',
                a: 'Sim. Após o pagamento ser aprovado, sua conta é atualizada instantaneamente e você recebe o badge de Fundador.'
              },
              {
                q: 'Posso cancelar quando quiser?',
                a: 'Sim, sem multas ou fidelidade. Se cancelar e quiser retornar, o preço será o regular vigente naquele momento.'
              }
            ].map(({ q, a }, i) => (
              <div key={i} className="bg-card border rounded-lg p-5">
                <p className="font-semibold mb-2">{q}</p>
                <p className="text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>

          {anyPlanOpen && (
            <div className="mt-10 text-center">
              <p className="text-muted-foreground mb-4">Ainda em dúvida? Vagas são limitadas.</p>
              <Button asChild size="lg" variant="default">
                <a href="/fundadores">Ver planos disponíveis</a>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
