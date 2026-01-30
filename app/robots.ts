import { MetadataRoute } from 'next'

/**
 * Governança de Bots e Estratégia de Robots.txt para 2026
 *
 * Implementa "Permissão Seletiva Baseada em Valor" para maximizar
 * visibilidade em AI Answer Engines enquanto protege propriedade intelectual.
 *
 * Categorias:
 * - Search/Answer Bots: Allow (geram tráfego qualificado com citações)
 * - Hybrid Bots: Allow parcial (apenas áreas públicas)
 * - Scrapers: Disallow (custo de infra sem retorno)
 */

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sirius.roilabs.com.br'

  return {
    rules: [
      // ========================================
      // CATEGORIA: Search/Answer Bots (ALLOW)
      // ========================================

      // OpenAI SearchGPT - Indexação para respostas com link direto
      // Justificativa: Gera tráfego qualificado e citações diretas em SearchGPT
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/admin/'],
      },

      // Perplexity - Motor de resposta com alta taxa de citação
      // Justificativa: Fonte crítica de tráfego B2B técnico
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/admin/'],
      },

      // ========================================
      // CATEGORIA: Hybrid Bots (ALLOW PARCIAL)
      // ========================================

      // ChatGPT/GPT-4 - Treinamento de modelo + Navegação
      // Justificativa: Permitido apenas em /blog/ para construir autoridade
      // do modelo sobre a marca, mas bloqueado em áreas privadas
      {
        userAgent: 'GPTBot',
        allow: ['/blog/', '/help/', '/ferramentas/', '/solucoes/'],
        disallow: ['/dashboard/', '/api/', '/admin/', '/pricing', '/register'],
      },

      // Anthropic Claude - Similar ao GPTBot
      {
        userAgent: 'anthropic-ai',
        allow: ['/blog/', '/help/', '/ferramentas/', '/solucoes/'],
        disallow: ['/dashboard/', '/api/', '/admin/', '/pricing', '/register'],
      },

      // Google Gemini/Bard
      {
        userAgent: 'Google-Extended',
        allow: ['/blog/', '/help/', '/ferramentas/', '/solucoes/'],
        disallow: ['/dashboard/', '/api/', '/admin/'],
      },

      // ========================================
      // CATEGORIA: Scrapers (DISALLOW)
      // ========================================

      // Common Crawl - Coleta massiva de dados para treinamento genérico
      // Justificativa: Baixo retorno sobre o "investimento" de dados.
      // Não gera tráfego direto.
      {
        userAgent: 'CCBot',
        disallow: '/',
      },

      // ByteDance (TikTok) - Coleta agressiva para ecossistema ByteDance
      // Justificativa: Custo de infraestrutura sem retorno de tráfego B2B claro
      {
        userAgent: 'Bytespider',
        disallow: '/',
      },

      // Facebook/Meta - Scraping para treinamento de modelos
      {
        userAgent: 'FacebookBot',
        allow: ['/blog/', '/'], // Apenas páginas públicas para compartilhamento social
        disallow: ['/dashboard/', '/api/', '/admin/', '/ferramentas/'],
      },

      // ========================================
      // REGRA GERAL (Todos os outros bots)
      // ========================================

      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
