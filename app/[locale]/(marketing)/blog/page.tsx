import { blogPosts, getAllCategories, slugifyCategory } from '@/lib/blog-data'
import { BlogIndex } from '@/components/blog/blog-index'

// Server side on purpose: the posts carry their full bodies, and only the card fields cross to the client (spec 006)
export default function BlogPage() {
  const posts = blogPosts.map(({ slug, title, titleEn, excerpt, excerptEn, category, date, image }) => ({
    slug, title, titleEn, excerpt, excerptEn, category, date, image,
  }))
  const categoryLinks = getAllCategories().map(name => ({ name, slug: slugifyCategory(name) }))

  return <BlogIndex posts={posts} categoryLinks={categoryLinks} />
}
