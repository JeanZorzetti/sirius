import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getCityBySlug,
  getAllCitySlugs,
  CITY_DISPLAY_NAMES,
  CITY_ADDRESS_LOCALITY,
} from '@/config/city-data'
import { CalculadoraROI } from '@/components/calculadora-roi'
import {
  Building2,
  Sun,
  Sparkles,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Users,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import Link from 'next/link'

// Mapear ícones (mesmo conjunto de niche-data)
const ICON_MAP = {
  Building2,
  Sun,
  Sparkles,
  Briefcase,
  TrendingUp,
}

// Gerar todas as páginas de cidade estaticamente no build (SSG)
export async function generateStaticParams() {
  const slugs = getAllCitySlugs()
  return slugs.map((slug) => ({ slug }))
}

// Meta tags dinâmicas por cidade
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const city = getCityBySlug(slug)

  if (!city) {
    return { title: 'Página não encontrada' }
  }

  return {
    title: city.seo.title,
    description: city.seo.description,
    keywords: city.seo.keywords.join(', '),
    alternates: {
      canonical: `https://sirius.roilabs.com.br/solucoes/cidade/${city.slug}`,
    },
    openGraph: {
      title: city.seo.title,
      description: city.seo.description,
      url: `https://sirius.roilabs.com.br/solucoes/cidade/${city.slug}`,
      siteName: 'Sirius CRM',
      locale: 'pt_BR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: city.seo.title,
      description: city.seo.description,
    },
  }
}

export default async function CitySolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const city = getCityBySlug(slug)

  if (!city) {
    notFound()
  }

  const Icon = ICON_MAP[city.icon]
  const cityName = CITY_DISPLAY_NAMES[slug] ?? slug
  const addressLocality = CITY_ADDRESS_LOCALITY[slug] ?? cityName

  // JSON-LD: FAQ
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: city.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  // JSON-LD: LocalBusiness (sinaliza relevância geográfica ao Google)
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `Sirius CRM — ${city.title}`,
    description: city.seo.description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    url: `https://sirius.roilabs.com.br/solucoes/cidade/${city.slug}`,
    areaServed: {
      '@type': 'City',
      name: addressLocality,
      addressCountry: 'BR',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
      description: 'Plano gratuito disponível',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
    },
  }

  // JSON-LD: BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://sirius.roilabs.com.br',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Soluções',
        item: 'https://sirius.roilabs.com.br/solucoes',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: cityName,
        item: `https://sirius.roilabs.com.br/solucoes/cidade/${city.slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
        {/* Breadcrumb visual */}
        <div className="container mx-auto px-4 pt-6">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1 text-sm text-muted-foreground"
          >
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link
              href="/solucoes"
              className="hover:text-foreground transition-colors"
            >
              Soluções
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{cityName}</span>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-10 md:py-18">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-${city.color.primary}-100 dark:bg-${city.color.primary}-950 text-${city.color.primary}-700 dark:text-${city.color.primary}-300 text-sm font-medium mb-6`}
            >
              <Icon className="h-4 w-4" />
              CRM para {cityName}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span
                className={`bg-gradient-to-r ${city.color.gradient} bg-clip-text text-transparent`}
              >
                {city.title}
              </span>
            </h1>

            <p className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-4">
              {city.subtitle}
            </p>

            <div className="space-y-3 mb-8">
              <p className="text-xl text-red-600 dark:text-red-400 font-medium">
                ❌ {city.painPoint}
              </p>
              <p className="text-xl text-red-600 dark:text-red-400 font-medium">
                ❌ {city.painPointSecondary}
              </p>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <Users className={`h-4 w-4 text-${city.color.primary}-600`} />
                <span>{city.socialProof.users} usando</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>{city.socialProof.improvement}</span>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <a href="/register">
                <Button
                  size="lg"
                  className={`bg-gradient-to-r ${city.color.gradient} hover:opacity-90 text-lg px-8`}
                >
                  Começar Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
              <a href="#calculadora">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Calcular minha perda
                </Button>
              </a>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              Sem cartão de crédito • Sem limite de tempo • Cancele quando quiser
            </p>
          </div>
        </section>

        {/* Benefícios Específicos */}
        <section
          className={`bg-gradient-to-b from-${city.color.primary}-50 to-white dark:from-${city.color.primary}-950/20 dark:to-zinc-900 py-20`}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                Como o Sirius resolve seus problemas em {cityName}
              </h2>
              <p className="text-xl text-center text-muted-foreground mb-12">
                Funcionalidades pensadas para o mercado de{' '}
                {city.jargon.lead.toLowerCase()}s e{' '}
                {city.jargon.deal.toLowerCase()}s em {cityName}
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {city.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-zinc-900 p-6 rounded-xl border"
                  >
                    <CheckCircle2 className="h-8 w-8 text-green-600 mb-4" />
                    <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Calculadora Adaptada */}
        <section id="calculadora" className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {city.calculatorCopy.title}
            </h2>
            <p className="text-xl text-muted-foreground">
              {city.calculatorCopy.subtitle}
            </p>
          </div>

          <CalculadoraROI
            ctaText={city.calculatorCopy.ctaText}
            ctaHref={`/register?origem=solucoes-cidade-${city.slug}`}
          />
        </section>

        {/* Depoimento */}
        <section
          className={`bg-gradient-to-r from-${city.color.primary}-50 to-${city.color.secondary}-50 dark:from-${city.color.primary}-950/20 dark:to-${city.color.secondary}-950/20 py-20`}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white dark:bg-zinc-900 p-8 md:p-12 rounded-2xl border shadow-lg">
                <div className="flex items-start gap-4 mb-6">
                  <div
                    className={`bg-${city.color.primary}-600 text-white p-3 rounded-lg`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg md:text-xl text-muted-foreground mb-6 italic">
                      &quot;{city.testimonial.quote}&quot;
                    </p>
                    <div>
                      <p className="font-bold">{city.testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">
                        {city.testimonial.role}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {city.testimonial.company}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Perguntas Frequentes sobre CRM em {cityName}
            </h2>

            <Accordion type="single" collapsible className="space-y-4">
              {city.faq.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border rounded-lg px-6"
                >
                  <AccordionTrigger className="text-left font-semibold">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA Final */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto para organizar suas vendas em {cityName}?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Comece grátis hoje. Sem cartão de crédito, sem limite de tempo.
            </p>
            <a href="/register">
              <Button
                size="lg"
                className={`bg-gradient-to-r ${city.color.gradient} hover:opacity-90 text-lg px-12 py-6`}
              >
                Começar Grátis Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <p className="text-sm text-muted-foreground mt-4">
              50 {city.jargon.lead.toLowerCase()}s grátis para sempre • Cancele
              quando quiser
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
