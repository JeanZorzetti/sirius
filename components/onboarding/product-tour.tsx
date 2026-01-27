'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface TourStep {
  id: string
  target: string // CSS selector or element ID
  title: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  action?: {
    label: string
    onClick: () => void
  }
}

interface TourContextType {
  isActive: boolean
  currentStep: number
  steps: TourStep[]
  startTour: (steps: TourStep[]) => void
  nextStep: () => void
  prevStep: () => void
  endTour: () => void
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState<TourStep[]>([])
  const searchParams = useSearchParams()
  const router = useRouter()

  // Check if tour should start from URL params
  useEffect(() => {
    const tourParam = searchParams.get('tour')
    if (tourParam === 'true' && !isActive) {
      // Start default tour after a short delay
      setTimeout(() => {
        startDefaultTour()
      }, 500)
    }
  }, [searchParams])

  const startTour = (newSteps: TourStep[]) => {
    setSteps(newSteps)
    setCurrentStep(0)
    setIsActive(true)
  }

  const startDefaultTour = () => {
    const defaultSteps: TourStep[] = [
      {
        id: 'welcome',
        target: '[data-tour="pipeline"]',
        title: '🎯 Seu Funil de Vendas',
        content: 'Este é seu pipeline! Aqui você visualiza todas as negociações organizadas por etapa. Cada coluna representa um estágio do processo de venda.',
        placement: 'bottom',
      },
      {
        id: 'overdue',
        target: '[data-tour="overdue-task"]',
        title: '⚠️ Atenção: Tarefa Atrasada!',
        content: 'Você tem uma negociação que precisa de follow-up URGENTE! Os cards com borda vermelha indicam deals com prazo vencido.',
        placement: 'left',
      },
      {
        id: 'drag-drop',
        target: '[data-tour="deal-card"]:first-child',
        title: '🎮 Arraste para Avançar',
        content: 'Experimente: arraste este card para a coluna "Fechado". É assim que você move negociações pelo funil!',
        placement: 'right',
        action: {
          label: 'Vou tentar!',
          onClick: () => {
            // User will interact manually
          }
        }
      },
      {
        id: 'analytics',
        target: '[data-tour="analytics-button"]',
        title: '📊 Analytics & Insights',
        content: 'Acompanhe suas métricas: conversão, faturamento, gráficos... Tudo em tempo real!',
        placement: 'bottom',
      },
    ]

    startTour(defaultSteps)
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      endTour()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const endTour = () => {
    setIsActive(false)
    setCurrentStep(0)
    setSteps([])

    // Remove tour param from URL
    const url = new URL(window.location.href)
    url.searchParams.delete('tour')
    router.replace(url.pathname)
  }

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startTour,
        nextStep,
        prevStep,
        endTour,
      }}
    >
      {children}
      {isActive && steps.length > 0 && <TourOverlay />}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within TourProvider')
  }
  return context
}

function TourOverlay() {
  const { currentStep, steps, nextStep, prevStep, endTour } = useTour()
  const step = steps[currentStep]
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    // Calculate tooltip position based on target element
    const targetElement = document.querySelector(step.target)

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

      let top = 0
      let left = 0

      switch (step.placement) {
        case 'bottom':
          top = rect.bottom + scrollTop + 16
          left = rect.left + scrollLeft + rect.width / 2
          break
        case 'top':
          top = rect.top + scrollTop - 16
          left = rect.left + scrollLeft + rect.width / 2
          break
        case 'left':
          top = rect.top + scrollTop + rect.height / 2
          left = rect.left + scrollLeft - 16
          break
        case 'right':
          top = rect.top + scrollTop + rect.height / 2
          left = rect.right + scrollLeft + 16
          break
        default:
          top = rect.bottom + scrollTop + 16
          left = rect.left + scrollLeft + rect.width / 2
      }

      setTooltipPosition({ top, left })

      // Scroll element into view smoothly
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })

      // Highlight the target element
      targetElement.classList.add('tour-highlight')
      return () => {
        targetElement.classList.remove('tour-highlight')
      }
    }
  }, [step, currentStep])

  return (
    <>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[999]"
        onClick={endTour}
      />

      {/* Tooltip */}
      <div
        className="fixed z-[1000] transition-all duration-300"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: step.placement === 'left' || step.placement === 'right'
            ? 'translate(-100%, -50%)'
            : 'translate(-50%, 0)',
        }}
      >
        <Card className="w-80 shadow-2xl border-2 border-indigo-500 animate-in fade-in slide-in-from-bottom-4">
          <CardContent className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold pr-4">{step.title}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={endTour}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.content}
            </p>

            {/* Action button (if any) */}
            {step.action && (
              <Button
                className="w-full"
                onClick={() => {
                  step.action?.onClick()
                  nextStep()
                }}
              >
                {step.action.label}
              </Button>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>

              <span className="text-xs text-muted-foreground">
                {currentStep + 1} de {steps.length}
              </span>

              <Button
                size="sm"
                onClick={nextStep}
              >
                {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSS for highlight effect */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 1000;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.5),
                      0 0 0 9999px rgba(0, 0, 0, 0.5);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
      `}</style>
    </>
  )
}

// Helper component to mark tour targets
export function TourTarget({ id, children, className = '' }: { id: string; children: ReactNode; className?: string }) {
  return (
    <div data-tour={id} className={className}>
      {children}
    </div>
  )
}
