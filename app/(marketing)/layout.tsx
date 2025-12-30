import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { MobileNav } from '@/components/marketing/mobile-nav'

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
                <Image src="/logo.png" alt="Sirius Logo" fill className="object-contain" />
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

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="flex flex-col gap-4">
              <div className="text-lg font-bold">Sirius CRM</div>
              <p className="text-sm text-muted-foreground">Brilhe nas vendas com a estrela do Grupo ROI Labs.</p>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-medium">Produto</h3>
              <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground">Funcionalidades</Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Preços</Link>
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-medium">Recursos</h3>
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">Blog</Link>
              <Link href="/dashboard/analytics" className="text-sm text-muted-foreground hover:text-foreground">Analytics</Link>
              <Link href="/dashboard/contacts" className="text-sm text-muted-foreground hover:text-foreground">Contatos</Link>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-medium">Empresa</h3>
              <Link href="https://roilabs.com.br" className="text-sm text-muted-foreground hover:text-foreground" target="_blank">ROI Labs</Link>
              <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">Criar Conta</Link>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Login</Link>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Sirius CRM (ROI Labs). Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
