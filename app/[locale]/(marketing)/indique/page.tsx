import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Zap, Gift, TrendingDown, ArrowRight, Check, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Programa de Indicação | Sirius CRM — Indique e Ganhe',
  description: 'Indique amigos e ganhe até 100% de desconto recorrente na sua mensalidade. Cada indicação ativa = 15% off. 7 indicações = mensalidade zerada.',
}

const steps = [
  {
    number: '01',
    title: 'Copie seu link',
    description: 'Acesse o dashboard e copie seu link exclusivo de indicação em Assinatura & Faturamento.',
  },
  {
    number: '02',
    title: 'Compartilhe',
    description: 'Envie para amigos, equipes de vendas, parceiros — qualquer empresa que precise de um CRM.',
  },
  {
    number: '03',
    title: 'Eles assinem',
    description: 'Quando seu indicado fechar qualquer plano pago, os descontos são ativados automaticamente.',
  },
  {
    number: '04',
    title: 'Vocês ganham',
    description: 'Seu indicado ganha 20% off por 3 meses. Você acumula +15% de desconto recorrente.',
  },
]

const rewards = [
  { referrals: 1, discount: 15, monthly: { starter: 56.95, pro: 124.95, business: 337.45 } },
  { referrals: 2, discount: 30, monthly: { starter: 46.90, pro: 102.90, business: 277.90 } },
  { referrals: 3, discount: 45, monthly: { starter: 36.85, pro: 80.85, business: 218.35 } },
  { referrals: 4, discount: 60, monthly: { starter: 26.80, pro: 58.80, business: 158.80 } },
  { referrals: 5, discount: 75, monthly: { starter: 16.75, pro: 36.75, business: 99.25 } },
  { referrals: 6, discount: 90, monthly: { starter: 6.70, pro: 14.70, business: 39.70 } },
  { referrals: 7, discount: 100, monthly: { starter: 0, pro: 0, business: 0 } },
]

export default function IndiquePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="mb-6 text-primary border-primary/30">
            <Gift className="w-3.5 h-3.5 mr-1.5" />
            Programa de Indicação
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Indique. Ganhe.{' '}
            <span className="text-primary">Zere a mensalidade.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Cada amigo que você indica e assina o Sirius vale <strong className="text-foreground">15% de desconto recorrente</strong> na sua mensalidade.
            Com 7 indicações ativas, você usa o Sirius de graça — para sempre.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="h-12 px-8">
              <Link href="/login">
                Acessar meu link de indicação
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8">
              <Link href="/register">
                Criar conta grátis
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="py-16 px-6 border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary">+15%</div>
            <div className="mt-2 text-sm text-muted-foreground">de desconto por indicação ativa</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary">20%</div>
            <div className="mt-2 text-sm text-muted-foreground">off para quem você indicar (3 meses)</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary">7</div>
            <div className="mt-2 text-sm text-muted-foreground">indicações para zerar sua mensalidade</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Como funciona</h2>
            <p className="mt-4 text-muted-foreground">Simples, transparente e automático.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">{step.number}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards table */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Quanto você economiza</h2>
            <p className="mt-4 text-muted-foreground">Desconto acumulativo — quanto mais indicações ativas, menor a sua mensalidade.</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Indicações ativas</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Desconto</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Starter</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Pro</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Business</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-3 px-4 text-muted-foreground">0 (preço cheio)</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">—</td>
                  <td className="py-3 px-4 text-center">R$67</td>
                  <td className="py-3 px-4 text-center">R$147</td>
                  <td className="py-3 px-4 text-center">R$397</td>
                </tr>
                {rewards.map((row) => (
                  <tr
                    key={row.referrals}
                    className={`border-b border-border/50 ${row.referrals === 7 ? 'bg-primary/5' : ''}`}
                  >
                    <td className="py-3 px-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary shrink-0" />
                      {row.referrals} indicaç{row.referrals === 1 ? 'ão' : 'ões'}
                      {row.referrals === 7 && (
                        <Badge className="ml-1 text-xs bg-primary text-primary-foreground">Grátis!</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-primary">{row.discount}%</td>
                    <td className="py-3 px-4 text-center">
                      {row.monthly.starter === 0 ? (
                        <span className="font-bold text-primary">R$0</span>
                      ) : (
                        `R$${row.monthly.starter.toFixed(2)}`
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.monthly.pro === 0 ? (
                        <span className="font-bold text-primary">R$0</span>
                      ) : (
                        `R$${row.monthly.pro.toFixed(2)}`
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.monthly.business === 0 ? (
                        <span className="font-bold text-primary">R$0</span>
                      ) : (
                        `R$${row.monthly.business.toFixed(2)}`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground text-center">
            O desconto permanece ativo enquanto a indicação mantiver assinatura paga. Cancelamentos removem o crédito correspondente.
          </p>
        </div>
      </section>

      {/* Indicado benefits */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Quem você indica também ganha</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Seu link não é só um convite — é um benefício real. Quem acessar pelo seu link recebe <strong className="text-foreground">20% de desconto por 3 meses</strong> no primeiro plano pago.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Starter: R$67 → R$53,60/mês nos primeiros 3 meses',
                  'Pro: R$147 → R$117,60/mês nos primeiros 3 meses',
                  'Business: R$397 → R$317,60/mês nos primeiros 3 meses',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-primary" />
                  Exemplo real
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Você (Pro R$147)</span>
                  <span className="font-medium">3 indicações ativas</span>
                </div>
                <div className="flex justify-between text-primary font-semibold text-base">
                  <span>Sua mensalidade</span>
                  <span>R$102,90 <span className="text-xs font-normal text-muted-foreground">(−45%)</span></span>
                </div>
                <div className="border-t border-border/50 pt-4 flex justify-between">
                  <span className="text-muted-foreground">Cada indicado (Pro)</span>
                  <span className="font-medium">R$117,60 por 3 meses</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Perguntas frequentes</h2>
          <div className="space-y-6">
            {[
              {
                q: 'O desconto é realmente recorrente?',
                a: 'Sim. Enquanto seu indicado mantiver a assinatura ativa, você continua recebendo os 15% de desconto todo mês — não é um benefício único.',
              },
              {
                q: 'O que acontece se o indicado cancelar?',
                a: 'Se um indicado cancelar, os 15% correspondentes a ele são removidos do seu desconto acumulado. Os outros permanecem.',
              },
              {
                q: 'Tem limite de indicações?',
                a: 'Não! Você pode indicar quantas pessoas quiser. O desconto acumula até 100% — a partir daí sua mensalidade é zerada e permanece assim enquanto as indicações estiverem ativas.',
              },
              {
                q: 'O desconto dos 20% para o indicado se aplica a qualquer plano?',
                a: 'Sim, para qualquer plano pago (Starter, Pro ou Business). O desconto de 20% é aplicado nos primeiros 3 meses da assinatura.',
              },
              {
                q: 'Quando o desconto é ativado?',
                a: 'Automaticamente assim que o pagamento do indicado for confirmado. Você recebe uma notificação e o desconto aparece na próxima fatura.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-border/50 pb-6 last:border-0">
                <h3 className="font-semibold">{q}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Star className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Pronto para começar?</h2>
          <p className="mt-4 text-muted-foreground">
            Faça login para copiar seu link exclusivo e começar a acumular descontos hoje.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="h-12 px-8">
              <Link href="/login">
                Acessar meu link
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-8">
              <Link href="/register">
                Criar conta grátis (7 dias PRO)
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
