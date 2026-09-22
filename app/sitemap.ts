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

    // Data da última atualização significativa do site — derivada do conteúdo
    // mais recente publicado (blog/help/calculadoras), com clamp em "agora" para
    // nunca emitir <lastmod> no futuro. Substitui a data fixa que envelhecia sozinha (FR-009).
    const contentTimes = [
        ...blogPosts.map((p) => new Date(p.lastModified || p.date).getTime()),
        ...helpArticles.map((a) => new Date(a.lastUpdated).getTime()),
        new Date(CALCULATOR_LAST_MODIFIED).getTime(),
    ].filter((t) => Number.isFinite(t))
    const lastSiteUpdate = contentTimes.length
        ? new Date(Math.min(Date.now(), Math.max(...contentTimes)))
        : new Date()

    // Static routes
    // Priorização Hierárquica (Seção 7.2):
    // - Homepage (1.0): Ponto central da marca
    // - Ferramentas/Conversão (0.9): Ativos de engajamento e conversão
    // - Demais páginas (0.8): Conteúdo de suporte
    // O locale EN foi aposentado (spec 004). Com um idioma só não existe hreflang:
    // um mapa `languages` que só aponta para si mesmo é byte morto em ~200 entradas.
    // Nenhuma entrada deste sitemap tem `alternates`.
    const STATIC_ROUTES: { pt: string; priority?: number }[] = [
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
        { pt: '/proposta' },
        { pt: '/vendas-automaticas', priority: 0.9 },
        { pt: '/ferramentas', priority: 0.9 },
        { pt: '/anuario' },
    ]

    const routes = STATIC_ROUTES.map(({ pt, priority }) => ({
        url: `${baseUrl}${pt}`,
        lastModified: lastSiteUpdate,
        changeFrequency: 'monthly' as const,
        priority: priority ?? (pt === '' ? 1 : 0.8),
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
    }))

    const helpArticlePages = helpArticles.map((article) => ({
        url: `${baseUrl}/help/${article.categorySlug}/${article.slug}`,
        lastModified: new Date(article.lastUpdated),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }))

    const CALCULATOR_ROUTES = [
        '/ferramentas/calculadora-roi',
        '/ferramentas/calculadora-roi-corretores',
        '/ferramentas/calculadora-roi-energia-solar',
        '/ferramentas/calculadora-roi-agencias',
        '/ferramentas/calculadora-roi-consultores',
        '/ferramentas/calculadora-roi-representantes',
    ]
    const calculatorPages = CALCULATOR_ROUTES.map((ptRoute) => ({
        url: `${baseUrl}${ptRoute}`,
        lastModified: new Date(CALCULATOR_LAST_MODIFIED),
        changeFrequency: 'monthly' as const,
        priority: 0.9,
    }))

    // Páginas de soluções por nicho (geradas dinamicamente do niche-data.ts)
    const nicheSolutionPages = NICHES.map((niche) => ({
        url: `${baseUrl}/solucoes/${niche.slug}`,
        lastModified: lastSiteUpdate,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }))

    const citySolutionPages = CITIES.map((city) => ({
        url: `${baseUrl}/solucoes/cidade/${city.slug}`,
        lastModified: lastSiteUpdate,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
    }))

    const blogCategoryPages = getAllCategories().map((category) => {
        const slug = slugifyCategory(category)
        return {
            url: `${baseUrl}/blog/categoria/${slug}`,
            lastModified: lastSiteUpdate,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
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
