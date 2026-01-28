'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, FileUp, Zap, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { analytics } from '@/lib/posthog'

interface WelcomeModalProps {
  open: boolean
  onClose: () => void
  userName?: string
}

type OnboardingChoice = 'demo' | 'import' | 'scratch' | null

export function WelcomeModal({ open, onClose, userName }: WelcomeModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState<OnboardingChoice>(null)

  // Rastrear início do onboarding quando modal abre
  useEffect(() => {
    if (open) {
      analytics.onboardingStart()
    }
  }, [open])

  const handleChoice = async (choice: OnboardingChoice) => {
    setSelectedChoice(choice)
    setIsLoading(true)

    try {
      if (choice === 'demo') {
        // Rastrear modo demo selecionado
        analytics.demoModeSelected()

        // Load demo data
        const response = await fetch('/api/onboarding/seed-demo', {
          method: 'POST',
        })

        if (!response.ok) {
          throw new Error('Failed to load demo data')
        }

        const data = await response.json()

        toast.success('Dados de demonstração carregados!', {
          description: `${data.data.deals} negociações e ${data.data.contacts} contatos criados.`
        })

        // Rastrear conclusão do onboarding
        analytics.onboardingCompleted({ demo_mode: true })

        // Refresh to get updated data from server
        router.refresh()

        // Close modal and redirect to dashboard with tour
        onClose()
        router.push('/dashboard?tour=true')
      } else if (choice === 'import') {
        // Mark onboarding as completed
        await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COMPLETED' })
        })

        // TODO: Implement import flow
        toast.info('Em breve!', {
          description: 'A importação de dados estará disponível em breve.'
        })

        // Rastrear conclusão do onboarding
        analytics.onboardingCompleted({ demo_mode: false })

        router.refresh()
        onClose()
        router.push('/dashboard')
      } else if (choice === 'scratch') {
        // Mark onboarding as completed
        await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'COMPLETED' })
        })

        // Rastrear conclusão do onboarding
        analytics.onboardingCompleted({ demo_mode: false })

        // Start from scratch
        router.refresh()
        onClose()
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error handling choice:', error)
      toast.error('Erro ao processar sua escolha', {
        description: 'Por favor, tente novamente.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="w-[55vw] sm:max-w-[55vw] max-w-[55vw]!" onPointerDownOutside={(e) => isLoading && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-center">
            Bem-vindo ao Sirius CRM{userName ? `, ${userName}` : ''}! 🎉
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Como você gostaria de começar sua jornada?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-6 sm:grid-cols-3">
          {/* Option 1: Demo Data (Magic!) */}
          <Card
            className={`relative p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 ${
              selectedChoice === 'demo'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-indigo-300'
            }`}
            onClick={() => !isLoading && handleChoice('demo')}
          >
            {/* Recommended Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold">
              Recomendado ✨
            </div>

            <div className="space-y-4 pt-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-white" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="font-bold text-lg">Ver Demonstração</h3>
                <p className="text-sm text-muted-foreground">
                  Explore o CRM com dados fictícios prontos. Veja tudo funcionando em segundos!
                </p>
              </div>

              <div className="pt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  <span>5 leads prontos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  <span>Pipeline organizado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  <span>Tour guiado incluído</span>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                disabled={isLoading}
              >
                {isLoading && selectedChoice === 'demo' ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  'Começar com Demo'
                )}
              </Button>
            </div>
          </Card>

          {/* Option 2: Import Data */}
          <Card
            className={`p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 ${
              selectedChoice === 'import'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-blue-300'
            }`}
            onClick={() => !isLoading && handleChoice('import')}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
                <FileUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="font-bold text-lg">Importar Dados</h3>
                <p className="text-sm text-muted-foreground">
                  Traga seus contatos do Excel ou CSV. Rápido e fácil.
                </p>
              </div>

              <div className="pt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                  <span>Excel/CSV aceitos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                  <span>Google Contacts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-zinc-400" />
                  <span className="italic">Em breve</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && selectedChoice === 'import' ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Importar Agora'
                )}
              </Button>
            </div>
          </Card>

          {/* Option 3: Start from Scratch */}
          <Card
            className={`p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 ${
              selectedChoice === 'scratch'
                ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-green-300'
            }`}
            onClick={() => !isLoading && handleChoice('scratch')}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="font-bold text-lg">Começar do Zero</h3>
                <p className="text-sm text-muted-foreground">
                  Configure tudo do seu jeito. Total liberdade desde o início.
                </p>
              </div>

              <div className="pt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  <span>CRM limpo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  <span>Personalize tudo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  <span>Seu ritmo</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading && selectedChoice === 'scratch' ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  'Criar Primeiro Deal'
                )}
              </Button>
            </div>
          </Card>
        </div>

        <div className="text-center text-xs text-muted-foreground pt-2 border-t">
          <p>💡 Dica: Escolha a demonstração para ver o poder do Sirius em ação!</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
