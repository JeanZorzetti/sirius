import { MetadataRoute } from 'next'
import { blogPosts } from '@/lib/blog-data'
import { helpArticles } from '@/lib/help-articles'

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
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1 : 0.8,
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

    return [...routes, ...posts, ...helpArticlePages]
}
