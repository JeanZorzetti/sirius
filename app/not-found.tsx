import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, BookOpen, DollarSign, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Página não encontrada | Sirius CRM',
  description: 'A página que você procura não existe.',
  robots: 'noindex, nofollow',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-primary mb-2">404</h1>
          <div className="h-1 w-24 bg-primary mx-auto mb-6"></div>
        </div>

        <h2 className="text-3xl font-bold mb-4">Página não encontrada</h2>
        <p className="text-muted-foreground text-lg mb-8">
          Ops! A página que você procura não existe ou foi movida.
        </p>

        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <Link href="/">
            <Button variant="default" size="lg">
              <Home className="w-4 h-4 mr-2" />
              Voltar para Home
            </Button>
          </Link>
          <Link href="/features">
            <Button variant="outline" size="lg">
              <BookOpen className="w-4 h-4 mr-2" />
              Funcionalidades
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="lg">
              <DollarSign className="w-4 h-4 mr-2" />
              Preços
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" size="lg">
              <Mail className="w-4 h-4 mr-2" />
              Contato
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          Ou visite nosso{' '}
          <Link href="/blog" className="text-primary hover:underline">
            Blog
          </Link>
          {' '}para dicas de vendas e CRM
        </p>
      </div>
    </div>
  )
}
