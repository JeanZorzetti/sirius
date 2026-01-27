'use client'

import { useOnboarding } from '@/hooks/useOnboarding'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, ArrowRight, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function ContinueOnboardingButton() {
  const { stats, isComplete, isSkipped, shouldShowOnboarding, onboarding } = useOnboarding()
  const [isDismissed, setIsDismissed] = useState(false)

  // Não mostrar se:
  // - Onboarding já está completo
  // - Foi pulado pelo usuário
  // - Wizard está sendo exibido no momento
  // - Foi dismissado pelo usuário
  if (
    isComplete ||
    isSkipped ||
    shouldShowOnboarding ||
    !onboarding ||
    isDismissed
  ) {
    return null
  }

  const completedCount = onboarding.completedSteps.length
  const totalSteps = stats?.totalSteps || 5
  const percentage = Math.round((completedCount / totalSteps) * 100)
  const hasStarted = completedCount > 0

  const handleContinue = () => {
    // Scroll suave para o topo onde o wizard está
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Recarregar para forçar o wizard aparecer
    window.location.reload()
  }

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  return (
    <Card className={cn(
      "relative overflow-hidden border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl",
      "animate-in slide-in-from-top-4 fade-in duration-500"
    )}>
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors z-10"
        aria-label="Dispensar"
      >
        <X className="h-4 w-4 text-zinc-500" />
      </button>

      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon with gradient background */}
          <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {hasStarted ? 'Continue sua configuração' : 'Comece sua jornada'}
              </h3>
              {hasStarted && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                  {percentage}% completo
                </span>
              )}
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              {hasStarted ? (
                <>
                  Você completou <span className="font-semibold text-indigo-600 dark:text-indigo-400">{completedCount} de {totalSteps} etapas</span>.
                  Continue de onde parou e desbloqueie todo o potencial do Sirius CRM!
                </>
              ) : (
                <>
                  Descubra como usar o Sirius CRM com nosso tour interativo.
                  Aprenda a <span className="font-semibold text-indigo-600 dark:text-indigo-400">criar negócios, gerenciar contatos e muito mais</span>!
                </>
              )}
            </p>

            {/* Progress bar - só mostra se começou */}
            {hasStarted && (
              <div className="mb-4">
                <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleContinue}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/20"
              >
                {hasStarted ? 'Continuar Tour' : 'Começar Tour'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-zinc-600 dark:text-zinc-400"
              >
                Depois
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative gradient blur */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-full blur-3xl pointer-events-none" />
    </Card>
  )
}
