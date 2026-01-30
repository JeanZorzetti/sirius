import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Termos de Uso | Sirius CRM',
  description: 'Termos e condições de uso da plataforma Sirius CRM',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl py-12 px-6">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Home
          </Button>
        </Link>

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <div className="flex items-center gap-4 mb-8">
            <FileText className="h-12 w-12 text-primary" />
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Termos de Uso</h1>
              <p className="text-muted-foreground">Última atualização: 30 de janeiro de 2026</p>
            </div>
          </div>

          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e usar a plataforma Sirius CRM, você concorda com estes Termos de Uso.
          </p>

          <h2>2. Descrição do Serviço</h2>
          <p>
            O Sirius CRM é uma plataforma de gestão de relacionamento com clientes.
          </p>

          <h2>3. Planos e Pagamento</h2>
          <p>
            Oferecemos planos FREE e PRO. Cancele a qualquer momento.
          </p>

          <h2>4. Contato</h2>
          <p>Email: juridico@roilabs.com.br</p>
        </div>
      </div>
    </div>
  )
}
