export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string
  date: string
  lastModified?: string // Data da última modificação (para sitemap freshness)
  category: string
  image: string
  author: string
  relatedSlugs?: string[] // Slugs de posts relacionados para internal linking (max 3)
}
