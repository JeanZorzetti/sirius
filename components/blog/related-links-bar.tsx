import Link from 'next/link'
import { blogPosts } from '@/lib/blog-data'
import { ArrowRight, Calculator } from 'lucide-react'

interface RelatedLinksBarProps {
  currentSlug: string
  relatedSlugs?: string[]
}

export function RelatedLinksBar({ currentSlug, relatedSlugs }: RelatedLinksBarProps) {
  if (!relatedSlugs || relatedSlugs.length === 0) return null

  const relatedPosts = relatedSlugs
    .map(slug => blogPosts.find(p => p.slug === slug))
    .filter(Boolean)

  if (relatedPosts.length === 0) return null

  return (
    <div className="my-10 rounded-xl border border-border/50 bg-muted/30 p-6 space-y-4">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Leia tamb\u00e9m
      </p>

      <div className="flex flex-col gap-3">
        {relatedPosts.map(post => (
          <Link
            key={post!.slug}
            href={`/blog/${post!.slug}`}
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            {post!.title}
          </Link>
        ))}
      </div>

      <div className="pt-3 border-t border-border/50">
        <Link
          href="/ferramentas/calculadora-roi"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <Calculator className="h-4 w-4" />
          Calcule o ROI do seu CRM
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
