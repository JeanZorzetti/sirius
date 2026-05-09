import { MetadataRoute } from 'next'
import { blogPosts, getAllCategories, slugifyCategory } from '@/lib/blog-data'
import { helpArticles } from '@/lib/help-articles'
import { NICHES } from '@/config/niche-data'
import { CITIES } from '@/config/city-data'
import { CALCULATOR_LAST_MODIFIED } from '@/config/calculator-metadata'

export default function sitemap(): MetadataRoute.Sitemap {
    const rawUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    // Never use localhost in the sitemap — always fall back to the real domain
    const baseUrl = rawUrl.startsWith('http') && !rawUrl.includes('localhost')
        ? rawUrl
        : 'https://siriuscrm.com.br'

    // Data da última atualização significativa do site
    // Atualizar manualmente quando houver mudanças reais nas páginas estáticas
    const lastSiteUpdate = new Date('2026-03-20')

    // Static routes
    // Priorização Hierárquica (Seção 7.2):
    // - Homepage (1.0): Ponto central da marca
    // - Ferramentas/Conversão (0.9): Ativos de engajamento e conversão
    // - Demais páginas (0.8): Conteúdo de suporte
    // Helper to build alternates for a PT-BR path and its EN equivalent
    const withAlternates = (ptPath: string, enPath?: string) => {
        const enRoute = enPath ?? ptPath // same path if no EN equivalent
        return {
            alternates: {
                languages: {
                    'pt-BR': `${baseUrl}${ptPath}`,
                    'en': `${baseUrl}/en${enRoute}`,
                    'x-default': `${baseUrl}${ptPath}`,
                },
            },
        }
    }

    const STATIC_ROUTES: { pt: string; en?: string; priority?: number }[] = [
        { pt: '' },
        { pt: '/features', priority: 0.9 },
        { pt: '/pricing', priority: 0.9 },
        { pt: '/blog' },
        { pt: '/about' },
        { pt: '/help' },
        { pt: '/privacy' },
        { pt: '/terms' },
        { pt: '/changelog' },
        { pt: '/community' },
        { pt: '/contact' },
        { pt: '/download' },
        { pt: '/followup' },
        { pt: '/proposta', en: '/proposal' },
        { pt: '/vendas-automaticas', en: '/automatic-sales', priority: 0.9 },
        { pt: '/fundadores', en: '/founders', priority: 0.9 },
        { pt: '/ferramentas', en: '/tools', priority: 0.9 },
        { pt: '/anuario', en: '/yearbook' },
    ]

    const routes = STATIC_ROUTES.map(({ pt, en, priority }) => ({
        url: `${baseUrl}${pt}`,
        lastModified: lastSiteUpdate,
        changeFrequency: 'monthly' as const,
        priority: priority ?? (pt === '' ? 1 : 0.8),
        ...withAlternates(pt, en),
    }))

    // Dynamic blog posts
    // Priority 0.8: Conteúdo de suporte e autoridade (Seção 7.2)
    // lastModified: Usa data de modificação quando disponível, senão usa data de publicação
    // Isso sinaliza para crawlers que o conteúdo está "vivo" e deve ser reprocessado
    const posts = blogPosts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.lastModified || post.date),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        ...withAlternates(`/blog/${post.slug}`),
    }))

    // Help articles — com alternates EN (/en/help/[category]/[slug])
    const helpArticlePages = helpArticles.map((article) => ({
        url: `${baseUrl}/help/${article.categorySlug}/${article.slug}`,
        lastModified: new Date(article.lastUpdated),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        ...withAlternates(
            `/help/${article.categorySlug}/${article.slug}`,
            `/help/${article.categorySlug}/${article.slug}`
        ),
    }))

    // Calculadoras — mapeamento PT→EN conforme i18n/routing.ts
    const calculatorMap: Record<string, string> = {
        '/ferramentas/calculadora-roi': '/tools/roi-calculator',
        '/ferramentas/calculadora-roi-corretores': '/tools/roi-calculator-brokers',
        '/ferramentas/calculadora-roi-energia-solar': '/tools/roi-calculator-solar',
        '/ferramentas/calculadora-roi-agencias': '/tools/roi-calculator-agencies',
        '/ferramentas/calculadora-roi-consultores': '/tools/roi-calculator-consultants',
        '/ferramentas/calculadora-roi-representantes': '/tools/roi-calculator-representatives',
    }
    const calculatorPages = Object.entries(calculatorMap).map(([ptRoute, enRoute]) => ({
        url: `${baseUrl}${ptRoute}`,
        lastModified: new Date(CALCULATOR_LAST_MODIFIED),
        changeFrequency: 'monthly' as const,
        priority: 0.9,
        ...withAlternates(ptRoute, enRoute),
    }))

    // Páginas de soluções por nicho (geradas dinamicamente do niche-data.ts)
    const nicheSolutionPages = NICHES.map((niche) => ({
        url: `${baseUrl}/solucoes/${niche.slug}`,
        lastModified: lastSiteUpdate,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
        ...withAlternates(`/solucoes/${niche.slug}`, `/solutions/${niche.slug}`),
    }))

    // City pages are Brazilian-only — no EN alternate in sitemap
    const citySolutionPages = CITIES.map((city) => ({
        url: `${baseUrl}/solucoes/cidade/${city.slug}`,
        lastModified: lastSiteUpdate,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
        alternates: {
            languages: {
                'pt-BR': `${baseUrl}/solucoes/cidade/${city.slug}`,
                'x-default': `${baseUrl}/solucoes/cidade/${city.slug}`,
            },
        },
    }))

    // Blog category pages — com alternates EN (/en/blog/category/[slug])
    const blogCategoryPages = getAllCategories().map((category) => {
        const slug = slugifyCategory(category)
        return {
            url: `${baseUrl}/blog/categoria/${slug}`,
            lastModified: lastSiteUpdate,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
            ...withAlternates(`/blog/categoria/${slug}`, `/blog/category/${slug}`),
        }
    })

    return [
        ...routes,
        ...posts,
        ...blogCategoryPages,
        ...helpArticlePages,
        ...calculatorPages,
        ...nicheSolutionPages,
        ...citySolutionPages,
    ]
}
