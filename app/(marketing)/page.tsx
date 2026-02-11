import { Hero } from "@/components/marketing/hero"
import { BentoGrid } from "@/components/marketing/bento-grid"
import { Logos } from "@/components/marketing/logos"
import { StickyCTA } from "@/components/marketing/sticky-cta"
import { AgiPreview } from "@/components/agi/AgiPreview"
import Script from "next/script"

export default function LandingPage() {
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Sirius CRM",
    "description": "CRM intuitivo para gestão de vendas brasileiras com pipeline Kanban visual, gestão de contatos, WhatsApp integrado e métricas em tempo real.",
    "brand": {
      "@type": "Brand",
      "name": "ROI Labs"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "BRL",
      "availability": "https://schema.org/InStock",
      "url": "https://sirius.roilabs.com.br/register",
      "priceValidUntil": "2026-12-31",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "BRL"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "BR"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 0,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 0,
            "unitCode": "DAY"
          }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "BR",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "12",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Carlos Silva"
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "reviewBody": "Finalmente um CRM que não complica. Em 10 minutos já estava usando e fechando negócios mais rápido."
      },
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Mariana Souza"
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "reviewBody": "O botão de WhatsApp com 1 clique economiza horas por semana. Meu time adora!"
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
          "text": "Sirius CRM é um sistema de gestão de vendas intuitivo e moderno, feito especialmente para vendas brasileiras. Com pipeline visual Kanban, gestão de contatos, WhatsApp integrado e métricas em tempo real, você transforma leads em receita recorrente sem burocracia."
        }
      },
      {
        "@type": "Question",
        "name": "Como funciona o WhatsApp com 1 clique?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Cada card de negócio no Sirius possui um botão verde que abre a conversa do WhatsApp diretamente com o contato. Não precisa copiar telefone, trocar de app ou perder tempo - é só clicar e começar a conversar."
        }
      },
      {
        "@type": "Question",
        "name": "O Sirius CRM é gratuito?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sim! O Sirius oferece um plano gratuito com funcionalidades essenciais para começar. Para times que precisam de recursos avançados, oferecemos planos Pro com mais usuários, relatórios avançados e suporte prioritário."
        }
      },
      {
        "@type": "Question",
        "name": "Quantos negócios posso ter no plano gratuito?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No plano gratuito você pode gerenciar até 20 negócios ativos simultaneamente. Para times com volume maior de vendas, o plano Pro oferece negócios ilimitados."
        }
      },
      {
        "@type": "Question",
        "name": "Como o Sirius me ajuda a identificar gargalos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "O dashboard de Analytics do Sirius mostra qual vendedor trava em qual etapa do funil, taxa de conversão por fase e onde você está perdendo negócios. Visualize padrões, identifique problemas e otimize seu processo de vendas baseado em dados reais."
        }
      }
    ]
  };

  return (
    <>
      {/* Product Schema with Reviews */}
      <Script
        id="product-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* FAQ Schema for SEO */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Force dark mode aesthetic for the landing page */}
      <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30">

        {/* Background Noise/Gradient Wrapper */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
        </div>

        <div className="relative z-10">
          <Hero />
          <Logos />
          <BentoGrid />

          {/* Testimonials Section */}
          <section className="py-24 px-6">
            <div className="mx-auto max-w-7xl">
              <div className="mb-16 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">Times de alta performance confiam no Sirius</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">Veja como empresas reais aumentaram suas vendas em até 40%</p>
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
                    "Finalmente um CRM que não complica. Em 10 minutos já estava usando e fechando negócios mais rápido. <span className="text-green-400 font-semibold">+40% de conversão</span> no primeiro mês."
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
                    "O botão de WhatsApp com 1 clique economiza <span className="text-indigo-400 font-semibold">3 horas por semana</span> por vendedor. Meu time adora a simplicidade!"
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
                    "Os gargalos ficaram evidentes no primeiro dia. Consegui <span className="text-purple-400 font-semibold">redistribuir leads</span> e nossa taxa de fechamento subiu 25%."
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
                  <span className="font-medium">NOVIDADE: AGI Sirius</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                  Sua Consultora de Vendas com IA
                </h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">
                  Especialista em BANT, SPIN Selling, quebra de objeções e análise de pipeline. Experimente agora!
                </p>
              </div>

              <AgiPreview />
            </div>
          </section>

          {/* Footer CTA */}
          <section className="py-24 px-6 text-center">
            <div className="mx-auto max-w-2xl border border-white/10 bg-white/[0.02] rounded-3xl p-12 backdrop-blur-xl relative overflow-hidden">
              {/* Subtle gradient orb */}
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
                    Criar Conta Grátis →
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

        {/* Sticky CTA for mobile conversion */}
        <StickyCTA />
      </div>
    </>
  )
}
