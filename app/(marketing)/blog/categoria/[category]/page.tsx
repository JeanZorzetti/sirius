import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  blogPosts,
  getAllCategories,
  getPostsByCategory,
  slugifyCategory,
  getCategoryFromSlug,
} from '@/lib/blog-data'
import { ArrowLeft, ArrowRight, Clock, Tag, BookOpen } from 'lucide-react'

// Generate static params for all existing categories
export function generateStaticParams() {
  const categories = getAllCategories()
  return categories.map((category) => ({
    category: slugifyCategory(category),
  }))
}

// Generate metadata per category
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category: categorySlug } = await params
  const categoryName = getCategoryFromSlug(categorySlug)

  if (!categoryName) {
    return { title: 'Categoria não encontrada' }
  }

  const posts = getPostsByCategory(categoryName)
  const title = `${categoryName} | Blog Sirius CRM`
  const description = `Artigos sobre ${categoryName.toLowerCase()}: ${posts
    .slice(0, 3)
    .map((p) => p.title)
    .join(', ')}. Dicas e estratégias para vendedores e times comerciais.`

  return {
    title,
    description,
    alternates: {
      canonical: `https://sirius.roilabs.com.br/blog/categoria/${categorySlug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://sirius.roilabs.com.br/blog/categoria/${categorySlug}`,
    },
  }
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category: categorySlug } = await params
  const categoryName = getCategoryFromSlug(categorySlug)

  if (!categoryName) {
    notFound()
  }

  const posts = getPostsByCategory(categoryName)
  const allCategories = getAllCategories()

  // BreadcrumbList JSON-LD schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: 'https://sirius.roilabs.com.br',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://sirius.roilabs.com.br/blog',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryName,
        item: `https://sirius.roilabs.com.br/blog/categoria/${categorySlug}`,
      },
    ],
  }

  // CollectionPage schema for this category
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `https://sirius.roilabs.com.br/blog/categoria/${categorySlug}`,
    name: `${categoryName} — Blog Sirius CRM`,
    description: `Artigos sobre ${categoryName.toLowerCase()} para vendedores e times comerciais.`,
    url: `https://sirius.roilabs.com.br/blog/categoria/${categorySlug}`,
    hasPart: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      url: `https://sirius.roilabs.com.br/blog/${post.slug}`,
      datePublished: post.date,
      dateModified: post.lastModified || post.date,
      author: {
        '@type': 'Person',
        name: post.author || 'Sirius Team',
      },
    })),
  }

  return (
    <>
      <Script
        id="breadcrumb-category-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="collection-category-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <div className="min-h-screen">
        {/* Header */}
        <section className="container mx-auto px-4 pt-24 sm:pt-32 pb-8">
          <div className="mx-auto max-w-4xl">
            {/* Back link */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao blog
            </Link>

            <div className="relative text-center">
              {/* Decorative gradient blur */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-150 h-150 bg-linear-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl -z-10" />

              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
                <Tag className="w-3 h-3 mr-1.5" />
                {categoryName}
              </Badge>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-linear-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent mb-4">
                {categoryName}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {posts.length} {posts.length === 1 ? 'artigo' : 'artigos'} sobre{' '}
                {categoryName.toLowerCase()}
              </p>
            </div>
          </div>
        </section>

        {/* Category navigation */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex gap-2 overflow-x-auto scrollbar-hide" aria-label="Categorias do blog">
              <Link href="/blog">
                <Badge
                  variant="outline"
                  className="cursor-pointer whitespace-nowrap transition-all duration-300 hover:bg-primary/10"
                >
                  Todos
                </Badge>
              </Link>
              {allCategories.map((cat) => (
                <Link key={cat} href={`/blog/categoria/${slugifyCategory(cat)}`}>
                  <Badge
                    variant={cat === categoryName ? 'default' : 'outline'}
                    className={`cursor-pointer whitespace-nowrap transition-all duration-300 ${
                      cat === categoryName
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-primary/10'
                    }`}
                  >
                    {cat}
                  </Badge>
                </Link>
              ))}
            </nav>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="container mx-auto px-4 py-16">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                Nenhum artigo encontrado nesta categoria.
              </p>
              <Link href="/blog">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Ver todos os artigos
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="block h-full group">
                  <Card className="h-full flex flex-col relative overflow-hidden border-border/50 bg-card hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-500 ease-out rounded-2xl p-6">
                    {/* Animated border gradient */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl -z-10" />

                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-4">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>

                    <CardHeader className="relative z-10 flex-none space-y-3 p-0 mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {post.category}
                        </Badge>
                      </div>

                      <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2">
                        {post.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="relative z-10 flex-1 p-0 mb-4">
                      <p className="text-muted-foreground leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    </CardContent>

                    <CardFooter className="relative z-10 flex-none p-0 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{post.date}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="group/btn p-0 h-auto hover:bg-transparent hover:text-primary"
                      >
                        <span className="flex items-center gap-1">
                          Ler
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                        </span>
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
