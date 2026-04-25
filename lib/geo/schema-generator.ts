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
        url: 'https://siriuscrm.com.br',
        sameAs: ['https://www.linkedin.com/company/roi-labs'],
      }

  // ISO 8601 completo com timezone Brasil (UTC-3) — requerido pelo Google Rich Results
  const toIsoDate = (date: string) =>
    date.includes('T') ? date : `${date}T00:00:00-03:00`

  // Garante que imageUrl não duplique o domínio para URLs Unsplash/externas
  const resolvedImageUrl = imageUrl
    ? (imageUrl.startsWith('http') ? imageUrl : `https://siriuscrm.com.br${imageUrl}`)
    : (post.image?.startsWith('http') ? post.image : `https://siriuscrm.com.br${post.image || '/logo.png'}`)

  // Montar schema BlogPosting
  const schema: WithContext<BlogPosting> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: resolvedImageUrl,
    datePublished: toIsoDate(post.date),
    dateModified: toIsoDate((post as any).lastModified || post.date),
    author: authorSchema,
    publisher: {
      '@type': 'Organization',
      name: 'ROI Labs',
      url: 'https://roilabs.com.br',
      logo: {
        '@type': 'ImageObject',
        url: 'https://siriuscrm.com.br/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl || `https://siriuscrm.com.br/blog/${post.slug}`,
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
 * Registro Centralizado de Entidades Wikidata
 *
 * Knowledge Graph de 100+ entidades para densidade tópica e autoridade semântica.
 * Organizado por categorias para facilitar navegação e expansão futura.
 *
 * Relacionamentos (para futuro Neo4j):
 * - CRM → subclassOf → SOFTWARE_AS_A_SERVICE
 * - SPIN_SELLING → usedIn → SALES
 * - REAL_ESTATE_BROKER → usesTool → CRM
 */
export const COMMON_WIKIDATA_ENTITIES = {
  // ============================================================================
  // METODOLOGIAS DE VENDA (Sales Methodologies)
  // ============================================================================
  SPIN_SELLING: 'https://www.wikidata.org/wiki/Q7570944', // SPIN Selling methodology
  CHALLENGER_SALE: 'https://www.wikidata.org/wiki/Q28865486', // Challenger Sale
  CONSULTATIVE_SELLING: 'https://www.wikidata.org/wiki/Q5163809', // Consultative selling
  SOLUTION_SELLING: 'https://www.wikidata.org/wiki/Q7559359', // Solution selling
  VALUE_SELLING: 'https://www.wikidata.org/wiki/Q28134488', // Value-based selling
  SANDLER_SELLING_SYSTEM: 'https://www.wikidata.org/wiki/Q7416173', // Sandler methodology

  // ============================================================================
  // SOFTWARE & TECNOLOGIA (Software & Technology)
  // ============================================================================
  CRM: 'https://www.wikidata.org/wiki/Q16635046', // CRM software
  CUSTOMER_RELATIONSHIP_MANAGEMENT: 'https://www.wikidata.org/wiki/Q177777', // CRM concept
  SOFTWARE_AS_A_SERVICE: 'https://www.wikidata.org/wiki/Q1172284', // SaaS
  ARTIFICIAL_INTELLIGENCE: 'https://www.wikidata.org/wiki/Q11660', // AI
  MACHINE_LEARNING: 'https://www.wikidata.org/wiki/Q2539', // Machine Learning
  NATURAL_LANGUAGE_PROCESSING: 'https://www.wikidata.org/wiki/Q30642', // NLP
  CHATBOT: 'https://www.wikidata.org/wiki/Q171713', // Chatbot
  AUTOMATION: 'https://www.wikidata.org/wiki/Q193292', // Automation
  WORKFLOW_AUTOMATION: 'https://www.wikidata.org/wiki/Q7982605', // Workflow automation

  // Stack Técnico
  TYPESCRIPT: 'https://www.wikidata.org/wiki/Q2334976', // TypeScript
  JAVASCRIPT: 'https://www.wikidata.org/wiki/Q2005', // JavaScript
  REACT: 'https://www.wikidata.org/wiki/Q19399674', // React.js
  NEXTJS: 'https://www.wikidata.org/wiki/Q110476280', // Next.js
  NODEJS: 'https://www.wikidata.org/wiki/Q756100', // Node.js
  POSTGRESQL: 'https://www.wikidata.org/wiki/Q192490', // PostgreSQL
  GRAPHQL: 'https://www.wikidata.org/wiki/Q27031827', // GraphQL
  REST_API: 'https://www.wikidata.org/wiki/Q1514493', // REST API
  WEBHOOK: 'https://www.wikidata.org/wiki/Q7978505', // Webhook

  // ============================================================================
  // NEGÓCIOS & VENDAS (Business & Sales)
  // ============================================================================
  SALES: 'https://www.wikidata.org/wiki/Q184753', // Sales
  MARKETING: 'https://www.wikidata.org/wiki/Q39809', // Marketing
  DIGITAL_MARKETING: 'https://www.wikidata.org/wiki/Q1323314', // Digital Marketing
  CONTENT_MARKETING: 'https://www.wikidata.org/wiki/Q5165295', // Content Marketing
  INBOUND_MARKETING: 'https://www.wikidata.org/wiki/Q1664945', // Inbound Marketing
  LEAD_GENERATION: 'https://www.wikidata.org/wiki/Q1139696', // Lead Generation
  SALES_FUNNEL: 'https://www.wikidata.org/wiki/Q7405825', // Sales Funnel
  PIPELINE_SALES: 'https://www.wikidata.org/wiki/Q7196563', // Sales Pipeline
  CONVERSION_RATE: 'https://www.wikidata.org/wiki/Q5166551', // Conversion Rate
  CUSTOMER_ACQUISITION_COST: 'https://www.wikidata.org/wiki/Q5194632', // CAC
  LIFETIME_VALUE: 'https://www.wikidata.org/wiki/Q1194764', // LTV
  RETURN_ON_INVESTMENT: 'https://www.wikidata.org/wiki/Q1052397', // ROI
  KEY_PERFORMANCE_INDICATOR: 'https://www.wikidata.org/wiki/Q604025', // KPI

  // Processos de Vendas
  PROSPECTING: 'https://www.wikidata.org/wiki/Q7251274', // Sales prospecting
  COLD_CALLING: 'https://www.wikidata.org/wiki/Q1107847', // Cold calling
  EMAIL_MARKETING: 'https://www.wikidata.org/wiki/Q1048747', // Email marketing
  FOLLOW_UP: 'https://www.wikidata.org/wiki/Q5465419', // Follow-up
  NEGOTIATION: 'https://www.wikidata.org/wiki/Q188854', // Negotiation
  CLOSING: 'https://www.wikidata.org/wiki/Q1101352', // Closing (sales)
  UPSELLING: 'https://www.wikidata.org/wiki/Q1569167', // Upselling
  CROSS_SELLING: 'https://www.wikidata.org/wiki/Q1140969', // Cross-selling
  CHURN_RATE: 'https://www.wikidata.org/wiki/Q5117870', // Churn rate
  CUSTOMER_RETENTION: 'https://www.wikidata.org/wiki/Q5195538', // Customer retention

  // ============================================================================
  // GEOGRAFIA (Geography)
  // ============================================================================
  BRAZIL: 'https://www.wikidata.org/wiki/Q155', // Brasil
  SAO_PAULO: 'https://www.wikidata.org/wiki/Q174', // São Paulo (cidade)
  SAO_PAULO_STATE: 'https://www.wikidata.org/wiki/Q175', // São Paulo (estado)
  RIO_DE_JANEIRO: 'https://www.wikidata.org/wiki/Q8678', // Rio de Janeiro
  BELO_HORIZONTE: 'https://www.wikidata.org/wiki/Q42800', // Belo Horizonte
  BRASILIA: 'https://www.wikidata.org/wiki/Q2844', // Brasília
  CURITIBA: 'https://www.wikidata.org/wiki/Q83319', // Curitiba
  PORTO_ALEGRE: 'https://www.wikidata.org/wiki/Q40269', // Porto Alegre

  // ============================================================================
  // INDÚSTRIAS & SEGMENTOS (Industries & Segments)
  // ============================================================================
  REAL_ESTATE: 'https://www.wikidata.org/wiki/Q891723', // Real Estate
  REAL_ESTATE_BROKER: 'https://www.wikidata.org/wiki/Q831663', // Real Estate Broker
  SOLAR_ENERGY: 'https://www.wikidata.org/wiki/Q47512', // Solar Energy
  RENEWABLE_ENERGY: 'https://www.wikidata.org/wiki/Q12705', // Renewable Energy
  CONSULTING: 'https://www.wikidata.org/wiki/Q4185496', // Consulting
  MANAGEMENT_CONSULTING: 'https://www.wikidata.org/wiki/Q637866', // Management Consulting
  ADVERTISING_AGENCY: 'https://www.wikidata.org/wiki/Q622425', // Advertising Agency
  DIGITAL_AGENCY: 'https://www.wikidata.org/wiki/Q1227874', // Digital Agency
  INSURANCE: 'https://www.wikidata.org/wiki/Q43183', // Insurance
  FINANCIAL_SERVICES: 'https://www.wikidata.org/wiki/Q837171', // Financial Services
  HEALTHCARE: 'https://www.wikidata.org/wiki/Q31207', // Healthcare
  EDUCATION: 'https://www.wikidata.org/wiki/Q8434', // Education
  RETAIL: 'https://www.wikidata.org/wiki/Q194326', // Retail
  E_COMMERCE: 'https://www.wikidata.org/wiki/Q484847', // E-commerce

  // ============================================================================
  // PERSONAS & PROFISSÕES (Personas & Professions)
  // ============================================================================
  SALES_REPRESENTATIVE: 'https://www.wikidata.org/wiki/Q7406035', // Sales Representative
  SALES_MANAGER: 'https://www.wikidata.org/wiki/Q7406029', // Sales Manager
  ACCOUNT_EXECUTIVE: 'https://www.wikidata.org/wiki/Q378251', // Account Executive
  BUSINESS_DEVELOPMENT: 'https://www.wikidata.org/wiki/Q910363', // Business Development
  ENTREPRENEUR: 'https://www.wikidata.org/wiki/Q131524', // Entrepreneur
  CHIEF_EXECUTIVE_OFFICER: 'https://www.wikidata.org/wiki/Q484876', // CEO
  CHIEF_TECHNOLOGY_OFFICER: 'https://www.wikidata.org/wiki/Q623752', // CTO
  MARKETING_MANAGER: 'https://www.wikidata.org/wiki/Q1259917', // Marketing Manager
  PRODUCT_MANAGER: 'https://www.wikidata.org/wiki/Q1415352', // Product Manager
  SOFTWARE_DEVELOPER: 'https://www.wikidata.org/wiki/Q183888', // Software Developer

  // ============================================================================
  // CONCEITOS DE NEGÓCIO (Business Concepts)
  // ============================================================================
  COMMISSION: 'https://www.wikidata.org/wiki/Q193541', // Commission
  SPREADSHEET: 'https://www.wikidata.org/wiki/Q483639', // Spreadsheet
  MICROSOFT_EXCEL: 'https://www.wikidata.org/wiki/Q11255', // Microsoft Excel
  GOOGLE_SHEETS: 'https://www.wikidata.org/wiki/Q205663', // Google Sheets
  DASHBOARD: 'https://www.wikidata.org/wiki/Q601837', // Dashboard
  ANALYTICS: 'https://www.wikidata.org/wiki/Q217602', // Analytics
  DATA_VISUALIZATION: 'https://www.wikidata.org/wiki/Q6504956', // Data Visualization
  BUSINESS_INTELLIGENCE: 'https://www.wikidata.org/wiki/Q205663', // Business Intelligence
  PREDICTIVE_ANALYTICS: 'https://www.wikidata.org/wiki/Q7240923', // Predictive Analytics

  // Métricas & KPIs
  REVENUE: 'https://www.wikidata.org/wiki/Q131682', // Revenue
  PROFIT: 'https://www.wikidata.org/wiki/Q177380', // Profit
  GROSS_MARGIN: 'https://www.wikidata.org/wiki/Q1544753', // Gross Margin
  NET_PROMOTER_SCORE: 'https://www.wikidata.org/wiki/Q909206', // NPS
  CUSTOMER_SATISFACTION: 'https://www.wikidata.org/wiki/Q1200418', // Customer Satisfaction
  MONTHLY_RECURRING_REVENUE: 'https://www.wikidata.org/wiki/Q6905454', // MRR
  ANNUAL_RECURRING_REVENUE: 'https://www.wikidata.org/wiki/Q106688642', // ARR

  // ============================================================================
  // FERRAMENTAS & INTEGRAÇÕES (Tools & Integrations)
  // ============================================================================
  GOOGLE_CALENDAR: 'https://www.wikidata.org/wiki/Q94832', // Google Calendar
  GMAIL: 'https://www.wikidata.org/wiki/Q9334', // Gmail
  WHATSAPP: 'https://www.wikidata.org/wiki/Q301053', // WhatsApp
  SLACK: 'https://www.wikidata.org/wiki/Q17059452', // Slack
  ZOOM: 'https://www.wikidata.org/wiki/Q19844930', // Zoom
  MICROSOFT_TEAMS: 'https://www.wikidata.org/wiki/Q28406404', // Microsoft Teams
  ZAPIER: 'https://www.wikidata.org/wiki/Q8065480', // Zapier
  MAKE: 'https://www.wikidata.org/wiki/Q30593569', // Make (formerly Integromat)
  STRIPE: 'https://www.wikidata.org/wiki/Q4024370', // Stripe
  PAYPAL: 'https://www.wikidata.org/wiki/Q483959', // PayPal

  // ============================================================================
  // CONCEITOS DE PRODUTO (Product Concepts)
  // ============================================================================
  KANBAN: 'https://www.wikidata.org/wiki/Q747892', // Kanban
  AGILE_SOFTWARE_DEVELOPMENT: 'https://www.wikidata.org/wiki/Q291043', // Agile
  SCRUM: 'https://www.wikidata.org/wiki/Q207909', // Scrum
  USER_EXPERIENCE: 'https://www.wikidata.org/wiki/Q182668', // UX
  USER_INTERFACE: 'https://www.wikidata.org/wiki/Q782543', // UI
  PRODUCT_LIFECYCLE: 'https://www.wikidata.org/wiki/Q1152135', // Product Lifecycle
  MINIMUM_VIABLE_PRODUCT: 'https://www.wikidata.org/wiki/Q1154697', // MVP
  PRODUCT_MARKET_FIT: 'https://www.wikidata.org/wiki/Q7247992', // Product-Market Fit

  // ============================================================================
  // COMUNICAÇÃO & CONTEÚDO (Communication & Content)
  // ============================================================================
  BLOG: 'https://www.wikidata.org/wiki/Q30849', // Blog
  WEBINAR: 'https://www.wikidata.org/wiki/Q926368', // Webinar
  PODCAST: 'https://www.wikidata.org/wiki/Q24634210', // Podcast
  VIDEO: 'https://www.wikidata.org/wiki/Q34508', // Video
  YOUTUBE: 'https://www.wikidata.org/wiki/Q866', // YouTube
  LINKEDIN: 'https://www.wikidata.org/wiki/Q213660', // LinkedIn
  INSTAGRAM: 'https://www.wikidata.org/wiki/Q209330', // Instagram
  FACEBOOK: 'https://www.wikidata.org/wiki/Q380', // Facebook
  TWITTER: 'https://www.wikidata.org/wiki/Q918', // Twitter/X
} as const

/**
 * Helpers GEO para criação rápida de configurações por contexto
 *
 * Cada helper retorna uma configuração pré-populada com entidades relevantes,
 * acelerando a marcação semântica de conteúdo.
 */
export const createGeoConfig = {
  /**
   * Artigos sobre CRM e gestão de relacionamento com clientes
   */
  crm: (overrides?: Partial<GeoArticleConfig>): GeoArticleConfig => ({
    mentions: [
      COMMON_WIKIDATA_ENTITIES.CRM,
      COMMON_WIKIDATA_ENTITIES.BRAZIL,
      COMMON_WIKIDATA_ENTITIES.SOFTWARE_AS_A_SERVICE,
    ],
    about: [COMMON_WIKIDATA_ENTITIES.CUSTOMER_RELATIONSHIP_MANAGEMENT],
    ...overrides,
  }),

  /**
   * Artigos sobre processos e metodologias de vendas
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
   * Artigos sobre mercado imobiliário e corretores
   */
  realEstate: (overrides?: Partial<GeoArticleConfig>): GeoArticleConfig => ({
    mentions: [
      COMMON_WIKIDATA_ENTITIES.REAL_ESTATE_BROKER,
      COMMON_WIKIDATA_ENTITIES.SAO_PAULO,
      COMMON_WIKIDATA_ENTITIES.COMMISSION,
      COMMON_WIKIDATA_ENTITIES.CRM,
    ],
    about: [COMMON_WIKIDATA_ENTITIES.REAL_ESTATE],
    ...overrides,
  }),

  /**
   * Artigos sobre SPIN Selling e metodologias consultivas
   */
  spinSelling: (overrides?: Partial<GeoArticleConfig>): GeoArticleConfig => ({
    mentions: [
      COMMON_WIKIDATA_ENTITIES.SPIN_SELLING,
      COMMON_WIKIDATA_ENTITIES.CONSULTATIVE_SELLING,
      COMMON_WIKIDATA_ENTITIES.SALES,
    ],
    about: [COMMON_WIKIDATA_ENTITIES.SPIN_SELLING],
    ...overrides,
  }),

  /**
   * Artigos sobre stack técnico (TypeScript, React, Next.js)
   */
  techStack: (overrides?: Partial<GeoArticleConfig>): GeoArticleConfig => ({
    mentions: [
      COMMON_WIKIDATA_ENTITIES.TYPESCRIPT,
      COMMON_WIKIDATA_ENTITIES.REACT,
      COMMON_WIKIDATA_ENTITIES.NEXTJS,
    ],
    about: [COMMON_WIKIDATA_ENTITIES.SOFTWARE_AS_A_SERVICE],
    ...overrides,
  }),

  /**
   * Artigos sobre automação e IA
   */
  automation: (overrides?: Partial<GeoArticleConfig>): GeoArticleConfig => ({
    mentions: [
      COMMON_WIKIDATA_ENTITIES.AUTOMATION,
      COMMON_WIKIDATA_ENTITIES.ARTIFICIAL_INTELLIGENCE,
      COMMON_WIKIDATA_ENTITIES.WORKFLOW_AUTOMATION,
    ],
    about: [COMMON_WIKIDATA_ENTITIES.AUTOMATION],
    ...overrides,
  }),

  /**
   * Artigos sobre métricas e KPIs de vendas
   */
  metrics: (overrides?: Partial<GeoArticleConfig>): GeoArticleConfig => ({
    mentions: [
      COMMON_WIKIDATA_ENTITIES.KEY_PERFORMANCE_INDICATOR,
      COMMON_WIKIDATA_ENTITIES.RETURN_ON_INVESTMENT,
      COMMON_WIKIDATA_ENTITIES.CONVERSION_RATE,
    ],
    about: [COMMON_WIKIDATA_ENTITIES.ANALYTICS],
    ...overrides,
  }),

  /**
   * Artigos sobre energia solar
   */
  solarEnergy: (overrides?: Partial<GeoArticleConfig>): GeoArticleConfig => ({
    mentions: [
      COMMON_WIKIDATA_ENTITIES.SOLAR_ENERGY,
      COMMON_WIKIDATA_ENTITIES.RENEWABLE_ENERGY,
      COMMON_WIKIDATA_ENTITIES.BRAZIL,
    ],
    about: [COMMON_WIKIDATA_ENTITIES.SOLAR_ENERGY],
    ...overrides,
  }),

  /**
   * Artigos sobre agências (marketing/publicidade)
   */
  agencies: (overrides?: Partial<GeoArticleConfig>): GeoArticleConfig => ({
    mentions: [
      COMMON_WIKIDATA_ENTITIES.DIGITAL_AGENCY,
      COMMON_WIKIDATA_ENTITIES.ADVERTISING_AGENCY,
      COMMON_WIKIDATA_ENTITIES.MARKETING,
    ],
    about: [COMMON_WIKIDATA_ENTITIES.DIGITAL_MARKETING],
    ...overrides,
  }),

  /**
   * Artigos sobre pipeline de vendas e funil
   */
  pipeline: (overrides?: Partial<GeoArticleConfig>): GeoArticleConfig => ({
    mentions: [
      COMMON_WIKIDATA_ENTITIES.PIPELINE_SALES,
      COMMON_WIKIDATA_ENTITIES.SALES_FUNNEL,
      COMMON_WIKIDATA_ENTITIES.KANBAN,
    ],
    about: [COMMON_WIKIDATA_ENTITIES.SALES],
    ...overrides,
  }),
}
