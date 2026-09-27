export interface BlogPost {
  slug: string
  title: string
  // <title> tag when the H1 is too wide for the SERP (<= 580px, main term first)
  seoTitle?: string
  excerpt: string
  content: string
  date: string
  lastModified?: string
  category: string
  image: string
  author: string
  relatedSlugs?: string[]
  // EN variants — if absent, /en/blog/[slug] gets noindex
  titleEn?: string
  excerptEn?: string
  contentEn?: string
  keywordsEn?: string[]
}
