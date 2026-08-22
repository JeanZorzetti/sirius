import { Metadata } from "next"
import { Hero } from "@/components/marketing/hero"
import { BentoGrid } from "@/components/marketing/bento-grid"
import { Logos } from "@/components/marketing/logos"
import dynamic from "next/dynamic"

const AgiPreview = dynamic(() => import("@/components/agi/AgiPreview").then(m => ({ default: m.AgiPreview })), {
  loading: () => <div className="h-96 rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse" />,
})

const StickyCTA = dynamic(() => import("@/components/marketing/sticky-cta").then(m => ({ default: m.StickyCTA })))
import { blogPosts } from "@/lib/blog-data"
import Image from "next/image"
import { Check, Zap, ArrowRight } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/routing"
import { buildLocaleAlternates } from "@/lib/seo/canonical"
import { ORG_SAME_AS } from "@/lib/geo/entity"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.home.meta' })
  const alternates = buildLocaleAlternates(locale, '', '')
  return {
    title: t('title'),
    description: t('description'),
    keywords: t.raw('keywords') as string[],
    alternates,
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: alternates.canonical,
      images: [{ url: 'https://siriuscrm.com.br/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
    },
  }
}

export default function LandingPage() {
  const t = useTranslations("marketing.home")
  const locale = useLocale()
  const isEn = locale === 'en'

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Sirius CRM",
    "applicationCategory": "BusinessApplication",
    "applicationSubCategory": "CRM",
    "operatingSystem": "Web, iOS, Android",
    "url": "https://siriuscrm.com.br",
    "description": "O Assistente de Inteligência Artificial para Vendedores Brasileiros: pipeline Kanban, WhatsApp integrado, AGI que qualifica leads com BANT e MEDDIC, prospecção Google Maps e automação de follow-ups.",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "BRL",
      "lowPrice": "0",
      "highPrice": "397",
      "offerCount": "4",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": 4.8,
      "reviewCount": 127,
      "bestRating": 5,
      "worstRating": 1
    },
    "featureList": [
      "Pipeline Kanban visual com drag-and-drop",
      "WhatsApp integrado via Evolution API",
      "AGI Sirius — IA que qualifica leads com BANT e MEDDIC",
      "Prospecção automática pelo Google Maps",
      "Automações de follow-up por email e WhatsApp",
      "Analytics PRO com previsão de receita",
      "Modo offline para vendedores externos",
      "API pública e webhooks"
    ],
    "screenshot": "https://siriuscrm.com.br/og-image.png",
    "softwareVersion": "2.0",
    "datePublished": "2024-01-01",
    "author": {
      "@type": "Organization",
      "name": "ROI Labs",
      "url": "https://roilabs.com.br"
    }
  };

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
      "highPrice": "397",
      "offerCount": "4",
      "availability": "https://schema.org/InStock",
      "url": "https://siriuscrm.com.br/pricing"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": 4.8,
      "reviewCount": 127,
      "bestRating": 5,
      "worstRating": 1
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
    "image": "https://siriuscrm.com.br/og-image.png",
    "url": "https://siriuscrm.com.br"
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
          "text": "Sim! O plano Gratuito inclui 250 contatos, 100 negócios e 1 pipeline sem prazo de expiração. Para mais recursos, oferecemos Starter (R$67/mês), Pro (R$147/mês) e Business (R$397/mês)."
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
          "text": "Busque leads por segmento e cidade. O Sirius extrai automaticamente nome, telefone, email, site e endereço do Google Maps. Cada plano inclui créditos mensais: Starter 75, Pro 300 e Business 1.500 leads/mês."
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
    "url": "https://siriuscrm.com.br",
    "logo": "https://siriuscrm.com.br/logo.png",
    "image": "https://siriuscrm.com.br/og-image.png",
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
    "sameAs": ORG_SAME_AS,
    "priceRange": "R$ 0 - R$ 397/mês"
  };

  const plans = [
    {
      name: isEn ? 'Free' : 'Gratuito',
      price: 'R$ 0',
      period: isEn ? '' : '',
      description: isEn ? 'To test the CRM' : 'Para testar o CRM',
      features: isEn ? ['2 Users', '250 Contacts', '100 Deals', '1 Pipeline'] : ['2 Usuários', '250 Contatos', '100 Negócios', '1 Pipeline'],
      highlighted: false,
    },
    {
      name: 'Starter',
      price: 'R$ 67',
      period: isEn ? '/mo' : '/mês',
      description: isEn ? 'For small businesses' : 'Para pequenas empresas',
      features: isEn ? ['5 Users', '1,000 Contacts', 'WhatsApp', '75 leads/mo'] : ['5 Usuários', '1.000 Contatos', 'WhatsApp', '75 leads/mês'],
      highlighted: false,
    },
    {
      name: 'Pro',
      price: 'R$ 147',
      period: isEn ? '/mo' : '/mês',
      description: isEn ? 'For growing teams' : 'Para equipes em crescimento',
      features: isEn ? ['15 Users', '5,000 Contacts', 'Sales AI', '300 leads/mo'] : ['15 Usuários', '5.000 Contatos', 'IA Comercial', '300 leads/mês'],
      highlighted: true,
    },
    {
      name: 'Business',
      price: 'R$ 397',
      period: isEn ? '/mo' : '/mês',
      description: isEn ? 'For large operations' : 'Para grandes operações',
      features: isEn ? ['50 Users', 'Unlimited', 'Round-Robin', '1,500 leads/mo'] : ['50 Usuários', 'Ilimitado', 'Round-Robin', '1.500 leads/mês'],
      highlighted: false,
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
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
          {locale === 'pt-BR' && <Logos />}

          {/* GEO Block */}
          <section className="py-16 sm:py-20 px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t('about.title')}
              </h2>
              <p className="mt-6 text-lg leading-8 text-zinc-300">
                {t('about.description')}
              </p>
            </div>
          </section>

          <BentoGrid />

          {/* Trial + Referral Banner */}
          <section className="px-6 pb-12">
            <div className="mx-auto max-w-5xl">
              <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">7 dias grátis com acesso PRO completo</p>
                    <p className="text-sm text-white/60">
                      Sem cartão de crédito. Indique amigos e ganhe até 100% de desconto recorrente.
                    </p>
                  </div>
                </div>
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-primary hover:bg-primary/90 px-6 text-sm font-semibold text-primary-foreground transition-colors shrink-0"
                >
                  Começar grátis
                </Link>
              </div>
            </div>
          </section>

          {/* Testimonials Section — only PT-BR */}
          {locale === 'pt-BR' && <section className="py-24 px-6">
            <div className="mx-auto max-w-7xl">
              <div className="mb-16 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t('testimonials.title')}</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">{t('testimonials.subtitle')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Testimonial 1 */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      CS
                    </div>
                    <div>
                      <div className="font-semibold text-white">{t('testimonials.t1.author')}</div>
                      <div className="text-sm text-zinc-400">{t('testimonials.t1.role')}</div>
                    </div>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                    &quot;{t.rich('testimonials.t1.quote', { green: (chunks) => <span className="text-green-400 font-semibold">{chunks}</span> })}&quot;
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
                      <div className="font-semibold text-white">{t('testimonials.t2.author')}</div>
                      <div className="text-sm text-zinc-400">{t('testimonials.t2.role')}</div>
                    </div>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                    &quot;{t.rich('testimonials.t2.quote', { indigo: (chunks) => <span className="text-indigo-400 font-semibold">{chunks}</span> })}&quot;
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
                      <div className="font-semibold text-white">{t('testimonials.t3.author')}</div>
                      <div className="text-sm text-zinc-400">{t('testimonials.t3.role')}</div>
                    </div>
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                    &quot;{t.rich('testimonials.t3.quote', { purple: (chunks) => <span className="text-purple-400 font-semibold">{chunks}</span> })}&quot;
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
          </section>}

          {/* AGI Sirius Preview Section */}
          <section className="py-24 px-6">
            <div className="mx-auto max-w-6xl">
              <div className="mb-12 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-400 mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                  </span>
                  <span className="font-medium">{t('agi.badge')}</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                  {t('agi.title')}
                </h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">
                  {t('agi.description')}
                </p>
              </div>

              <AgiPreview />
            </div>
          </section>

          {/* Plans Section */}
          <section className="py-24 px-6">
            <div className="mx-auto max-w-7xl">
              <div className="mb-16 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">{t('plans.title')}</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">{t('plans.subtitle')}</p>
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
                          {t('plans.mostPopular')}
                        </div>
                      </div>
                    )}
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      <p className="text-sm text-zinc-400">{plan.description}</p>
                    </div>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      {plan.period && <span className="text-sm text-zinc-400">{plan.period}</span>}
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
                      {plan.price === 'R$ 0' || plan.price === '$ 0' ? t('plans.startFree') : t('plans.seeDetails')}
                    </Link>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/pricing"
                  className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {t('plans.compareLink')}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* Blog Posts Section */}
          <section className="py-24 px-6">
            <div className="mx-auto max-w-7xl">
              <div className="mb-16 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                  {t('blog.title')}
                </h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">
                  {t('blog.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {blogPosts.slice(0, 3).map((post) => (
                  <Link
                    key={post.slug}
                    href={{ pathname: '/blog/[slug]', params: { slug: post.slug } }}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-10 text-center">
                <Link
                  href="/blog"
                  className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {t('blog.viewAll')}
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
                  <span className="font-medium">{t('cta.badge')}</span>
                </div>

                <h2 className="text-3xl font-bold text-white mb-4">{t('cta.title')}</h2>
                <p className="text-zinc-400 mb-8 max-w-lg mx-auto">{t('cta.subtitle')}</p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
                  <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-lg bg-indigo-600 px-8 text-base font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                    {t('cta.btnPrimary')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link href="/pricing" className="inline-flex h-12 items-center justify-center rounded-lg border border-white/10 bg-transparent px-8 text-base font-medium text-white hover:bg-white/5 transition-colors">
                    {t('cta.btnSecondary')}
                  </Link>
                </div>

                <div className="flex items-center justify-center gap-6 text-sm text-zinc-400">
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {t('cta.freeForever')}
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {t('cta.supportPt')}
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
