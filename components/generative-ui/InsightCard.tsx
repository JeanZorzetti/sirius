'use client'

/**
 * InsightCard - AI Insight/Recommendation Display
 *
 * Displays AI-generated insights with:
 * - Type-based styling (opportunity, risk, recommendation, alert)
 * - Confidence score
 * - Quick actions
 */

import { motion } from 'framer-motion'
import type { InsightCardProps } from '@/lib/generative-ui/schemas'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Bell,
  Sparkles,
  Calendar,
  Mail,
  FileText,
  PlusCircle
} from 'lucide-react'

interface InsightCardComponentProps extends InsightCardProps {
  onInteraction?: (action: string, component: string, data: Record<string, unknown>) => void
}

const TYPE_CONFIG = {
  opportunity: {
    icon: TrendingUp,
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-500/50',
    iconColor: 'text-green-600',
    badgeColor: 'bg-green-100 text-green-700',
    label: 'Oportunidade'
  },
  risk: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-500/50',
    iconColor: 'text-red-600',
    badgeColor: 'bg-red-100 text-red-700',
    label: 'Risco'
  },
  recommendation: {
    icon: Lightbulb,
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-500/50',
    iconColor: 'text-blue-600',
    badgeColor: 'bg-blue-100 text-blue-700',
    label: 'Recomendação'
  },
  alert: {
    icon: Bell,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-500/50',
    iconColor: 'text-yellow-600',
    badgeColor: 'bg-yellow-100 text-yellow-700',
    label: 'Alerta'
  },
}

const ACTION_ICONS = {
  create_deal: PlusCircle,
  schedule_demo: Calendar,
  send_email: Mail,
  add_note: FileText,
}

const ACTION_LABELS = {
  create_deal: 'Criar Deal',
  schedule_demo: 'Agendar Demo',
  send_email: 'Enviar Email',
  add_note: 'Adicionar Nota',
}

export function InsightCard({
  type,
  title,
  description,
  confidence,
  actions,
  onInteraction
}: InsightCardComponentProps) {
  const config = TYPE_CONFIG[type]
  const Icon = config.icon
  const confidencePercent = Math.round(confidence * 100)

  const handleAction = (action: string, params?: Record<string, unknown>) => {
    onInteraction?.('action_clicked', 'InsightCard', { action, params, insightType: type })
  }

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.8) return 'Alta'
    if (conf >= 0.6) return 'Média'
    return 'Baixa'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="insight-card"
    >
      <Card className={`border-2 ${config.borderColor} ${config.bgColor} shadow-md`}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <Icon className={`h-5 w-5 ${config.iconColor}`} />
              </div>
              <Badge className={config.badgeColor}>
                {config.label}
              </Badge>
            </div>

            {/* Confidence Score */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                Confiança: {getConfidenceLabel(confidence)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={confidencePercent} className="w-16 h-1.5" />
                <span className="text-xs font-medium">{confidencePercent}%</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-lg mb-2">{title}</h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4">{description}</p>

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t">
              {actions.map((action, index) => {
                const ActionIcon = ACTION_ICONS[action.action]

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(action.action, action.params)}
                      className="text-xs"
                    >
                      {ActionIcon && <ActionIcon className="h-3 w-3 mr-1" />}
                      {action.label || ACTION_LABELS[action.action]}
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default InsightCard
