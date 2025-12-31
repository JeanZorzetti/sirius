import { Hero } from "@/components/marketing/hero"
import { BentoGrid } from "@/components/marketing/bento-grid"
import { Logos } from "@/components/marketing/logos"
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

        {/* Footer CTA */}
        <section className="py-24 px-6 text-center">
          <div className="mx-auto max-w-2xl border border-white/10 bg-white/[0.02] rounded-3xl p-12 backdrop-blur-xl">
            <h2 className="text-3xl font-bold text-white mb-6">Pronto para escalar?</h2>
            <p className="text-zinc-400 mb-8">Junte-se a centenas de empresas que já modernizaram suas vendas.</p>
            <div className="flex justify-center gap-4">
              {/* Re-using button styles effectively */}
              <a href="/register" className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-8 text-sm font-medium text-black hover:bg-zinc-200 transition-colors">
                Criar conta grátis
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
    </>
  )
}
