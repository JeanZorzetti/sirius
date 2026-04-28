'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Users, Gift, TrendingDown, ArrowRight, Check, Star, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

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

const faqs = [
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
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
}

export function IndiqueClient() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">

      {/* Hero */}
      <section className="relative py-32 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 w-full max-w-4xl -translate-x-1/2 h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50 dark:opacity-30" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative mx-auto max-w-5xl text-center z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary font-medium text-sm backdrop-blur-md shadow-[0_0_20px_rgba(var(--primary),0.2)]">
              <Sparkles className="w-4 h-4" />
              <span>Programa de Indicação Sirius</span>
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-[5rem] leading-[1.1]"
          >
            Indique. Ganhe.<br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-600">
              {' '}Zere a mensalidade.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Cada amigo que você indica e assina o Sirius vale <strong className="text-foreground font-semibold">15% de desconto recorrente</strong> na sua mensalidade.
            Com 7 indicações ativas, você usa o CRM de graça — para sempre.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button asChild size="lg" className="h-14 px-8 rounded-full text-base font-semibold shadow-xl shadow-primary/25 transition-transform hover:-translate-y-1">
              <Link href="/dashboard/billing">
                Acessar meu link de indicação
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-full text-base font-semibold border-border/50 bg-background/50 backdrop-blur-md hover:bg-muted transition-transform hover:-translate-y-1">
              <Link href="/register">
                Criar conta grátis
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="relative px-6 -mt-10 z-20">
        <div className="mx-auto max-w-5xl">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { value: '+15%', label: 'de desconto por indicação ativa', icon: TrendingDown },
              { value: '20%', label: 'off para quem você indicar (3 meses)', icon: Gift },
              { value: '7', label: 'indicações para zerar sua mensalidade', icon: Users }
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Card className="bg-background/60 backdrop-blur-xl border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-8 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="text-4xl font-black text-foreground mb-2 tracking-tight">{stat.value}</div>
                    <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Como funciona</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Um processo simples, transparente e 100% automático para você e seus indicados.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connection Line (Desktop only) */}
            <div className="hidden lg:block absolute top-[44px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-border to-transparent z-0" />
            
            {steps.map((step, idx) => (
              <motion.div 
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative z-10"
              >
                <div className="flex flex-col items-center text-center group">
                  <div className="w-24 h-24 rounded-3xl bg-background border border-border shadow-sm flex items-center justify-center mb-6 relative overflow-hidden transition-transform duration-300 group-hover:scale-110 group-hover:shadow-primary/20 group-hover:shadow-xl group-hover:border-primary/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground to-muted-foreground">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards table */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/30" />
        <div className="relative mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">A matemática ao seu favor</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Seu desconto é cumulativo. Veja como sua mensalidade diminui a cada indicação ativa.
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/50">
                    <th className="text-left py-5 px-6 font-semibold text-foreground">Indicações ativas</th>
                    <th className="text-center py-5 px-6 font-semibold text-foreground">Seu Desconto</th>
                    <th className="text-center py-5 px-6 font-semibold text-foreground">Starter</th>
                    <th className="text-center py-5 px-6 font-semibold text-foreground">Pro</th>
                    <th className="text-center py-5 px-6 font-semibold text-foreground">Business</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-muted-foreground font-medium">0 (preço cheio)</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">—</td>
                    <td className="py-4 px-6 text-center font-medium">R$67</td>
                    <td className="py-4 px-6 text-center font-medium">R$147</td>
                    <td className="py-4 px-6 text-center font-medium">R$397</td>
                  </tr>
                  {rewards.map((row) => (
                    <tr
                      key={row.referrals}
                      className={`transition-colors hover:bg-muted/50 ${row.referrals === 7 ? 'bg-primary/5 hover:bg-primary/10' : ''}`}
                    >
                      <td className="py-4 px-6 flex items-center gap-3 font-medium">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${row.referrals === 7 ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                          <Users className="w-4 h-4" />
                        </div>
                        <span className={row.referrals === 7 ? 'text-primary font-bold' : ''}>
                          {row.referrals} indicaç{row.referrals === 1 ? 'ão' : 'ões'}
                        </span>
                        {row.referrals === 7 && (
                          <Badge className="ml-2 bg-primary text-primary-foreground animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.5)]">Grátis!</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-primary text-base">
                        {row.discount}%
                      </td>
                      <td className="py-4 px-6 text-center">
                        {row.monthly.starter === 0 ? (
                          <span className="font-bold text-primary">R$0</span>
                        ) : (
                          <span className="text-muted-foreground">R${row.monthly.starter.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {row.monthly.pro === 0 ? (
                          <span className="font-bold text-primary">R$0</span>
                        ) : (
                          <span className="text-muted-foreground">R${row.monthly.pro.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {row.monthly.business === 0 ? (
                          <span className="font-bold text-primary">R$0</span>
                        ) : (
                          <span className="text-muted-foreground">R${row.monthly.business.toFixed(2)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
          <p className="mt-6 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            O desconto permanece ativo enquanto a indicação mantiver a assinatura paga.
          </p>
        </div>
      </section>

      {/* Indicado benefits */}
      <section className="py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold tracking-tight mb-6">Quem você indica<br/>também sai ganhando</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Seu link não é apenas um convite — é um benefício exclusivo. Quem se cadastra através da sua indicação recebe <strong className="text-foreground font-semibold bg-primary/10 px-2 py-0.5 rounded text-primary">20% de desconto nos 3 primeiros meses</strong> do plano pago.
              </p>
              
              <div className="space-y-4">
                {[
                  { plan: 'Starter', price: 'R$67', discounted: 'R$53,60/mês' },
                  { plan: 'Pro', price: 'R$147', discounted: 'R$117,60/mês' },
                  { plan: 'Business', price: 'R$397', discounted: 'R$317,60/mês' },
                ].map((item) => (
                  <div key={item.plan} className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <div className="font-semibold">{item.plan}</div>
                      <div className="text-sm text-muted-foreground">
                        De <span className="line-through">{item.price}</span> por <span className="text-foreground font-medium">{item.discounted}</span> (3 meses)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-background shadow-2xl relative overflow-hidden rounded-3xl">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <TrendingDown className="w-32 h-32" />
                </div>
                <CardHeader className="pb-4 relative z-10">
                  <Badge variant="outline" className="w-fit mb-4 bg-background/50 backdrop-blur-sm border-primary/20 text-primary">Cenário de Exemplo</Badge>
                  <CardTitle className="text-2xl">Economia na Prática</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="p-5 rounded-2xl bg-background/60 backdrop-blur-md border border-border/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground font-medium">Seu Plano Atual</span>
                      <Badge variant="secondary">Pro (R$147)</Badge>
                    </div>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-muted-foreground font-medium">Suas Indicações Ativas</span>
                      <span className="font-bold text-lg">3 parceiros</span>
                    </div>
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent mb-6" />
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">Nova Mensalidade</span>
                      <div className="text-right">
                        <div className="text-3xl font-black text-primary">R$80,85</div>
                        <div className="text-sm text-green-500 font-medium mt-1">−45% de desconto eterno*</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    * O desconto de 45% se mantém ativo enquanto os 3 indicados continuarem com a assinatura paga.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 px-6 relative bg-muted/20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">FAQ</Badge>
            <h2 className="text-4xl font-bold tracking-tight">Perguntas Frequentes</h2>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border border-border/50 rounded-xl px-6 bg-background hover:bg-muted/30 transition-colors data-[state=open]:bg-muted/30">
                  <AccordionTrigger className="text-left font-semibold py-5 hover:no-underline text-base">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed text-base">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="relative mx-auto max-w-3xl text-center z-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30"
          >
            <Star className="w-10 h-10 text-white fill-white/20" />
          </motion.div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">Pronto para zerar sua assinatura?</h2>
          <p className="text-xl text-muted-foreground mb-12">
            Faça login para copiar seu link exclusivo e começar a acumular descontos hoje mesmo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="h-14 px-8 rounded-full text-base font-semibold shadow-xl shadow-primary/25 transition-transform hover:-translate-y-1">
              <Link href="/dashboard/billing">
                Pegar meu link agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-full text-base font-semibold border-border/50 bg-background/50 backdrop-blur-md hover:bg-muted transition-transform hover:-translate-y-1">
              <Link href="/register">
                Criar conta grátis
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
