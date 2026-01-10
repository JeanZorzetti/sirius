import { MetadataRoute } from 'next'
import { blogPosts } from '@/lib/blog-data'

// Type guard to filter out undefined posts
function isValidPost(post: any): post is NonNullable<typeof post> & { slug: string; date: string } {
    return post != null && typeof post.slug === 'string' && typeof post.date === 'string'
}

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
    const posts = blogPosts
        .filter(isValidPost)
        .map((post) => ({
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: new Date(post.date),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }))

    return [...routes, ...posts]
}
