import { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Pagamento Confirmado - Sirius CRM',
  description: 'Seu pagamento foi confirmado com sucesso!',
  robots: 'noindex, nofollow', // Não indexar página de sucesso
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Success Icon */}
        <div className="flex justify-center mb-8 animate-in zoom-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse"></div>
            <CheckCircle2 className="w-24 h-24 text-green-500 relative" strokeWidth={1.5} />
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8 animate-in slide-in-from-bottom duration-700">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            Pagamento Confirmado! 🎉
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Bem-vindo ao <span className="font-semibold text-purple-600 dark:text-purple-400">Sirius Pro</span>
          </p>
        </div>

        {/* Confirmation Card */}
        <Card className="mb-8 border-green-200 dark:border-green-900 animate-in slide-in-from-bottom duration-700 delay-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-green-100 dark:bg-green-950 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                  Sua conta foi atualizada
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Você agora tem acesso a todos os recursos do plano Pro. Um email de confirmação
                  foi enviado para você com os detalhes do pagamento.
                </p>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                  Recursos Pro Desbloqueados
                </h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Negócios Ilimitados</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Múltiplos Pipelines Personalizados</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Analytics Avançado</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Automações de Email</span>
                </li>
                <li className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Suporte Prioritário</span>
                </li>
              </ul>
            </div>

            {/* Next Steps */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
                Próximos Passos
              </h3>
              <ol className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex gap-3">
                  <span className="font-bold text-purple-600 dark:text-purple-400 shrink-0">1.</span>
                  <span>Explore os recursos Pro no seu dashboard</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-purple-600 dark:text-purple-400 shrink-0">2.</span>
                  <span>Configure múltiplos pipelines para diferentes processos</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-purple-600 dark:text-purple-400 shrink-0">3.</span>
                  <span>Convide membros da equipe (agora ilimitados!)</span>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-bottom duration-700 delay-300">
          <Link href="/dashboard" className="flex-1">
            <Button
              size="lg"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Acessar Dashboard
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="/dashboard/settings" className="flex-1">
            <Button
              size="lg"
              variant="outline"
              className="w-full"
            >
              Ver Detalhes da Assinatura
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-500 mt-8">
          Alguma dúvida? Entre em contato com nosso{' '}
          <Link
            href="/contact"
            className="text-purple-600 dark:text-purple-400 hover:underline"
          >
            suporte prioritário
          </Link>
        </p>
      </div>
    </div>
  )
}
