import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { MobileNav } from '@/components/marketing/mobile-nav'
import { Footer } from '@/components/marketing/footer'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/" className="text-xl font-bold flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image
                  src="/logo.png"
                  alt="Sirius Logo"
                  fill
                  className="object-contain"
                  priority
                  sizes="32px"
                />
              </div>
              <span className="font-bold tracking-tight">Sirius CRM</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/features"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Funcionalidades
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Preços
              </Link>
              <Link
                href="/blog"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Blog
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pt-16">{children}</main>

      {/* Footer Dinâmico */}
      <Footer />
    </div>
  )
}
