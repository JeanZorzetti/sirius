import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import Script from 'next/script'
import { blogPosts } from '@/lib/blog-data'

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing.blog.meta' })
  const baseUrl = 'https://siriuscrm.com.br'
  const canonicalUrl = locale === 'en' ? `${baseUrl}/en/blog` : `${baseUrl}/blog`

  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      url: canonicalUrl,
    },
  }
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://siriuscrm.com.br/blog",
    "name": "Blog Sirius CRM",
    "description": "Artigos sobre vendas, CRM, pipeline, SPIN Selling, automação e gestão comercial para vendedores e times de alta performance.",
    "url": "https://siriuscrm.com.br/blog",
    "hasPart": blogPosts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "url": `https://siriuscrm.com.br/blog/${post.slug}`,
      "datePublished": post.date,
      "dateModified": post.lastModified || post.date,
      "author": {
        "@type": "Person",
        "name": post.author || "Sirius Team"
      }
    }))
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Início", "item": "https://siriuscrm.com.br" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://siriuscrm.com.br/blog" },
    ]
  }

  return (
    <>
      <Script
        id="collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <Script
        id="breadcrumb-blog-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  )
}
