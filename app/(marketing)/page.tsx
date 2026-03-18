import { Metadata } from "next"
import Link from "next/link"
import { Hero } from "@/components/marketing/hero"
import { BentoGrid } from "@/components/marketing/bento-grid"
import { Logos } from "@/components/marketing/logos"
import dynamic from "next/dynamic"
import Script from "next/script"

const AgiPreview = dynamic(() => import("@/components/agi/AgiPreview").then(m => ({ default: m.AgiPreview })), {
  loading: () => <div className="h-96 rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse" />,
})

const StickyCTA = dynamic(() => import("@/components/marketing/sticky-cta").then(m => ({ default: m.StickyCTA })))
import { Check, Star, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: 'Sirius CRM | O CRM Inteligente para Vendedores Brasileiros',
  description: 'CRM gratuito com pipeline Kanban, WhatsApp integrado (Evolution API), IA comercial, prospecção Google Maps, automações de deals e email. 4 planos: Gratuito, Starter R$49, Pro R$97, Business R$149.',
  keywords: ['crm gratuito', 'crm brasil', 'pipeline kanban', 'whatsapp crm', 'ia comercial', 'prospecção leads', 'automação vendas'],
  alternates: { canonical: 'https://sirius.roilabs.com.br' },
  openGraph: {
    title: 'Sirius CRM | O CRM Inteligente para Vendedores Brasileiros',
    description: 'Pipeline visual, WhatsApp integrado, IA comercial, prospecção Google Maps e automações. Grátis para começar.',
    url: 'https://sirius.roilabs.com.br',
    images: [{ url: 'https://sirius.roilabs.com.br/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sirius CRM | O CRM Inteligente para Vendedores Brasileiros',
    description: 'Pipeline visual, WhatsApp integrado, IA comercial, prospecção Google Maps e automações. Grátis para começar.',
  },
}

export default function LandingPage() {
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Sirius CRM",
    "description": "CRM completo para vendas brasileiras com pipeline Kanban, WhatsApp integrado via Evolution API, AGI com IA comercial, prospecção Google Maps, automações de deals e email, analytics avançado e API pública.",
    "brand": {
      "@type": "Brand",
      "name": "ROI Labs"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "BRL",
      "lowPrice": "0",
      "highPrice": "149",
      "offerCount": "4",
      "availability": "https://schema.org/InStock",
      "url": "https://sirius.roilabs.com.br/pricing"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "12",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "author": { "@type": "Person", "name": "Carlos Silva" },
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
        "reviewBody": "Finalmente um CRM que não complica. Em 10 minutos já estava usando e fechando negócios mais rápido."
      },
      {
        "@type": "Review",
        "author": { "@type": "Person", "name": "Mariana Souza" },
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
        "reviewBody": "O WhatsApp integrado economiza horas por semana. Meu time adora a simplicidade!"
      }
    ],
    "image": "https://sirius.roilabs.com.br/og-image.png",
    "url": "https://sirius.roilabs.com.br"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "O que é o Sirius CRM?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sirius CRM é uma plataforma completa de vendas com pipeline Kanban, WhatsApp integrado via Evolution API, IA comercial (AGI Sirius), prospecção automática pelo Google Maps, automações de deals e email, analytics avançado e API pública. Feito para vendedores brasileiros."
        }
      },
      {
        "@type": "Question",
        "name": "O Sirius CRM é gratuito?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sim! O plano Gratuito inclui 100 contatos, 50 negócios e 1 pipeline sem prazo de expiração. Para mais recursos, oferecemos Starter (R$49/mês), Pro (R$97/mês) e Business (R$149/mês)."
        }
      },
      {
        "@type": "Question",
        "name": "Como funciona o WhatsApp integrado?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "O Sirius se conecta ao WhatsApp via Evolution API com pareamento por QR Code. Você envia e recebe mensagens direto do CRM, com inbox unificado, tags, respostas rápidas e atribuição de conversas por vendedor."
        }
      },
      {
        "@type": "Question",
        "name": "Como funciona a prospecção pelo Google Maps?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Busque leads por segmento e cidade. O Sirius extrai automaticamente nome, telefone, email, site e endereço do Google Maps. Cada plano inclui créditos mensais: Starter 50, Pro 200 e Business 1.000 leads/mês."
        }
      },
      {
        "@type": "Question",
        "name": "Posso cancelar quando quiser?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sim, sem multas ou taxas. Cancele a qualquer momento e mantenha acesso até o fim do período pago. Garantia de 7 dias em todos os planos pagos."
        }
      }
    ]
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "ROI Labs - Sirius CRM",
    "url": "https://sirius.roilabs.com.br",
    "logo": "https://sirius.roilabs.com.br/logo.png",
    "image": "https://sirius.roilabs.com.br/og-image.png",
    "description": "CRM completo com pipeline Kanban, WhatsApp integrado, IA comercial, prospecção Google Maps e automações para vendedores brasileiros",
    "telephone": "+55-62-98344-3919",
    "email": "roilabs.ia@gmail.com",
    "areaServed": { "@type": "Country", "name": "Brasil" },
    "address": { "@type": "PostalAddress", "addressCountry": "BR", "addressRegion": "GO" },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      }
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+55-62-98344-3919",
      "contactType": "customer support",
      "availableLanguage": "Portuguese",
      "areaServed": "BR"
    },
    "sameAs": [
      "https://www.linkedin.com/company/roilabs",
      "https://twitter.com/roilabs"
    ],
    "priceRange": "R$ 0 - R$ 149/mês"
  };

  const plans = [
    {
      name: 'Gratuito',
      price: 'R$ 0',
      period: '',
      description: 'Para testar o CRM',
      features: ['1 Usuário', '100 Contatos', '50 Negócios', '1 Pipeline'],
      highlighted: false,
    },
    {
      name: 'Starter',
      price: 'R$ 49',
      period: '/mês',
      description: 'Para pequenas empresas',
      features: ['3 Usuários', '500 Contatos', 'WhatsApp', '50 leads/mês'],
      highlighted: false,
    },
    {
      name: 'Pro',
      price: 'R$ 97',
      period: '/mês',
      description: 'Para equipes em crescimento',
      features: ['10 Usuários', '2.000 Contatos', 'IA Comercial', '200 leads/mês'],
      highlighted: true,
    },
    {
      name: 'Business',
      price: 'R$ 149',
      period: '/mês',
      description: 'Para grandes operações',
      features: ['50 Usuários', 'Ilimitado', 'Round-Robin', '1.000 leads/mês'],
      highlighted: false,
    },
  ]

  return (
    <>
      <Script
        id="product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="local-business-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30">

        {/* Background Gradient */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-transparent to-transparent opacity-50"></div>
        </div>

        <div className="relative z-10">
          <Hero />
          <Logos />

          {/* GEO Block */}
          <section className="py-16 sm:py-20 px-6 bg-background text-foreground">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                O que é o Sirius CRM?
              </h2>
              <p className="mt-6 text-lg leading-8 text-zinc-300">
                O Sirius CRM é uma plataforma de vendas projetada para o mercado brasileiro, utilizada por mais de 1.200 usuários. Oferece quatro planos de assinatura: um plano Gratuito, Starter por R$49, Pro por R$97 e Business por R$149, ajudando equipes a alcançar um aumento médio de 35% na conversão de leads. Seus diferenciais incluem a integração nativa com WhatsApp via Evolution API, prospecção de leads B2B pelo Google Maps e a assistente de vendas com IA, AGI Sirius.
              </p>
            </div>
          </section>

          <BentoGrid />

          {/* Founders Banner */}
          <section className="px-6 pb-12">
            <div className="mx-auto max-w-5xl">
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                    <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">Programa de Fundadores — 41% OFF vitalicio!</p>
                    <p className="text-sm text-amber-200/80">
                      Starter R$29 · Pro R$57 · Business R$88/mes para sempre. Vagas limitadas.
                    </p>
                  </div>
                </div>
                <Link
                  href="/fundadores"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-400 px-6 text-sm font-semibold text-black transition-colors shrink-0"
                >
                  <Star className="w-4 h-4 mr-2 fill-black" />
                  Ver oferta
                </Link>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="py-24 px-6">
            <div className="mx-auto max-w-7xl">
              <div className="mb-16 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">Times de alta performance confiam no Sirius</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">Veja como empresas reais aumentaram suas vendas</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Testimonial 1 */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      CS
                    </div>
                    <div>
                      <div className="font-semibold text-white">Carlos Silva</div>
                      <div className="text-sm text-zinc-500">CEO, TechFlow</div>
                    </div>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                    &quot;Finalmente um CRM que não complica. Em 10 minutos já estava usando e fechando negócios mais rápido. <span className="text-green-400 font-semibold">+40% de conversão</span> no primeiro mês.&quot;
                  </p>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                </div>

                {/* Testimonial 2 */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                      MS
                    </div>
                    <div>
                      <div className="font-semibold text-white">Mariana Souza</div>
                      <div className="text-sm text-zinc-500">Diretora Comercial, GrowHub</div>
                    </div>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                    &quot;O WhatsApp integrado economiza <span className="text-indigo-400 font-semibold">3 horas por semana</span> por vendedor. Meu time adora a simplicidade!&quot;
                  </p>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                </div>

                {/* Testimonial 3 */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center text-white font-bold">
                      RA
                    </div>
                    <div>
                      <div className="font-semibold text-white">Rafael Alves</div>
                      <div className="text-sm text-zinc-500">Head de Vendas, ScaleUp</div>
                    </div>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                    &quot;A prospecção pelo Google Maps e o analytics mostraram gargalos no primeiro dia. <span className="text-purple-400 font-semibold">Taxa de fechamento subiu 25%</span>.&quot;
                  </p>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* AGI Sirius Preview Section */}
          <section className="py-24 px-6">
            <div className="mx-auto max-w-6xl">
              <div className="mb-12 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-400 mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                  </span>
                  <span className="font-medium">AGI Sirius — IA Comercial</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                  Sua Consultora de Vendas com IA
                </h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">
                  Analisa deals, gera scripts de venda, enriquece contatos e recomenda próximas ações. Baseada em Knowledge Graph + RAG.
                </p>
              </div>

              <AgiPreview />
            </div>
          </section>

          {/* Plans Section */}
          <section className="py-24 px-6">
            <div className="mx-auto max-w-7xl">
              <div className="mb-16 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">Planos para cada momento</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">Comece grátis e escale conforme seu time cresce. Sem surpresas.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`relative rounded-2xl border p-6 flex flex-col ${
                      plan.highlighted
                        ? 'border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/20'
                        : 'border-white/10 bg-white/[0.02]'
                    }`}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <div className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1 text-xs font-semibold text-white">
                          Mais Popular
                        </div>
                      </div>
                    )}
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      <p className="text-sm text-zinc-500">{plan.description}</p>
                    </div>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      {plan.period && <span className="text-sm text-zinc-500">{plan.period}</span>}
                    </div>
                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.highlighted ? '/register' : '/pricing'}
                      className={`inline-flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors w-full ${
                        plan.highlighted
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          : 'border border-white/10 text-zinc-300 hover:bg-white/5'
                      }`}
                    >
                      {plan.price === 'R$ 0' ? 'Começar Grátis' : 'Ver detalhes'}
                    </Link>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/pricing"
                  className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Ver comparação completa entre planos
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* Footer CTA */}
          <section className="py-24 px-6 text-center">
            <div className="mx-auto max-w-2xl border border-white/10 bg-white/[0.02] rounded-3xl p-12 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-sm text-green-400 mb-6">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium">Junte-se a empresas que já organizam suas vendas com o Sirius</span>
                </div>

                <h2 className="text-3xl font-bold text-white mb-4">Comece a vender mais hoje</h2>
                <p className="text-zinc-400 mb-8 max-w-lg mx-auto">Configure em 5 minutos. Sem cartão de crédito. Sem compromisso. Cancele quando quiser.</p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
                  <a href="/register" className="inline-flex h-12 items-center justify-center rounded-lg bg-indigo-600 px-8 text-base font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                    Criar Conta Grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                  <a href="/pricing" className="inline-flex h-12 items-center justify-center rounded-lg border border-white/10 bg-transparent px-8 text-base font-medium text-white hover:bg-white/5 transition-colors">
                    Ver Planos
                  </a>
                </div>

                <div className="flex items-center justify-center gap-6 text-sm text-zinc-500">
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Grátis para sempre
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Suporte em português
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <StickyCTA />
      </div>
    </>
  )
}
