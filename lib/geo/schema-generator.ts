import { WithContext, BlogPosting, Person, Organization } from 'schema-dts'
import { BlogPost } from '@/lib/blog-types'

/**
 * Configuração de autor com perfis sociais para desambiguação GEO
 */
export interface AuthorConfig {
  name: string
  url?: string
  sameAs?: string[] // URLs de perfis sociais (LinkedIn, Twitter, etc.)
  jobTitle?: string
  worksFor?: {
    name: string
    url: string
  }
}

/**
 * Configuração adicional de GEO para artigos
 */
export interface GeoArticleConfig {
  /** URLs da Wikidata para entidades mencionadas (ex: "https://www.wikidata.org/wiki/Q123") */
  mentions?: string[]
  /** URLs da Wikidata para o assunto principal do artigo */
  about?: string[]
  /** URLs de citações/referências externas */
  citations?: string[]
  /** Configuração do autor com perfis sociais */
  author?: AuthorConfig
  /** URL canônico do artigo */
  canonicalUrl?: string
  /** Imagem destacada (URL completa) */
  imageUrl?: string
}

/**
 * Gera schema JSON-LD tipo BlogPosting com suporte a GEO (Graph-Enhanced Optimization)
 *
 * @param post - Dados do post do blog
 * @param config - Configuração adicional de GEO (mentions, about, citations, author)
 * @returns Schema BlogPosting tipo-safe com suporte a desambiguação de entidades
 *
 * @example
 * ```ts
 * const schema = generateArticleSchema(post, {
 *   mentions: [
 *     'https://www.wikidata.org/wiki/Q16635046', // CRM (software)
 *     'https://www.wikidata.org/wiki/Q155', // Brasil
 *   ],
 *   about: [
 *     'https://www.wikidata.org/wiki/Q184753', // Vendas
 *   ],
 *   citations: [
 *     'https://www.ibresp.com.br/blogs/comissoes',
 *     'https://portas.com.br/mercado-imobiliario',
 *   ],
 *   author: {
 *     name: 'Jean Zorzetti',
 *     sameAs: [
 *       'https://www.linkedin.com/in/jeanzorzetti',
 *       'https://twitter.com/jeanzorzetti',
 *     ],
 *     jobTitle: 'Founder & CEO',
 *     worksFor: {
 *       name: 'ROI Labs',
 *       url: 'https://roilabs.com.br',
 *     },
 *   },
 * })
 * ```
 */
export function generateArticleSchema(
  post: BlogPost,
  config: GeoArticleConfig = {}
): WithContext<BlogPosting> {
  const {
    mentions = [],
    about = [],
    citations = [],
    author,
    canonicalUrl,
    imageUrl,
  } = config

  // Construir objeto author tipo-safe
  const authorSchema: Person | Organization = author
    ? {
        '@type': 'Person',
        name: author.name,
        url: author.url,
        sameAs: author.sameAs,
        jobTitle: author.jobTitle,
        worksFor: author.worksFor
          ? {
              '@type': 'Organization',
              name: author.worksFor.name,
              url: author.worksFor.url,
            }
          : undefined,
      }
    : {
        '@type': 'Person',
        name: post.author || 'ROI Labs',
      }

  // Montar schema BlogPosting
  const schema: WithContext<BlogPosting> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: imageUrl || post.image,
    datePublished: post.date,
    dateModified: post.date,
    author: authorSchema,
    publisher: {
      '@type': 'Organization',
      name: 'ROI Labs',
      url: 'https://roilabs.com.br',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sirius.roilabs.com.br/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl || `https://sirius.roilabs.com.br/blog/${post.slug}`,
    },
    // GEO: Desambiguação de entidades via Wikidata
    ...(mentions.length > 0 && {
      mentions: mentions.map((wikidataUrl) => ({
        '@type': 'Thing',
        '@id': wikidataUrl,
      })),
    }),
    // GEO: Assunto principal do artigo
    ...(about.length > 0 && {
      about: about.map((wikidataUrl) => ({
        '@type': 'Thing',
        '@id': wikidataUrl,
      })),
    }),
    // GEO: Citações e referências externas
    ...(citations.length > 0 && {
      citation: citations.map((citationUrl) => ({
        '@type': 'CreativeWork',
        url: citationUrl,
      })),
    }),
    // Categoria/artigo de fundo
    articleSection: post.category,
    // Idioma
    inLanguage: 'pt-BR',
  }

  return schema
}

/**
 * Converte schema tipo-safe para JSON string pronto para injetar no HTML
 *
 * @param schema - Schema gerado por generateArticleSchema
 * @returns JSON string formatado
 */
export function serializeSchema(schema: WithContext<BlogPosting>): string {
  return JSON.stringify(schema, null, 2)
}

/**
 * URLs da Wikidata comuns para o mercado brasileiro de CRM/Vendas
 */
export const COMMON_WIKIDATA_ENTITIES = {
  // Software & Tecnologia
  CRM: 'https://www.wikidata.org/wiki/Q16635046',
  SOFTWARE_AS_A_SERVICE: 'https://www.wikidata.org/wiki/Q1172284',
  ARTIFICIAL_INTELLIGENCE: 'https://www.wikidata.org/wiki/Q11660',

  // Negócios & Vendas
  SALES: 'https://www.wikidata.org/wiki/Q184753',
  MARKETING: 'https://www.wikidata.org/wiki/Q39809',
  LEAD_GENERATION: 'https://www.wikidata.org/wiki/Q1139696',
  CUSTOMER_RELATIONSHIP_MANAGEMENT: 'https://www.wikidata.org/wiki/Q177777',

  // Geografia
  BRAZIL: 'https://www.wikidata.org/wiki/Q155',
  SAO_PAULO: 'https://www.wikidata.org/wiki/Q174',

  // Indústrias
  REAL_ESTATE: 'https://www.wikidata.org/wiki/Q891723',
  REAL_ESTATE_BROKER: 'https://www.wikidata.org/wiki/Q831663',

  // Conceitos de negócio
  COMMISSION: 'https://www.wikidata.org/wiki/Q193541',
  SPREADSHEET: 'https://www.wikidata.org/wiki/Q483639',
  MICROSOFT_EXCEL: 'https://www.wikidata.org/wiki/Q11255',
  PIPELINE_SALES: 'https://www.wikidata.org/wiki/Q7196563',
} as const

/**
 * Helper para criar configurações GEO rapidamente
 */
export const createGeoConfig = {
  /**
   * Configuração padrão para artigos sobre CRM
   */
  crm: (overrides?: Partial<GeoArticleConfig>): GeoArticleConfig => ({
    mentions: [
      COMMON_WIKIDATA_ENTITIES.CRM,
      COMMON_WIKIDATA_ENTITIES.BRAZIL,
    ],
    about: [COMMON_WIKIDATA_ENTITIES.CUSTOMER_RELATIONSHIP_MANAGEMENT],
    ...overrides,
  }),

  /**
   * Configuração para artigos sobre vendas/corretores
   */
  sales: (overrides?: Partial<GeoArticleConfig>): GeoArticleConfig => ({
    mentions: [
      COMMON_WIKIDATA_ENTITIES.SALES,
      COMMON_WIKIDATA_ENTITIES.BRAZIL,
      COMMON_WIKIDATA_ENTITIES.CRM,
    ],
    about: [COMMON_WIKIDATA_ENTITIES.LEAD_GENERATION],
    ...overrides,
  }),

  /**
   * Configuração para artigos sobre mercado imobiliário
   */
  realEstate: (overrides?: Partial<GeoArticleConfig>): GeoArticleConfig => ({
    mentions: [
      COMMON_WIKIDATA_ENTITIES.REAL_ESTATE_BROKER,
      COMMON_WIKIDATA_ENTITIES.SAO_PAULO,
      COMMON_WIKIDATA_ENTITIES.COMMISSION,
    ],
    about: [COMMON_WIKIDATA_ENTITIES.REAL_ESTATE],
    ...overrides,
  }),
}
