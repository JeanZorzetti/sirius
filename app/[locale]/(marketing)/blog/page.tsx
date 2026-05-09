'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { blogPosts, getAllCategories, slugifyCategory } from '@/lib/blog-data'
import { ArrowRight, Clock, Tag, BookOpen } from 'lucide-react'

export default function BlogPage() {
    const t = useTranslations('marketing.blog')
    const locale = useLocale()
    const isEn = locale === 'en'
    const allCategory = t('categories.all')
    const [selectedCategory, setSelectedCategory] = useState(allCategory)
    const cardsRef = useRef<(HTMLDivElement | null)[]>([])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-fade-in-up')
                        observer.unobserve(entry.target)
                    }
                })
            },
            {
                threshold: 0.1,
                rootMargin: '50px',
            }
        )

        cardsRef.current.forEach((card) => {
            if (card) observer.observe(card)
        })

        return () => observer.disconnect()
    }, [])

    // Extract unique categories
    const categories = [allCategory, ...Array.from(new Set(blogPosts.map(post => post.category)))]

    // Sort posts by date (most recent first)
    const sortedPosts = [...blogPosts].sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateB.getTime() - dateA.getTime()
    })

    // Filter posts by category
    const filteredPosts = selectedCategory === allCategory
        ? sortedPosts
        : sortedPosts.filter(post => post.category === selectedCategory)

    // Featured post (most recent post)
    const featuredPost = filteredPosts[0]
    const recentPosts = filteredPosts.slice(1)

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="container mx-auto px-4 pt-24 sm:pt-32 pb-16">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="relative">
                        {/* Decorative gradient blur */}
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-150 h-150 bg-linear-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl -z-10" />

                        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight bg-linear-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent mb-6">
                            {t('hero.title')}
                        </h1>
                        <p className="text-xl leading-8 text-muted-foreground max-w-2xl mx-auto">
                            {t('hero.subtitle')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Categories Filter - Sticky */}
            <section className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {categories.map((category) => (
                            <Badge
                                key={category}
                                variant={selectedCategory === category ? 'default' : 'outline'}
                                className={`cursor-pointer whitespace-nowrap transition-all duration-300 ${
                                    selectedCategory === category
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-primary/10'
                                }`}
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category}
                            </Badge>
                        ))}
                    </div>

                    {/* SEO: Links indexáveis para páginas de categoria */}
                    <nav className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide" aria-label="Categorias do blog">
                        {getAllCategories().map((cat) => (
                            <Link
                                key={cat}
                                href={`/${locale}/blog/categoria/${slugifyCategory(cat)}`}
                                className="text-xs text-muted-foreground hover:text-primary whitespace-nowrap transition-colors"
                            >
                                {cat}
                            </Link>
                        ))}
                    </nav>
                </div>
            </section>

            {/* Featured Post */}
            {featuredPost && (
                <section className="container mx-auto px-4 py-16">
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold mb-2">{t('featured.label')}</h2>
                        <div className="h-px bg-linear-to-r from-primary via-primary/50 to-transparent" />
                    </div>

                    <Link href={`/${locale}/blog/${featuredPost.slug}`} className="block group">
                        <div className="grid lg:grid-cols-2 gap-8 items-center">
                            {/* Image */}
                            <div className="relative aspect-video rounded-2xl overflow-hidden">
                                <Image
                                    src={featuredPost.image}
                                    alt={isEn && featuredPost.titleEn ? featuredPost.titleEn : featuredPost.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    priority
                                />
                            </div>

                            {/* Content */}
                            <div className="space-y-4">
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                    <Tag className="w-3 h-3 mr-1.5" />
                                    {featuredPost.category}
                                </Badge>

                                <h2 className="text-3xl md:text-4xl font-bold leading-tight group-hover:text-primary transition-colors">
                                    {isEn && featuredPost.titleEn ? featuredPost.titleEn : featuredPost.title}
                                </h2>

                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    {isEn && featuredPost.excerptEn ? featuredPost.excerptEn : featuredPost.excerpt}
                                </p>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        {featuredPost.date}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4" />
                                        5 {t('post.readingTime')}
                                    </span>
                                </div>

                                <Button className="group/btn">
                                    {t('post.readMore')}
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </div>
                    </Link>
                </section>
            )}

            {/* Recent Posts Grid */}
            {recentPosts.length > 0 && (
                <section className="container mx-auto px-4 py-16">
                    <div className="mb-12">
                        <h2 className="text-2xl font-semibold mb-2">{t('recent.label')}</h2>
                        <div className="h-px bg-linear-to-r from-primary via-primary/50 to-transparent" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentPosts.map((post, index) => (
                            <div
                                key={post.slug}
                                ref={(el) => {
                                    cardsRef.current[index] = el
                                }}
                                className="opacity-0"
                                style={{
                                    animationDelay: `${index * 100}ms`,
                                }}
                            >
                                <Link href={`/${locale}/blog/${post.slug}`} className="block h-full group">
                                    <Card className="h-full flex flex-col relative overflow-hidden border-border/50 bg-card hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-500 ease-out rounded-2xl p-6">
                                        {/* Animated border gradient */}
                                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl -z-10" />

                                        {/* Thumbnail */}
                                        <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-4">
                                          <Image
                                            src={post.image}
                                            alt={isEn && post.titleEn ? post.titleEn : post.title}
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

                                            <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors duration-300">
                                                {isEn && post.titleEn ? post.titleEn : post.title}
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent className="relative z-10 flex-1 p-0 mb-4">
                                            <p className="text-muted-foreground leading-relaxed line-clamp-3">
                                                {isEn && post.excerptEn ? post.excerptEn : post.excerpt}
                                            </p>
                                        </CardContent>

                                        <CardFooter className="relative z-10 flex-none p-0 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                <span>{post.date}</span>
                                            </div>
                                            <Button variant="ghost" size="sm" className="group/btn p-0 h-auto hover:bg-transparent hover:text-primary">
                                                <span className="flex items-center gap-1">
                                                    {t('post.read')}
                                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                                                </span>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
