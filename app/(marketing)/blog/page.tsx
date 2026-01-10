import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { blogPosts } from '@/lib/blog-data'

export default function BlogPage() {
    return (
        <div className="container mx-auto py-24 sm:py-32">
            <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog</h2>
                <p className="mt-2 text-lg leading-8 text-muted-foreground">
                    Dicas e estratégias para vender mais e melhor.
                </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
                {blogPosts.map((post) => (
                    <Card key={post.slug} className="flex flex-col">
                        <CardHeader>
                            <div className="text-sm text-primary font-medium mb-2">{post.category}</div>
                            <CardTitle className="text-xl hover:text-primary transition-colors">
                                <Link href={`/blog/${post.slug}`}>
                                    {post.title}
                                </Link>
                            </CardTitle>
                            <CardDescription>{post.date}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <p className="text-muted-foreground">{post.excerpt}</p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild variant="ghost" className="p-0 hover:bg-transparent hover:text-primary">
                                <Link href={`/blog/${post.slug}`}>
                                    Ler artigo &rarr;
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
