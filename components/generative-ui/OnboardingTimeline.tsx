'use client'

/**
 * OnboardingTimeline - Implementation Timeline Visualization
 *
 * Displays implementation timeline with:
 * - Step-by-step progress
 * - Plan-based customization
 * - Estimated completion date
 * - Integration setup indicators
 */

import { motion } from 'framer-motion'
import type { OnboardingTimelineProps } from '@/lib/generative-ui/schemas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Rocket,
  CheckCircle2,
  Circle,
  Settings,
  Users,
  Zap,
  Calendar,
  Plug,
  GraduationCap,
  PartyPopper
} from 'lucide-react'

interface OnboardingTimelineComponentProps extends OnboardingTimelineProps {
  onInteraction?: (action: string, component: string, data: Record<string, unknown>) => void
}

// Timeline steps based on plan
const FREE_STEPS = [
  { id: 'signup', label: 'Criar Conta', icon: Rocket, days: 0, description: 'Registro instantâneo' },
  { id: 'setup', label: 'Configuração Inicial', icon: Settings, days: 1, description: 'Pipeline e estágios' },
  { id: 'import', label: 'Importar Contatos', icon: Users, days: 2, description: 'CSV ou manual' },
  { id: 'first_deal', label: 'Primeiro Deal', icon: Zap, days: 3, description: 'Criar oportunidade' },
  { id: 'live', label: 'Operando!', icon: PartyPopper, days: 3, description: 'Pronto para vender' },
]

const PRO_STEPS = [
  { id: 'signup', label: 'Criar Conta', icon: Rocket, days: 0, description: 'Ativação instantânea' },
  { id: 'kickoff', label: 'Kickoff Call', icon: Calendar, days: 1, description: 'Alinhamento com CS' },
  { id: 'setup', label: 'Configuração Avançada', icon: Settings, days: 3, description: 'Pipelines, automações, templates' },
  { id: 'integrations', label: 'Integrações', icon: Plug, days: 5, description: 'WhatsApp, Email, APIs' },
  { id: 'import', label: 'Migração de Dados', icon: Users, days: 7, description: 'Importação completa' },
  { id: 'training', label: 'Treinamento', icon: GraduationCap, days: 10, description: 'Capacitação da equipe' },
  { id: 'live', label: 'Go Live!', icon: PartyPopper, days: 14, description: 'Operação completa' },
]

const TEAM_SIZE_MODIFIERS = {
  solo: 0.7,
  small: 1,
  medium: 1.3,
  large: 1.6,
}

const TEAM_SIZE_LABELS = {
  solo: '1 pessoa',
  small: '2-5 pessoas',
  medium: '6-15 pessoas',
  large: '16+ pessoas',
}

export function OnboardingTimeline({
  plan,
  teamSize = 'small',
  hasIntegrations = false,
  estimatedDays,
  onInteraction
}: OnboardingTimelineComponentProps) {

  const baseSteps = plan === 'pro' ? PRO_STEPS : FREE_STEPS
  const modifier = TEAM_SIZE_MODIFIERS[teamSize]

  // Calculate estimated days
  const baseDays = baseSteps[baseSteps.length - 1].days
  const integrationBonus = hasIntegrations && plan === 'free' ? 2 : 0
  const calculatedDays = estimatedDays || Math.round(baseDays * modifier + integrationBonus)

  // Adjust step days based on modifier
  const steps = baseSteps.map((step, index) => ({
    ...step,
    adjustedDays: index === 0 ? 0 : Math.round(step.days * modifier),
  }))

  const handleStepClick = (stepId: string) => {
    onInteraction?.('step_clicked', 'OnboardingTimeline', { stepId, plan })
  }

  const formatDate = (daysFromNow: number) => {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="onboarding-timeline"
    >
      <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Timeline de Implementação</CardTitle>
                <CardDescription>
                  Plano {plan.toUpperCase()} • {TEAM_SIZE_LABELS[teamSize]}
                </CardDescription>
              </div>
            </div>
            <Badge variant="default" className="text-lg px-3 py-1">
              {calculatedDays} dias
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Timeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-muted" />

            {/* Steps */}
            <div className="space-y-4">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isFirst = index === 0
                const isLast = index === steps.length - 1

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex items-start gap-4 cursor-pointer group"
                    onClick={() => handleStepClick(step.id)}
                  >
                    {/* Step Icon */}
                    <motion.div
                      className={`relative z-10 p-2 rounded-full ${
                        isFirst ? 'bg-green-500' : isLast ? 'bg-primary' : 'bg-muted'
                      } group-hover:scale-110 transition-transform`}
                      whileHover={{ scale: 1.1 }}
                    >
                      {isFirst ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : (
                        <Icon className={`h-4 w-4 ${isLast ? 'text-white' : 'text-muted-foreground'}`} />
                      )}
                    </motion.div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${isLast ? 'text-primary' : ''}`}>
                          {step.label}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {step.adjustedDays === 0 ? 'Hoje' : `Dia ${step.adjustedDays}`}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Data de início:</span>
              <span className="font-medium">{formatDate(0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Previsão de Go Live:</span>
              <span className="font-medium text-primary">{formatDate(calculatedDays)}</span>
            </div>
            {hasIntegrations && (
              <div className="flex items-center gap-2 text-sm">
                <Plug className="h-4 w-4 text-blue-600" />
                <span className="text-muted-foreground">Inclui setup de integrações</span>
              </div>
            )}
          </div>

          {/* CTA */}
          {plan === 'free' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-primary/5 rounded-lg p-3 text-sm text-center"
            >
              <span className="text-muted-foreground">
                Quer implementação mais rápida com suporte dedicado?{' '}
              </span>
              <span className="font-medium text-primary cursor-pointer hover:underline">
                Conheça o plano PRO →
              </span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default OnboardingTimeline
