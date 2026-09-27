import { blogPosts, getAllCategories, slugifyCategory } from '@/lib/blog-data'
import { BlogIndex } from '@/components/blog/blog-index'

// Server side on purpose: the posts carry their full bodies, and only the card fields cross to the client (spec 006)
export default function BlogPage() {
  const posts = blogPosts.map(({ slug, title, titleEn, excerpt, excerptEn, category, date, image }) => ({
    slug, title, titleEn, excerpt, excerptEn, category, date, image,
  }))
  const categoryLinks = getAllCategories().map(name => ({ name, slug: slugifyCategory(name) }))

  // /blog only: in the layout these reached every post and category, with a second breadcrumb
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
      <script
        id="collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        id="breadcrumb-blog-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BlogIndex posts={posts} categoryLinks={categoryLinks} />
    </>
  )
}
