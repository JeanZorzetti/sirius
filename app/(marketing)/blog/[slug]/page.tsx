import { notFound } from 'next/navigation'
import Link from 'next/link'
import { blogPosts } from '@/lib/blog-data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareButtons } from '@/components/blog/share-buttons'
import { TableOfContents } from '@/components/blog/table-of-contents'
import { BlogContentWrapper } from '@/components/blog/blog-content-wrapper'
import { Metadata } from 'next'
import { ChevronLeft, ChevronRight, Calendar, Clock, User } from 'lucide-react'

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

// Type guard to filter out undefined posts
function isValidPost(post: any): post is NonNullable<typeof post> & { slug: string } {
  return post != null && typeof post.slug === 'string'
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = blogPosts.find((p) => p?.slug === slug)
  if (!post) return { title: 'Post não encontrado' }

  const url = `https://sirius.roilabs.com.br/blog/${slug}`
  const imageUrl = `https://sirius.roilabs.com.br${post.image || '/logo.png'}`

  return {
    title: `${post.title} | Sirius Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      siteName: 'Sirius CRM',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: 'pt_BR',
      type: 'article',
      publishedTime: post.date,
      authors: [post.author || 'Sirius Team'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [imageUrl],
      creator: '@roilabs',
    },
  }
}

export function generateStaticParams() {
  return blogPosts
    .filter(isValidPost)
    .map((post) => ({
      slug: post.slug,
    }))
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = blogPosts.find((p) => p?.slug === slug)

  if (!post) {
    notFound()
  }

  // Get related posts (exclude current post, get 2 random posts)
  const relatedPosts = blogPosts
    .filter((p) => isValidPost(p) && p.slug !== slug)
    .slice(0, 2)

  const url = `https://sirius.roilabs.com.br/blog/${slug}`
  const imageUrl = `https://sirius.roilabs.com.br${post.image || '/logo.png'}`

  // JSON-LD Schema for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: imageUrl,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Organization',
      name: post.author || 'Sirius Team',
      url: 'https://sirius.roilabs.com.br',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sirius CRM',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sirius.roilabs.com.br/logo.png',
      },
    },
    description: post.excerpt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="relative">
        {/* Premium Header Background */}
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/5 via-primary/3 to-transparent -z-10" />

        <div className="container mx-auto max-w-7xl py-8 lg:py-16 px-6">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/blog" className="hover:text-foreground transition-colors">
              Blog
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium truncate max-w-[200px] md:max-w-none">
              {post.title}
            </span>
          </nav>

          {/* Back Button */}
          <Button variant="ghost" asChild className="pl-0 mb-8 hover:bg-transparent hover:text-primary group -ml-2">
            <Link href="/blog" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Voltar para o Blog
            </Link>
          </Button>

          {/* Article Header */}
          <header className="space-y-6 mb-12">
            <Badge variant="secondary" className="text-sm font-medium px-3 py-1">{post.category}</Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-foreground">
              {post.title}
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>

            {/* Author & Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-6 border-t">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="bg-primary/10 text-primary">ST</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold text-foreground">{post.author || 'Sirius Team'}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Editor</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                  <Clock className="h-4 w-4" />
                  <span>10 min</span>
                </div>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="pt-4 border-t">
              <ShareButtons title={post.title} url={url} />
            </div>
          </header>

          {/* Article Content - 2 Column Layout */}
          <div className="grid lg:grid-cols-[1fr_320px] lg:gap-12 xl:gap-16">
            {/* Main Content Column - Card Wrapper */}
            <article className="bg-white dark:bg-zinc-900 border border-border/50 shadow-lg rounded-2xl p-8 md:p-12">
              <BlogContentWrapper content={post.content} slug={slug} />
            </article>

            {/* Sidebar Column - Table of Contents */}
            <TableOfContents content={post.content} />
          </div>

          {/* Related Posts Section */}
          {relatedPosts.length > 0 && (
            <div className="mt-20 pt-12 border-t">
              <h2 className="text-3xl font-bold mb-3 text-foreground">Leia também</h2>
              <p className="text-muted-foreground mb-8">Continue aprendendo sobre vendas e gestão comercial</p>
              <div className="grid gap-6 md:grid-cols-2">
                {relatedPosts.map((relatedPost) => (
                  <Card
                    key={relatedPost.slug}
                    className="group hover:shadow-xl transition-all duration-300 hover:border-primary/50 bg-card/50 backdrop-blur-sm"
                  >
                    <CardHeader className="space-y-3">
                      <Badge variant="secondary" className="w-fit">
                        {relatedPost.category}
                      </Badge>
                      <CardTitle className="text-xl leading-tight">
                        <Link
                          href={`/blog/${relatedPost.slug}`}
                          className="hover:text-primary transition-colors group-hover:text-primary"
                        >
                          {relatedPost.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-base">
                        {relatedPost.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/blog/${relatedPost.slug}`}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start pl-0 group-hover:text-primary group-hover:translate-x-1 transition-all"
                        >
                          Ler artigo completo
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  )
}
