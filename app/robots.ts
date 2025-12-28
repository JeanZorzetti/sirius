import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sirius.roilabs.com.br'

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/dashboard/', // Don't index the dashboard
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
