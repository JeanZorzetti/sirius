import { BlogPost } from '../blog-types'
import { post as post1 } from './posts/como-organizar-pipeline-vendas'
import { post as post2 } from './posts/crm-simples-vs-complexo'
import { post as post3 } from './posts/poder-do-follow-up'
import { post as post4 } from './posts/funil-de-vendas-guia-completo'
import { post as post5 } from './posts/spin-selling-guia-completo'
import { post as post6 } from './posts/custo-oculto-inacao-crm'
import { post as post7 } from './posts/planilha-controle-comissao-corretor'
import { post as post8 } from './posts/crm-ia-inteligencia-artificial-2026'
import { post as post9 } from './posts/crm-automacao-vendas-guia-completo'
import { post as post10 } from './posts/melhor-crm-2026-comparativo'
import { post as post11 } from './posts/prospeccao-de-clientes-b2b'
import { post as post12 } from './posts/tecnicas-de-fechamento-de-vendas'
import { post as post13 } from './posts/como-superar-objecoes-em-vendas'
import { post as post14 } from './posts/kpis-de-vendas'
import { post as post15 } from './posts/erros-crm-comuns'
import { post as post16 } from './posts/como-escolher-crm-b2b-2026'
import { post as post17 } from './posts/crm-para-representante-comercial-2026'
import { post as post18 } from './posts/como-organizar-carteira-clientes-representante'
import { post as post19 } from './posts/crm-offline-para-vendedores'
import { post as post20 } from './posts/bant-vs-meddic-qualificacao-leads'
import { post as post21 } from './posts/como-usar-google-maps-para-prospectar'
import { post as post22 } from './posts/crm-com-whatsapp-integrado'
import { post as post23 } from './posts/ia-para-qualificacao-de-leads'
import { post as post24 } from './posts/scraping-etico-vs-compra-de-listas'
import { post as post25 } from './posts/prospeccao-linkedin-vendedores-b2b'
import { post as post26 } from './posts/sandler-selling-system'
import { post as post27 } from './posts/sales-intelligence-ia-vendas-2026'
import { post as post28 } from './posts/sirius-vs-pipedrive'
import { post as post29 } from './posts/sirius-vs-rd-station'
import { post as post30 } from './posts/sirius-vs-hubspot'
import { post as post31 } from './posts/alternativas-ao-pipedrive-brasil'
import { post as post32 } from './posts/representante-comercial-autonomo-ferramentas'
import { post as post33 } from './posts/automacao-email-para-vendedores'
import { post as post34 } from './posts/crm-gratuito-brasil-2026'

export const blogPosts: BlogPost[] = [
  post1,
  post2,
  post3,
  post4,
  post5,
  post6,
  post7,
  post8,
  post9,
  post10,
  post11,
  post12,
  post13,
  post14,
  post15,
  post16,
  post17,
  post18,
  post19,
  post20,
  post21,
  post22,
  post23,
  post24,
  post25,
  post26,
  post27,
  post28,
  post29,
  post30,
  post31,
  post32,
  post33,
  post34,
]

/**
 * Slugify a category name for URL usage.
 * "Vendas" → "vendas", "Gestão" → "gestao", "ROI e Estratégia" → "roi-e-estrategia"
 */
export function slugifyCategory(category: string): string {
  return category
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]+/g, '-')    // replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, '')        // trim leading/trailing hyphens
}

/**
 * Get all unique categories from blog posts.
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(blogPosts.map(post => post.category)))
}

/**
 * Get posts filtered by category name (exact match).
 * Returns posts sorted by date (most recent first).
 */
export function getPostsByCategory(category: string): BlogPost[] {
  return blogPosts
    .filter(post => post.category === category)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Find the original category name from its slug.
 * Returns undefined if not found.
 */
export function getCategoryFromSlug(slug: string): string | undefined {
  const categories = getAllCategories()
  return categories.find(cat => slugifyCategory(cat) === slug)
}
