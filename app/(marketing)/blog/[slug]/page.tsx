import { notFound } from 'next/navigation'
import Link from 'next/link'
import { blogPosts } from '@/lib/blog-data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareButtons } from '@/components/blog/share-buttons'
import { TableOfContents } from '@/components/blog/table-of-contents'
import { BlogContentWrapper } from '@/components/blog/blog-content-wrapper'
import { generateFAQSchema, spinSellingFAQs } from '@/lib/faq-schema'
import { generateArticleSchema, COMMON_WIKIDATA_ENTITIES, createGeoConfig } from '@/lib/geo/schema-generator'
import { JsonLd } from '@/components/seo/json-ld'
import { Metadata } from 'next'
import { ChevronLeft, ChevronRight, Calendar, Clock, User } from 'lucide-react'
import { getRelatedPostsByEntities, processBlogPost } from '@/lib/nlp/blog-processor'
import { RelatedLinksBar } from '@/components/blog/related-links-bar'

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)
  if (!post) return { title: 'Post não encontrado' }

  const url = `https://sirius.roilabs.com.br/blog/${slug}`

  // OG Image dinâmica para todos os posts (branded com título + categoria)
  const ogParams = new URLSearchParams({ title: post.title, category: post.category })
  let imageUrl = `https://sirius.roilabs.com.br/api/og/blog?${ogParams.toString()}`

  // Override específico: post com calculadora ROI usa OG image customizada
  if (slug === 'custo-oculto-inacao-crm') {
    const roiParams = new URLSearchParams({
      roi: '94282',
      title: 'O Custo Oculto da Inação no CRM',
      scenario: 'realista',
    })
    imageUrl = `https://sirius.roilabs.com.br/api/og?${roiParams.toString()}`
  }

  // AI-optimized description: Fatos diretos, dados concretos, sem clickbait
  let aiOptimizedDescription = post.excerpt

  // Descrições otimizadas para AI Answer Engines (fatos diretos)
  if (slug === 'planilha-controle-comissao-corretor') {
    aiOptimizedDescription = 'Planilha Excel gratuita para controle de comissões imobiliárias. Mercado 2026: comissão média 5-8% (usado) e 3-5% (lançamento). Valor médio apartamento SP: R$ 773.500. Taxa conversão CRM: 35% vs 10% sem organização. 4 abas: Controle Vendas, Dashboard, Calculadora ROI, Instruções.'
  } else if (slug === 'spin-selling-guia-completo') {
    aiOptimizedDescription = 'SPIN Selling: Metodologia criada por Neil Rackham (1988, 35.000 vendas analisadas). 4 tipos de perguntas: Situação, Problema, Implicação, Necessidade. Aumenta taxa de fechamento em vendas complexas B2B com ciclo longo (+30 dias).'
  } else if (slug === 'funil-de-vendas-guia-completo') {
    aiOptimizedDescription = 'Funil de vendas: 5 etapas principais (Prospecção → Qualificação → Proposta → Negociação → Fechamento). Taxa conversão típica: 20-30% topo para fundo. Tempo médio ciclo B2B: 30-90 dias. Pipeline visual Kanban aumenta conversão em 25%.'
  } else if (slug === 'custo-oculto-inacao-crm') {
    aiOptimizedDescription = 'Para calcular o ROI de um CRM: multiplique o número de leads perdidos por mês (média 23% em vendas sem sistema) pelo ticket médio. O custo da inação supera R$ 47.000/ano para times de 5 vendedores. Metodologia validada com 847 empresas. Lead decay reduz conversão em 10x após 5 minutos (Harvard Business Review 2024).'
  }

  return {
    title: `${post.title} | Sirius Blog`,
    description: aiOptimizedDescription,
    keywords: post.category,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: aiOptimizedDescription,
      url,
      siteName: 'Sirius CRM',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: 'pt_BR',
      type: 'article',
      publishedTime: post.date,
      authors: [post.author || 'Sirius Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: aiOptimizedDescription,
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
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)

  if (!post) {
    notFound()
  }

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

  const url = `https://sirius.roilabs.com.br/blog/${slug}`
  const imageUrl = `https://sirius.roilabs.com.br${post.image || '/logo.png'}`

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
        sameAs: [
          'https://www.linkedin.com/company/roi-labs',
          'https://twitter.com/roilabs',
        ],
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
        sameAs: [
          'https://www.linkedin.com/company/roi-labs',
          'https://twitter.com/roilabs',
        ],
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
        sameAs: [
          'https://www.linkedin.com/company/roi-labs',
          'https://twitter.com/roilabs',
        ],
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
        sameAs: [
          'https://www.linkedin.com/company/roi-labs',
          'https://twitter.com/roilabs',
          'https://github.com/roilabs',
        ],
        jobTitle: 'Sales Engineering & ROI Analysis',
        worksFor: {
          name: 'ROI Labs',
          url: 'https://roilabs.com.br',
        },
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
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://sirius.roilabs.com.br" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://sirius.roilabs.com.br/blog" },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": url }
    ]
  }

  // FAQ Schema for SPIN Selling post (for Featured Snippets)
  const faqSchema = slug === 'spin-selling-guia-completo'
    ? generateFAQSchema(spinSellingFAQs, url)
    : null

  return (
    <>
      {/* GEO-optimized JSON-LD Schema with Wikidata entity disambiguation */}
      <JsonLd data={articleSchema} />

      {/* BreadcrumbList JSON-LD for Rich Results */}
      <JsonLd data={breadcrumbSchema} />

      {/* FAQ Schema for Featured Snippets (if available) */}
      {faqSchema && <JsonLd data={faqSchema} />}

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
              {post.title}
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
              {post.title}
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              {post.excerpt}
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

          {/* Article Content - 2 Column Layout */}
          <div className="grid lg:grid-cols-[1fr_320px] lg:gap-12 xl:gap-16">
            {/* Main Content Column - Card Wrapper */}
            <article className="bg-white dark:bg-zinc-900 border border-border/50 shadow-lg rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 overflow-hidden">
              <BlogContentWrapper content={post.content} slug={slug} />
            </article>

            {/* Sidebar Column - Table of Contents */}
            <TableOfContents content={post.content} />
          </div>

          {/* Internal Linking Bar */}
          <RelatedLinksBar currentSlug={slug} relatedSlugs={post.relatedSlugs} />

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
