import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Check, Star, Zap, Shield, Users, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FounderCheckoutButton } from './founder-checkout-button'

export const metadata: Metadata = {
  title: 'Programa de Fundadores | Sirius CRM — R$29/mês para sempre',
  description: 'Seja um dos 100 clientes fundadores do Sirius CRM. R$29/mês vitalício (vs R$49 regular). Plano PRO completo + badge exclusivo + acesso antecipado a novas features.',
  alternates: { canonical: 'https://sirius.roilabs.com.br/fundadores' },
  openGraph: {
    title: 'Programa de Fundadores | Sirius CRM — R$29/mês para sempre',
    description: 'Seja um dos 100 fundadores. R$29/mês vitalício com todo o plano PRO incluso.',
    url: 'https://sirius.roilabs.com.br/fundadores',
    images: [{
      url: 'https://sirius.roilabs.com.br/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Sirius CRM — Programa de Fundadores',
    }],
  },
}

export const dynamic = 'force-dynamic'

const FOUNDER_LIMIT = 100
const FOUNDER_PRICE = 29
const REGULAR_PRICE = 49

const FOUNDER_PERKS = [
  { icon: Zap, text: 'Plano PRO completo por R$29/mês para sempre (40% off vitalício)' },
  { icon: Star, text: 'Badge exclusivo "Fundador #N" no seu dashboard' },
  { icon: Users, text: 'Acesso antecipado a todas as novas funcionalidades' },
  { icon: Shield, text: 'Preço nunca aumenta — mesmo quando o PRO subir de preço' },
  { icon: Clock, text: 'Canal direto com os fundadores da ROI Labs no WhatsApp' },
]

const PRO_FEATURES = [
  'Pipeline visual Kanban ilimitado',
  'Contatos e negócios ilimitados',
  'Automações de negócios (triggers + ações)',
  'Integração WhatsApp via Evolution API',
  'AGI Sirius — assistente comercial com IA',
  'Relatórios e analytics avançados',
  'Webhooks + integração N8N/Zapier',
  'API pública completa',
  'Suporte prioritário via WhatsApp',
  'Importação CSV/Excel de contatos',
]

export default async function FundadoresPage() {
  // Count current founders
  const foundersCount = await prisma.organization.count({
    where: { isFounder: true }
  })

  const spotsLeft = FOUNDER_LIMIT - foundersCount
  const spotsUsed = foundersCount
  const percentFilled = Math.round((spotsUsed / FOUNDER_LIMIT) * 100)
  const isSoldOut = spotsLeft <= 0

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5 border-b">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            Programa de Fundadores — Vagas Limitadas
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Seja um dos{' '}
            <span className="text-primary">{FOUNDER_LIMIT} Fundadores</span>
            {' '}do Sirius CRM
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Acesso ao <strong>Plano PRO completo</strong> por{' '}
            <strong className="text-primary">R${FOUNDER_PRICE}/mês para sempre</strong>{' '}
            — 40% de desconto vitalício em relação ao preço regular (R${REGULAR_PRICE}/mês).
          </p>

          {/* Counter */}
          <div className="bg-card border rounded-2xl p-6 max-w-md mx-auto mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Vagas preenchidas</span>
              <span className="text-sm font-bold">
                {spotsUsed}/{FOUNDER_LIMIT}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 mb-3">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${Math.max(percentFilled, 3)}%` }}
              />
            </div>
            <p className="text-center font-semibold">
              {isSoldOut ? (
                <span className="text-red-600">Todas as vagas preenchidas!</span>
              ) : (
                <span className="text-amber-600">
                  Apenas <strong>{spotsLeft} vagas restantes</strong>
                </span>
              )}
            </p>
          </div>

          {/* CTA */}
          {!isSoldOut && (
            <FounderCheckoutButton spotsLeft={spotsLeft} />
          )}

          {isSoldOut && (
            <div className="space-y-4">
              <p className="text-muted-foreground">O programa de fundadores está encerrado.</p>
              <Button asChild size="lg">
                <Link href="/pricing">Ver Planos Regulares</Link>
              </Button>
            </div>
          )}

          <p className="mt-4 text-sm text-muted-foreground">
            Pagamento seguro via Mercado Pago · PIX, cartão ou boleto · Cancele a qualquer momento
          </p>
        </div>
      </section>

      {/* What you get */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">O que você ganha como Fundador</h2>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Perks */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-4">Benefícios exclusivos do Fundador:</h3>
            {FOUNDER_PERKS.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {/* PRO Features */}
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-4">Tudo do Plano PRO incluso:</h3>
            <ul className="space-y-2">
              {PRO_FEATURES.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Price comparison */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-6">Comparação de Preço</h3>
          <div className="grid grid-cols-2 gap-8 max-w-sm mx-auto">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Preço Regular</p>
              <p className="text-3xl font-bold line-through text-muted-foreground">R${REGULAR_PRICE}</p>
              <p className="text-sm text-muted-foreground">/mês</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-primary mb-1">Preço Fundador</p>
              <p className="text-3xl font-bold text-primary">R${FOUNDER_PRICE}</p>
              <p className="text-sm text-muted-foreground">/mês <strong>para sempre</strong></p>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Economia de <strong>R${(REGULAR_PRICE - FOUNDER_PRICE) * 12}/ano</strong>.
            Em 3 anos: <strong>R${(REGULAR_PRICE - FOUNDER_PRICE) * 36} economizados</strong>.
          </p>
          {!isSoldOut && (
            <div className="mt-6">
              <FounderCheckoutButton spotsLeft={spotsLeft} />
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-muted/30">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center mb-10">Perguntas Frequentes</h2>
          <div className="space-y-6">
            {[
              {
                q: 'O preço de R$29/mês é realmente para sempre?',
                a: 'Sim. Como Fundador, seu preço nunca muda — independente do quanto o plano PRO custe no futuro. Esse desconto é vitalício e está garantido contratualmente.'
              },
              {
                q: 'Posso cancelar a qualquer momento?',
                a: 'Sim. Não há fidelidade ou multa. Se cancelar, pode re-assinar, mas ao preço regular do momento (provavelmente mais caro).'
              },
              {
                q: 'O que acontece depois das 100 vagas?',
                a: 'O programa encerra e o preço volta para R$49/mês. Não haverá exceções após o encerramento.'
              },
              {
                q: 'Tenho acesso imediato?',
                a: 'Sim. Após o pagamento ser aprovado, sua conta é atualizada para PRO instantaneamente.'
              },
              {
                q: 'Posso pagar com PIX?',
                a: 'Sim. Aceitamos PIX, cartão de crédito (até 12x) e boleto bancário via Mercado Pago.'
              }
            ].map(({ q, a }, i) => (
              <div key={i} className="bg-card border rounded-lg p-5">
                <p className="font-semibold mb-2">{q}</p>
                <p className="text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
