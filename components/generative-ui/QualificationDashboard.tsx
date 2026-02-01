'use client'

/**
 * QualificationDashboard - BANT Score Visualization
 *
 * Displays lead qualification scores with:
 * - Visual score bars
 * - Overall score
 * - AI recommendations
 * - Suggested next steps
 */

import { motion } from 'framer-motion'
import type { QualificationDashboardProps } from '@/lib/generative-ui/schemas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Target,
  DollarSign,
  Users,
  AlertCircle,
  Clock,
  CheckCircle,
  Lightbulb,
  ArrowRight
} from 'lucide-react'

interface QualificationDashboardComponentProps extends QualificationDashboardProps {
  onInteraction?: (action: string, component: string, data: Record<string, unknown>) => void
}

const BANT_LABELS = {
  budget: { label: 'Budget', icon: DollarSign, description: 'Tem orçamento disponível?' },
  authority: { label: 'Authority', icon: Users, description: 'Pode tomar a decisão?' },
  need: { label: 'Need', icon: AlertCircle, description: 'Tem necessidade real?' },
  timeline: { label: 'Timeline', icon: Clock, description: 'Tem prazo definido?' },
}

export function QualificationDashboard({
  scores,
  overall,
  recommendations,
  nextSteps,
  onInteraction
}: QualificationDashboardComponentProps) {

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-600'
    if (score >= 60) return 'bg-yellow-600'
    if (score >= 40) return 'bg-orange-600'
    return 'bg-red-600'
  }

  const getOverallLabel = (score: number) => {
    if (score >= 80) return { label: 'Alta Qualificação', variant: 'default' as const }
    if (score >= 60) return { label: 'Boa Qualificação', variant: 'secondary' as const }
    if (score >= 40) return { label: 'Qualificação Média', variant: 'outline' as const }
    return { label: 'Baixa Qualificação', variant: 'destructive' as const }
  }

  const overallInfo = getOverallLabel(overall)

  const handleNextStepClick = (step: string) => {
    onInteraction?.('next_step_clicked', 'QualificationDashboard', { step })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="qualification-dashboard"
    >
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Qualificação BANT</CardTitle>
                <CardDescription>
                  Análise de fit do lead baseada na conversa
                </CardDescription>
              </div>
            </div>
            <Badge variant={overallInfo.variant} className="text-lg px-3 py-1">
              {overall}%
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">Score Geral</p>
            <motion.div
              className={`text-4xl font-bold ${getScoreColor(overall)}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {overall}%
            </motion.div>
            <Badge variant={overallInfo.variant} className="mt-2">
              {overallInfo.label}
            </Badge>
          </div>

          {/* BANT Scores */}
          <div className="space-y-4">
            {(Object.entries(scores) as [keyof typeof scores, number][]).map(([key, value], index) => {
              const config = BANT_LABELS[key]
              const Icon = config.icon

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${getScoreColor(value)}`} />
                      <span className="font-medium">{config.label}</span>
                      <span className="text-xs text-muted-foreground">
                        ({config.description})
                      </span>
                    </div>
                    <span className={`font-bold ${getScoreColor(value)}`}>
                      {value}%
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={value} className="h-2" />
                    <motion.div
                      className={`absolute top-0 left-0 h-2 rounded-full ${getProgressColor(value)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                Recomendações da IA
              </div>
              <ul className="space-y-2">
                {recommendations.map((rec, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    {rec}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          {nextSteps.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ArrowRight className="h-4 w-4 text-primary" />
                Próximos Passos
              </div>
              <div className="grid gap-2">
                {nextSteps.map((step, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    onClick={() => handleNextStepClick(step)}
                    className="flex items-center gap-2 p-2 text-sm text-left bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    {step}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default QualificationDashboard
