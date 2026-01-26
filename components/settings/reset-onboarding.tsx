'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw, Sparkles } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation'

export function ResetOnboardingButton() {
  const router = useRouter()
  const [isResetting, setIsResetting] = useState(false)

  const handleReset = async () => {
    setIsResetting(true)

    try {
      const response = await fetch('/api/onboarding/reset', {
        method: 'POST',
      })

      if (response.ok) {
        // Redirecionar para dashboard para mostrar o wizard
        router.push('/dashboard')
        router.refresh()
      } else {
        alert('❌ Erro ao resetar onboarding')
      }
    } catch (error) {
      console.error('Reset error:', error)
      alert('❌ Erro ao resetar onboarding')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <RotateCcw className="h-4 w-4 mr-2" />
          Refazer Tour Interativo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            Refazer Onboarding Interativo?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Isso irá resetar seu progresso e exibir novamente o tour guiado de 5 etapas:
            <ul className="mt-3 space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Boas-vindas ao Sirius CRM</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Configurar organização</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Criar pipeline de vendas</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Adicionar primeiro contato</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Criar primeira oportunidade</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              💡 Ótimo para revisar funcionalidades ou treinar novos membros do time!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset} disabled={isResetting}>
            {isResetting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Resetando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Começar Tour
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
