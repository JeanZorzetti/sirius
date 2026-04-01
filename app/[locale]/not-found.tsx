import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Mail } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="max-w-lg">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">404</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Página não encontrada
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/">
            <Button variant="default">
              <Home className="w-4 h-4 mr-2" />
              Voltar para Home
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Contato
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Ou visite nosso{' '}
          <Link href="/blog" className="text-primary underline-offset-4 hover:underline">
            Blog
          </Link>{' '}
          para dicas de vendas e CRM
        </p>
      </div>
    </div>
  )
}
