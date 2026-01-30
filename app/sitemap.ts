import { MetadataRoute } from 'next'
import { blogPosts } from '@/lib/blog-data'
import { helpArticles } from '@/lib/help-articles'
import { NICHES } from '@/config/niche-data'
import { CALCULATOR_LAST_MODIFIED } from '@/config/calculator-metadata'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sirius.roilabs.com.br'

    // Static routes
    // Priorização Hierárquica (Seção 7.2):
    // - Homepage (1.0): Ponto central da marca
    // - Ferramentas/Conversão (0.9): Ativos de engajamento e conversão
    // - Demais páginas (0.8): Conteúdo de suporte
    const routes = [
        '',
        '/features',
        '/pricing',
        '/blog',
        '/login',
        '/register',
        '/about',
        '/help',
        '/privacy',
        '/terms',
        '/changelog',
        '/community',
        '/vendas-automaticas',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1 : route === '/vendas-automaticas' ? 0.9 : 0.8,
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

    // Help articles (23 artigos)
    const helpArticlePages = helpArticles.map((article) => ({
        url: `${baseUrl}/help/${article.categorySlug}/${article.slug}`,
        lastModified: new Date(article.lastUpdated),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }))

    // Calculadoras segmentadas por nicho
    // Priority 0.9: Alta prioridade - "Honey Traps" de engajamento (Seção 7.2)
    // Ativos técnicos de conversão devem ser indexados preferencialmente
    // lastModified: Conectado à data de atualização metodológica (Seção 7.1)
    // Quando a metodologia da calculadora é atualizada (ex: constante de decaimento refinada),
    // esta data sinaliza aos crawlers que o conteúdo deve ser reprocessado
    const calculatorPages = [
        '/ferramentas/calculadora-roi',
        '/ferramentas/calculadora-roi-corretores',
        '/ferramentas/calculadora-roi-energia-solar',
        '/ferramentas/calculadora-roi-agencias',
        '/ferramentas/calculadora-roi-consultores',
        '/ferramentas/calculadora-roi-representantes',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(CALCULATOR_LAST_MODIFIED),
        changeFrequency: 'monthly' as const,
        priority: 0.9,
    }))

    // Páginas de soluções por nicho (geradas dinamicamente do niche-data.ts)
    const nicheSolutionPages = NICHES.map((niche) => ({
        url: `${baseUrl}/solucoes/${niche.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9, // Alta prioridade - páginas de conversão principais
    }))

    return [
        ...routes,
        ...posts,
        ...helpArticlePages,
        ...calculatorPages,
        ...nicheSolutionPages,
    ]
}
