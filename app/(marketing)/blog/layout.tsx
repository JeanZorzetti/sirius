import { Metadata } from 'next'
import Script from 'next/script'
import { blogPosts } from '@/lib/blog-data'

export const metadata: Metadata = {
  title: 'Blog | Sirius CRM — Dicas de Vendas, CRM e Gestão Comercial',
  description: 'Artigos sobre vendas, CRM, pipeline, SPIN Selling, automação e gestão comercial para vendedores e times de alta performance.',
  alternates: { canonical: 'https://sirius.roilabs.com.br/blog' },
  openGraph: {
    title: 'Blog | Sirius CRM — Dicas de Vendas e Gestão Comercial',
    description: 'Artigos sobre vendas, CRM, pipeline, SPIN Selling, automação e gestão comercial para times de alta performance.',
    url: 'https://sirius.roilabs.com.br/blog',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // CollectionPage JSON-LD schema para listagem de blog
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://sirius.roilabs.com.br/blog",
    "name": "Blog Sirius CRM",
    "description": "Artigos sobre vendas, CRM, pipeline, SPIN Selling, automação e gestão comercial para vendedores e times de alta performance.",
    "url": "https://sirius.roilabs.com.br/blog",
    "hasPart": blogPosts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "url": `https://sirius.roilabs.com.br/blog/${post.slug}`,
      "datePublished": post.date,
      "dateModified": post.lastModified || post.date,
      "author": {
        "@type": "Person",
        "name": post.author || "Sirius Team"
      }
    }))
  }

  return (
    <>
      <Script
        id="collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      {children}
    </>
  )
}
