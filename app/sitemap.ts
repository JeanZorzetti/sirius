import { MetadataRoute } from 'next'
import { blogPosts } from '@/lib/blog-data'
import { helpArticles } from '@/lib/help-articles'
import { NICHES } from '@/config/niche-data'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sirius.roilabs.com.br'

    // Static routes
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
    const posts = blogPosts.map((post) => ({
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: new Date(post.date),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }))

    // Help articles (23 artigos)
    const helpArticlePages = helpArticles.map((article) => ({
        url: `${baseUrl}/help/${article.categorySlug}/${article.slug}`,
        lastModified: new Date(article.lastUpdated),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
    }))

    // Calculadoras segmentadas por nicho
    const calculatorPages = [
        '/ferramentas/calculadora-roi',
        '/ferramentas/calculadora-roi-corretores',
        '/ferramentas/calculadora-roi-energia-solar',
        '/ferramentas/calculadora-roi-agencias',
        '/ferramentas/calculadora-roi-consultores',
        '/ferramentas/calculadora-roi-representantes',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
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
