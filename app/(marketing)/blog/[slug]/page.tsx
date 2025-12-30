import { notFound } from 'next/navigation'
import Link from 'next/link'
import { blogPosts } from '@/lib/blog-data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Metadata } from 'next'
import { ChevronLeft, Calendar, Clock } from 'lucide-react'

interface BlogPostPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)
  if (!post) return { title: 'Post não encontrado' }

  return {
    title: `${post.title} | Sirius Blog`,
    description: post.excerpt,
  }
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)

  if (!post) {
    notFound()
  }

  return (
    <article className="container mx-auto max-w-3xl py-12 lg:py-24 px-6">
      <div className="mb-8">
        <Button variant="ghost" asChild className="pl-0 mb-8 hover:bg-transparent hover:text-primary group">
          <Link href="/blog" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Voltar para o Blog
          </Link>
        </Button>

        <div className="space-y-6">
          <Badge variant="secondary" className="text-sm font-medium">{post.category}</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl leading-tight">{post.title}</h1>

          <div className="flex items-center justify-between border-t border-b py-6 mt-6">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>JL</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium text-foreground">Jean L.</p>
                <p className="text-muted-foreground">Editor Chefe</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {post.date}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                5 min leitura
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary/80"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  )
}
