'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { blogPosts } from '@/lib/blog-data'
import { ArrowRight, Clock, Tag } from 'lucide-react'

export default function BlogPage() {
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

    // Bento Grid: Define variable sizes for cards (following pattern: large, medium, medium, medium, large, etc.)
    const getCardSize = (index: number) => {
        const pattern = index % 5
        if (pattern === 0 || pattern === 4) return 'lg:col-span-2 lg:row-span-2' // Large cards
        if (pattern === 1) return 'lg:col-span-1 lg:row-span-1' // Small card
        return 'lg:col-span-1 lg:row-span-1' // Regular cards
    }

    return (
        <div className="container mx-auto py-24 sm:py-32 px-4">
            {/* Hero Section with Glassmorphism */}
            <div className="mx-auto max-w-4xl text-center mb-20">
                <div className="relative">
                    {/* Decorative gradient blur */}
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-150 h-150 bg-linear-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl -z-10" />

                    <h1 className="text-5xl sm:text-6xl font-bold tracking-tight bg-linear-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent mb-6">
                        Blog
                    </h1>
                    <p className="text-xl leading-8 text-muted-foreground max-w-2xl mx-auto">
                        Dicas e estratégias para vender mais e melhor
                    </p>
                </div>
            </div>

            {/* Bento Grid Layout */}
            <div className="mx-auto lg:max-w-none">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[280px]">
                    {blogPosts.map((post, index) => (
                        <div
                            key={post.slug}
                            ref={(el) => {
                                cardsRef.current[index] = el
                            }}
                            className={`opacity-0 ${getCardSize(index)}`}
                            style={{
                                animationDelay: `${index * 100}ms`,
                            }}
                        >
                            <Link href={`/blog/${post.slug}`} className="block h-full group">
                                <Card
                                    className={`
                                        h-full flex flex-col relative overflow-hidden
                                        border-border/50
                                        bg-background/95
                                        hover:shadow-2xl hover:shadow-primary/10
                                        hover:-translate-y-2 hover:scale-[1.02]
                                        transition-all duration-500 ease-out
                                        rounded-3xl
                                        ${
                                            index % 5 === 0 || index % 5 === 4
                                                ? 'p-8'
                                                : 'p-6'
                                        }
                                    `}
                                >
                                    {/* Background Image with zoom effect */}
                                    <div className="absolute inset-0 overflow-hidden rounded-3xl">
                                        <Image
                                            src={post.image}
                                            alt={post.title}
                                            fill
                                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            priority={index < 2}
                                        />
                                        {/* Gradient overlay for text readability */}
                                        <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-background/40" />
                                        {/* Additional glassmorphic overlay on hover */}
                                        <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-background/60 to-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-sm" />
                                    </div>

                                    {/* Animated border gradient */}
                                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl -z-10" />

                                    <CardHeader className="relative z-10 flex-none space-y-3 p-0 mb-4">
                                        {/* Category Badge with micro-interaction */}
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium backdrop-blur-sm border border-primary/20 group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300">
                                                <Tag className="w-3 h-3" />
                                                {post.category}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Clock className="w-3 h-3" />
                                                {post.date}
                                            </div>
                                        </div>

                                        <CardTitle
                                            className={`
                                                ${
                                                    index % 5 === 0 || index % 5 === 4
                                                        ? 'text-3xl'
                                                        : 'text-xl'
                                                }
                                                font-bold leading-tight
                                                group-hover:text-primary
                                                transition-colors duration-300
                                            `}
                                        >
                                            {post.title}
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="relative z-10 flex-1 p-0">
                                        <p className="text-muted-foreground leading-relaxed line-clamp-3">
                                            {post.excerpt}
                                        </p>
                                    </CardContent>

                                    <CardFooter className="relative z-10 flex-none p-0 mt-6">
                                        <Button
                                            variant="ghost"
                                            className="p-0 h-auto hover:bg-transparent hover:text-primary group/btn"
                                        >
                                            <span className="flex items-center gap-2 font-medium">
                                                Ler artigo
                                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
                                            </span>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
