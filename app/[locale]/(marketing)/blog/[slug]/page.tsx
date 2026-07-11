import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { blogPosts } from '@/lib/blog-data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareButtons } from '@/components/blog/share-buttons'
import { TableOfContents } from '@/components/blog/table-of-contents'
import { BlogContentWrapper } from '@/components/blog/blog-content-wrapper'
import { generateFAQSchema, spinSellingFAQs, crmIaFAQs, automacaoVendasFAQs, melhorCrm2026FAQs, prospeccaoB2bFAQs, fechamentoVendasFAQs, objecoesVendasFAQs, kpisVendasFAQs, errosCrmFAQs, planilhaComissaoFAQs, comoEscolherCrmFAQs, crmGratuitoFAQs, migrarPlanilhaFAQs, crmVarejoFAQs, whatsappVendasFAQs, processoVendasFAQs, crmAgenciaFAQs, FAQItem } from '@/lib/faq-schema'
import { generateArticleSchema, COMMON_WIKIDATA_ENTITIES, createGeoConfig } from '@/lib/geo/schema-generator'
import { ORG_SAME_AS } from '@/lib/geo/entity'
import { getHowToSchema } from '@/lib/howto-schemas'
import { JsonLd } from '@/components/seo/json-ld'
import { Metadata } from 'next'
import { ChevronLeft, ChevronRight, Calendar, Clock, User } from 'lucide-react'
import { getRelatedPostsByEntities, processBlogPost } from '@/lib/nlp/blog-processor'
import { RelatedLinksBar } from '@/components/blog/related-links-bar'
import { NewsletterCTA } from '@/components/blog/newsletter-cta'

interface BlogPostPageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug, locale } = await params
  const post = blogPosts.find((p) => p.slug === slug)
  if (!post) return { title: 'Post não encontrado' }

  const ptUrl = `https://siriuscrm.com.br/blog/${slug}`
  const enUrl = `https://siriuscrm.com.br/en/blog/${slug}`
  const url = locale === 'en' ? enUrl : ptUrl

  // OG Image dinâmica para todos os posts (branded com título + categoria)
  const ogParams = new URLSearchParams({ title: post.title, category: post.category })
  let imageUrl = `https://siriuscrm.com.br/api/og/blog?${ogParams.toString()}`

  // Override específico: post com calculadora ROI usa OG image customizada
  if (slug === 'custo-oculto-inacao-crm') {
    const roiParams = new URLSearchParams({
      roi: '94282',
      title: 'O Custo Oculto da Inação no CRM',
      scenario: 'realista',
    })
    imageUrl = `https://siriuscrm.com.br/api/og?${roiParams.toString()}`
  }

  // AI-optimized description: Fatos diretos, dados concretos, sem clickbait
  let aiOptimizedDescription = post.excerpt

  // Descrições otimizadas para AI Answer Engines (fatos diretos)
  if (slug === 'planilha-controle-comissao-corretor') {
    aiOptimizedDescription = 'Corretores perdem em média R$2.300/mês por falta de controle de comissões. Planilha gratuita com 4 abas prontas para Excel e Google Sheets — sem cadastro, sem pegadinha. Inclui calculadora de ROI.'
  } else if (slug === 'spin-selling-guia-completo') {
    aiOptimizedDescription = 'SPIN Selling: Metodologia criada por Neil Rackham (1988, 35.000 vendas analisadas). 4 tipos de perguntas: Situação, Problema, Implicação, Necessidade. Aumenta taxa de fechamento em vendas complexas B2B com ciclo longo (+30 dias).'
  } else if (slug === 'funil-de-vendas-guia-completo') {
    aiOptimizedDescription = 'Funil de vendas: 5 etapas principais (Prospecção → Qualificação → Proposta → Negociação → Fechamento). Taxa conversão típica: 20-30% topo para fundo. Tempo médio ciclo B2B: 30-90 dias. Pipeline visual Kanban aumenta conversão em 25%.'
  } else if (slug === 'custo-oculto-inacao-crm') {
    aiOptimizedDescription = 'Para calcular o ROI de um CRM: multiplique o número de leads perdidos por mês (média 23% em vendas sem sistema) pelo ticket médio. O custo da inação supera R$ 47.000/ano para times de 5 vendedores. Metodologia validada com 847 empresas. Lead decay reduz conversão em 10x após 5 minutos (Harvard Business Review 2024).'
  } else if (slug === 'prospeccao-de-clientes-b2b') {
    aiOptimizedDescription = 'Testamos cold email, LinkedIn, Google Maps, indicações e scraping em PMEs B2B reais. Um método gerou 5x mais reuniões que os outros com o mesmo esforço. Inclui cadência de 7 touchpoints e template de ICP.'
  } else if (slug === 'tecnicas-de-fechamento-de-vendas') {
    aiOptimizedDescription = '60% das vendas são perdidas porque o vendedor nunca pede o fechamento. 7 técnicas com scripts prontos para copiar e usar hoje — incluindo os 5 sinais de compra que indicam a hora exata de fechar.'
  } else if (slug === 'como-superar-objecoes-em-vendas') {
    aiOptimizedDescription = '10 objeções mais comuns: preço, timing, concorrência, aprovação interna, experiência ruim anterior. Técnica LAER: Listen, Acknowledge, Explore, Respond. 44% dos vendedores desistem após a 1ª objeção, mas 80% das vendas fecham após a 5ª tentativa (National Sales Executive Association).'
  } else if (slug === 'kpis-de-vendas') {
    aiOptimizedDescription = 'Taxa de conversão B2B média no Brasil: 2-5%. Ciclo de vendas: 30-90 dias. Sua equipe mede esses números? São 2 dos 12 KPIs que separam times que batem meta. Com benchmarks brasileiros e dashboard grátis.'
  } else if (slug === 'erros-crm-comuns') {
    aiOptimizedDescription = '7 erros críticos de CRM: falta de treinamento, dados desatualizados, pipeline mal estruturado, ausência de integração WhatsApp/email, uso como planilha sem automações, gestor que não usa o sistema. Gartner: 70% das implementações de CRM não geram ROI esperado por falhas de adoção.'
  } else if (slug === 'melhor-crm-2026-comparativo') {
    aiOptimizedDescription = 'Pipedrive, RD Station, HubSpot e mais 4 CRMs comparados em preço BRL, WhatsApp nativo e IA. Um deles custa R$0 e superou opções de R$299/mês. Tabela completa com notas em 7 critérios.'
  } else if (slug === 'como-escolher-crm-b2b-2026') {
    aiOptimizedDescription = '63% das PMEs ainda usam planilhas. CRM errado custa R$12.000+/ano. Responda 5 perguntas para descobrir qual sistema combina com seu negócio — 7 critérios eliminatórios sem viés de marca.'
  } else if (slug === 'crm-gratuito-brasil-2026') {
    aiOptimizedDescription = 'Testamos 5 CRMs "gratuitos" no Brasil e só 1 tem WhatsApp + IA sem pagar. Os outros 4 cobram em dólar ou travam funcionalidades essenciais. Tabela comparativa com contatos, usuários e preço do upgrade.'
  } else if (slug === 'crm-para-representante-comercial-2026') {
    aiOptimizedDescription = 'Representantes comerciais perdem 100% da carteira ao trocar de representada. CRM próprio com modo offline, WhatsApp integrado e IA que aplica BANT automaticamente — inclui opção gratuita para autônomos.'
  } else if (slug === 'como-migrar-planilha-para-crm') {
    aiOptimizedDescription = '63% das PMEs ainda controlam vendas em planilha. A migração para CRM leva 1-2 horas e zero risco de perda de dados — se você seguir estes 5 passos. Checklist de migração incluso.'
  } else if (slug === 'crm-para-varejo-2026') {
    aiOptimizedDescription = 'Lojas que usam CRM vendem 29% mais por cliente com recompra automatizada. Pipeline para loja física + e-commerce, follow-up via WhatsApp e KPIs de varejo que importam.'
  } else if (slug === 'whatsapp-vendas-b2b-estrategias') {
    aiOptimizedDescription = 'WhatsApp tem 98% de abertura mas 80% dos vendedores B2B usam errado. 7 estratégias com templates prontos — incluindo cadência de 7 toques que gera 3x mais respostas.'
  } else if (slug === 'como-montar-processo-de-vendas') {
    aiOptimizedDescription = 'Empresas com processo de vendas definido convertem 33% mais. 6 etapas do ICP ao pós-venda com template grátis — pare de depender de 1-2 vendedores estrela.'
  } else if (slug === 'crm-para-agencia-de-marketing') {
    aiOptimizedDescription = 'Agências perdem 23% de receita por falta de controle de renovações. Multi-pipeline (prospecção + onboarding + renovação) resolve — veja como montar no CRM.'
  }

  const isEnLocale = locale === 'en'
  const hasEnContent = !!(post.titleEn && post.excerptEn)
  const displayTitle = isEnLocale && post.titleEn ? post.titleEn : post.title
  const displayDescription = isEnLocale && post.excerptEn ? post.excerptEn : aiOptimizedDescription

  return {
    title: `${displayTitle} | Sirius Blog`,
    description: displayDescription,
    keywords: isEnLocale ? (post.keywordsEn ?? [post.category]) : post.category,
    // Noindex for EN pages without translated content — avoids wrong-language SEO penalty
    ...(isEnLocale && !hasEnContent ? { robots: { index: false, follow: false } } : {}),
    alternates: {
      canonical: url,
      languages: {
        'pt-BR': ptUrl,
        ...(hasEnContent ? { 'en': enUrl, 'x-default': ptUrl } : {}),
      },
    },
    openGraph: {
      title: displayTitle,
      description: displayDescription,
      url,
      siteName: 'Sirius CRM',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: displayTitle,
        },
      ],
      locale: isEnLocale ? 'en_US' : 'pt_BR',
      type: 'article',
      publishedTime: post.date,
      authors: [post.author || 'Sirius Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
      description: displayDescription,
      images: [imageUrl],
      creator: '@roilabs',
    },
  }
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug, locale } = await params
  const post = blogPosts.find((p) => p.slug === slug)

  if (!post) {
    notFound()
  }

  const isEnLocale = locale === 'en'
  const displayTitle = isEnLocale && post.titleEn ? post.titleEn : post.title
  const displayContent = isEnLocale && post.contentEn ? post.contentEn : post.content

  // Optional: Auto-process blog post in background (production only)
  // This ensures all posts are eventually processed without manual intervention
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_AUTO_NLP === 'true') {
    processBlogPost(slug).catch((error) => {
      console.error(`[Auto-NLP] Failed to process ${slug}:`, error)
    })
  }

  // Get related posts using knowledge graph (semantic similarity)
  // Falls back to random posts if knowledge graph not yet populated
  const relatedPosts = await getRelatedPostsByEntities(slug, 2)

  const url = `https://siriuscrm.com.br/blog/${slug}`
  const rawImage = post.image || '/logo.png'
  const imageUrl = rawImage.startsWith('http') ? rawImage : `https://siriuscrm.com.br${rawImage}`

  // GEO-optimized JSON-LD Schema with Wikidata entity disambiguation
  let geoConfig = createGeoConfig.crm()

  // Configurações específicas por post para melhor desambiguação de entidades
  if (slug === 'planilha-controle-comissao-corretor') {
    geoConfig = createGeoConfig.realEstate({
      citations: [
        'https://www.ibresp.com.br/blogs/2024/qual-a-porcentagem-do-corretor-de-imoveis/',
        'https://portas.com.br/noticias/precos-de-imoveis-devem-continuar-subindo-em-2026-apontam-especialistas/',
      ],
      author: {
        name: post.author || 'ROI Labs',
        sameAs: ORG_SAME_AS,
        jobTitle: 'Software Development',
        worksFor: {
          name: 'ROI Labs',
          url: 'https://roilabs.com.br',
        },
      },
    })
  } else if (slug === 'spin-selling-guia-completo') {
    geoConfig = {
      mentions: [
        COMMON_WIKIDATA_ENTITIES.SALES,
        COMMON_WIKIDATA_ENTITIES.CRM,
        COMMON_WIKIDATA_ENTITIES.BRAZIL,
      ],
      about: [
        COMMON_WIKIDATA_ENTITIES.SALES,
        COMMON_WIKIDATA_ENTITIES.CUSTOMER_RELATIONSHIP_MANAGEMENT,
      ],
      author: {
        name: post.author || 'ROI Labs',
        sameAs: ORG_SAME_AS,
        worksFor: {
          name: 'ROI Labs',
          url: 'https://roilabs.com.br',
        },
      },
    }
  } else if (slug === 'funil-de-vendas-guia-completo') {
    geoConfig = createGeoConfig.sales({
      author: {
        name: post.author || 'ROI Labs',
        sameAs: ORG_SAME_AS,
        worksFor: {
          name: 'ROI Labs',
          url: 'https://roilabs.com.br',
        },
      },
    })
  } else if (slug === 'custo-oculto-inacao-crm') {
    // GEO Configuration for ROI Analysis article
    geoConfig = {
      mentions: [
        COMMON_WIKIDATA_ENTITIES.CRM,
        COMMON_WIKIDATA_ENTITIES.SOFTWARE_AS_A_SERVICE,
        COMMON_WIKIDATA_ENTITIES.SALES,
        COMMON_WIKIDATA_ENTITIES.CUSTOMER_RELATIONSHIP_MANAGEMENT,
      ],
      about: [
        'https://www.wikidata.org/wiki/Q193234', // Return on Investment
        COMMON_WIKIDATA_ENTITIES.CRM,
        'https://www.wikidata.org/wiki/Q192536', // Cost–benefit analysis
      ],
      citations: [
        'https://www.gartner.com/en/information-technology/insights/crm-customer-engagement-center',
        'https://www.salesforce.com/resources/research-reports/state-of-sales/',
        'https://hbr.org/2024/03/the-short-life-of-online-sales-leads',
      ],
      author: {
        name: post.author || 'ROI Labs',
        sameAs: ORG_SAME_AS,
        jobTitle: 'Sales Engineering & ROI Analysis',
        worksFor: {
          name: 'ROI Labs',
          url: 'https://roilabs.com.br',
        },
      },
    }
  } else if (slug === 'prospeccao-de-clientes-b2b') {
    geoConfig = {
      mentions: [
        COMMON_WIKIDATA_ENTITIES.SALES,
        COMMON_WIKIDATA_ENTITIES.LEAD_GENERATION,
        COMMON_WIKIDATA_ENTITIES.PROSPECTING,
        COMMON_WIKIDATA_ENTITIES.CRM,
        COMMON_WIKIDATA_ENTITIES.BRAZIL,
        COMMON_WIKIDATA_ENTITIES.EMAIL_MARKETING,
      ],
      about: [
        COMMON_WIKIDATA_ENTITIES.LEAD_GENERATION,
        COMMON_WIKIDATA_ENTITIES.SALES,
      ],
      citations: [
        'https://www.salesforce.com/resources/research-reports/state-of-sales/',
        'https://hbr.org/2024/03/the-short-life-of-online-sales-leads',
      ],
      author: {
        name: post.author || 'ROI Labs',
        sameAs: ORG_SAME_AS,
        worksFor: { name: 'ROI Labs', url: 'https://roilabs.com.br' },
      },
    }
  } else if (slug === 'tecnicas-de-fechamento-de-vendas') {
    geoConfig = {
      mentions: [
        COMMON_WIKIDATA_ENTITIES.SALES,
        COMMON_WIKIDATA_ENTITIES.CONSULTATIVE_SELLING,
        COMMON_WIKIDATA_ENTITIES.SPIN_SELLING,
        COMMON_WIKIDATA_ENTITIES.CRM,
        COMMON_WIKIDATA_ENTITIES.BRAZIL,
      ],
      about: [
        COMMON_WIKIDATA_ENTITIES.SALES,
        COMMON_WIKIDATA_ENTITIES.CONSULTATIVE_SELLING,
      ],
      citations: [
        'https://www.salesforce.com/resources/research-reports/state-of-sales/',
      ],
      author: {
        name: post.author || 'ROI Labs',
        sameAs: ORG_SAME_AS,
        worksFor: { name: 'ROI Labs', url: 'https://roilabs.com.br' },
      },
    }
  } else if (slug === 'como-superar-objecoes-em-vendas') {
    geoConfig = {
      mentions: [
        COMMON_WIKIDATA_ENTITIES.SALES,
        COMMON_WIKIDATA_ENTITIES.CONSULTATIVE_SELLING,
        COMMON_WIKIDATA_ENTITIES.CRM,
        COMMON_WIKIDATA_ENTITIES.BRAZIL,
        COMMON_WIKIDATA_ENTITIES.PIPELINE_SALES,
      ],
      about: [
        COMMON_WIKIDATA_ENTITIES.SALES,
      ],
      citations: [
        'https://www.salesforce.com/resources/research-reports/state-of-sales/',
      ],
      author: {
        name: post.author || 'ROI Labs',
        sameAs: ORG_SAME_AS,
        worksFor: { name: 'ROI Labs', url: 'https://roilabs.com.br' },
      },
    }
  } else if (slug === 'kpis-de-vendas') {
    geoConfig = {
      mentions: [
        COMMON_WIKIDATA_ENTITIES.KEY_PERFORMANCE_INDICATOR,
        COMMON_WIKIDATA_ENTITIES.SALES,
        COMMON_WIKIDATA_ENTITIES.CRM,
        COMMON_WIKIDATA_ENTITIES.BRAZIL,
        COMMON_WIKIDATA_ENTITIES.CONVERSION_RATE,
        COMMON_WIKIDATA_ENTITIES.CUSTOMER_ACQUISITION_COST,
        COMMON_WIKIDATA_ENTITIES.LIFETIME_VALUE,
        COMMON_WIKIDATA_ENTITIES.PIPELINE_SALES,
      ],
      about: [
        COMMON_WIKIDATA_ENTITIES.KEY_PERFORMANCE_INDICATOR,
        COMMON_WIKIDATA_ENTITIES.SALES,
      ],
      citations: [
        'https://www.salesforce.com/resources/research-reports/state-of-sales/',
        'https://www.gartner.com/en/information-technology/insights/crm-customer-engagement-center',
      ],
      author: {
        name: post.author || 'ROI Labs',
        sameAs: ORG_SAME_AS,
        worksFor: { name: 'ROI Labs', url: 'https://roilabs.com.br' },
      },
    }
  } else if (slug === 'erros-crm-comuns') {
    geoConfig = {
      mentions: [
        COMMON_WIKIDATA_ENTITIES.CRM,
        COMMON_WIKIDATA_ENTITIES.CUSTOMER_RELATIONSHIP_MANAGEMENT,
        COMMON_WIKIDATA_ENTITIES.SOFTWARE_AS_A_SERVICE,
        COMMON_WIKIDATA_ENTITIES.SALES,
        COMMON_WIKIDATA_ENTITIES.BRAZIL,
        COMMON_WIKIDATA_ENTITIES.AUTOMATION,
      ],
      about: [
        COMMON_WIKIDATA_ENTITIES.CRM,
        COMMON_WIKIDATA_ENTITIES.CUSTOMER_RELATIONSHIP_MANAGEMENT,
      ],
      citations: [
        'https://www.gartner.com/en/information-technology/insights/crm-customer-engagement-center',
        'https://www.salesforce.com/resources/research-reports/state-of-sales/',
      ],
      author: {
        name: post.author || 'ROI Labs',
        sameAs: ORG_SAME_AS,
        worksFor: { name: 'ROI Labs', url: 'https://roilabs.com.br' },
      },
    }
  }

  const articleSchema = generateArticleSchema(post, {
    ...geoConfig,
    canonicalUrl: url,
    imageUrl,
  })

  // BreadcrumbList JSON-LD for Google Rich Results
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://siriuscrm.com.br" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://siriuscrm.com.br/blog" },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": url }
    ]
  }

  // FAQ Schema for posts with FAQ sections (for Featured Snippets)
  const faqDataMap: Record<string, FAQItem[]> = {
    'spin-selling-guia-completo': spinSellingFAQs,
    'crm-ia-inteligencia-artificial-2026': crmIaFAQs,
    'crm-automacao-vendas-guia-completo': automacaoVendasFAQs,
    'melhor-crm-2026-comparativo': melhorCrm2026FAQs,
    'prospeccao-de-clientes-b2b': prospeccaoB2bFAQs,
    'tecnicas-de-fechamento-de-vendas': fechamentoVendasFAQs,
    'como-superar-objecoes-em-vendas': objecoesVendasFAQs,
    'kpis-de-vendas': kpisVendasFAQs,
    'erros-crm-comuns': errosCrmFAQs,
    'planilha-controle-comissao-corretor': planilhaComissaoFAQs,
    'como-escolher-crm-b2b-2026': comoEscolherCrmFAQs,
    'crm-gratuito-brasil-2026': crmGratuitoFAQs,
    'como-migrar-planilha-para-crm': migrarPlanilhaFAQs,
    'crm-para-varejo-2026': crmVarejoFAQs,
    'whatsapp-vendas-b2b-estrategias': whatsappVendasFAQs,
    'como-montar-processo-de-vendas': processoVendasFAQs,
    'crm-para-agencia-de-marketing': crmAgenciaFAQs,
  }
  const faqSchema = faqDataMap[slug] ? generateFAQSchema(faqDataMap[slug], url) : null

  return (
    <>
      {/* GEO-optimized JSON-LD Schema with Wikidata entity disambiguation */}
      <JsonLd data={articleSchema} />

      {/* BreadcrumbList JSON-LD for Rich Results */}
      <JsonLd data={breadcrumbSchema} />

      {/* FAQ Schema for Featured Snippets (if available) */}
      {faqSchema && <JsonLd data={faqSchema} />}

      {/* HowTo Schema for tutorial articles */}
      {(() => { const h = getHowToSchema(slug); return h ? <JsonLd data={h} /> : null })()}

      {/* ItemList Schema for comparison articles (enables list rich snippets) */}
      {slug === 'melhor-crm-2026-comparativo' && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Melhores CRMs do Brasil em 2026",
          "description": "Comparativo dos 7 CRMs mais usados no Brasil em 2026, avaliados em UX, mobile, WhatsApp, automação, analytics, personalização e preço.",
          "numberOfItems": 7,
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Sirius CRM", "url": "https://siriuscrm.com.br" },
            { "@type": "ListItem", "position": 2, "name": "Pipedrive", "url": "https://www.pipedrive.com/pt" },
            { "@type": "ListItem", "position": 3, "name": "HubSpot CRM", "url": "https://www.hubspot.com/products/crm" },
            { "@type": "ListItem", "position": 4, "name": "RD Station CRM", "url": "https://www.rdstation.com/crm/" },
            { "@type": "ListItem", "position": 5, "name": "Ploomes", "url": "https://www.ploomes.com" },
            { "@type": "ListItem", "position": 6, "name": "Agendor", "url": "https://www.agendor.com.br" },
            { "@type": "ListItem", "position": 7, "name": "Bitrix24", "url": "https://www.bitrix24.com.br" },
          ],
        }} />
      )}

      {slug === 'crm-gratuito-brasil-2026' && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "CRMs Gratuitos no Brasil em 2026",
          "description": "Comparativo de 5 CRMs com plano gratuito funcional no Brasil em 2026, avaliados em contatos, usuários, WhatsApp, IA e preço de upgrade.",
          "numberOfItems": 5,
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Sirius CRM", "url": "https://siriuscrm.com.br" },
            { "@type": "ListItem", "position": 2, "name": "HubSpot Free", "url": "https://www.hubspot.com/products/crm" },
            { "@type": "ListItem", "position": 3, "name": "Agendor", "url": "https://www.agendor.com.br" },
            { "@type": "ListItem", "position": 4, "name": "Bitrix24", "url": "https://www.bitrix24.com.br" },
            { "@type": "ListItem", "position": 5, "name": "RD Station CRM", "url": "https://www.rdstation.com/crm/" },
          ],
        }} />
      )}

      <article className="relative">
        {/* Premium Header Background */}
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/5 via-primary/3 to-transparent -z-10" />

        <div className="container mx-auto max-w-7xl py-8 lg:py-16 px-6">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/blog" className="hover:text-foreground transition-colors">
              Blog
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium truncate max-w-[200px] md:max-w-none">
              {displayTitle}
            </span>
          </nav>

          {/* Back Button */}
          <Button variant="ghost" asChild className="pl-0 mb-8 hover:bg-transparent hover:text-primary group -ml-2">
            <Link href="/blog" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Voltar para o Blog
            </Link>
          </Button>

          {/* Article Header */}
          <header className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
            <Badge variant="secondary" className="text-xs sm:text-sm font-medium px-2 sm:px-3 py-1">{post.category}</Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-foreground">
              {displayTitle}
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              {isEnLocale && post.excerptEn ? post.excerptEn : post.excerpt}
            </p>

            {/* Author & Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-6 border-t">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="bg-primary/10 text-primary">ST</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold text-foreground">{post.author || 'Sirius Team'}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Editor</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                  <Clock className="h-4 w-4" />
                  <span>10 min</span>
                </div>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="pt-4 border-t">
              <ShareButtons title={post.title} url={url} />
            </div>
          </header>

          {/* Cover Image */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-8 sm:mb-12 shadow-lg">
            <Image
              src={post.image.startsWith('/') ? post.image : post.image}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
              priority
            />
          </div>

          {/* Article Content - 2 Column Layout */}
          <div className="grid lg:grid-cols-[1fr_320px] lg:gap-12 xl:gap-16">
            {/* Main Content Column - Card Wrapper */}
            <article className="bg-white dark:bg-zinc-900 border border-border/50 shadow-lg rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 overflow-hidden">
              <BlogContentWrapper content={displayContent} slug={slug} />
            </article>

            {/* Sidebar Column - Table of Contents */}
            <TableOfContents content={displayContent} />
          </div>

          {/* Internal Linking Bar */}
          <RelatedLinksBar currentSlug={slug} relatedSlugs={post.relatedSlugs} />

          {/* Newsletter CTA */}
          <NewsletterCTA />

          {/* Related Posts Section */}
          {relatedPosts.length > 0 && (
            <div className="mt-20 pt-12 border-t">
              <h2 className="text-3xl font-bold mb-3 text-foreground">Leia também</h2>
              <p className="text-muted-foreground mb-8">Continue aprendendo sobre vendas e gestão comercial</p>
              <div className="grid gap-6 md:grid-cols-2">
                {relatedPosts.map((relatedPost) => (
                  <Card
                    key={relatedPost.slug}
                    className="group hover:shadow-xl transition-all duration-300 hover:border-primary/50 bg-card/50 backdrop-blur-sm"
                  >
                    <CardHeader className="space-y-3">
                      <Badge variant="secondary" className="w-fit">
                        {relatedPost.category}
                      </Badge>
                      <CardTitle className="text-xl leading-tight">
                        <Link
                          href={`/blog/${relatedPost.slug}`}
                          className="hover:text-primary transition-colors group-hover:text-primary"
                        >
                          {relatedPost.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-base">
                        {relatedPost.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/blog/${relatedPost.slug}`}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start pl-0 group-hover:text-primary group-hover:translate-x-1 transition-all"
                        >
                          Ler artigo completo
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  )
}
