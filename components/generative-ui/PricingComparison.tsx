'use client'

/**
 * PricingComparison - FREE vs PRO Plans Comparison
 *
 * Interactive pricing table with:
 * - Plan highlighting
 * - Feature emphasis
 * - ROI badge
 * - Annual savings display
 */

import { motion } from 'framer-motion'
import type { PricingComparisonProps } from '@/lib/generative-ui/schemas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Check,
  X,
  Sparkles,
  Crown,
  TrendingUp,
  Zap
} from 'lucide-react'

interface PricingComparisonComponentProps extends PricingComparisonProps {
  onInteraction?: (action: string, component: string, data: Record<string, unknown>) => void
}

// Feature definitions
const FEATURES = [
  { id: 'contacts', name: 'Contatos', free: '100', pro: 'Ilimitados', highlight: true },
  { id: 'pipelines', name: 'Pipelines', free: '1', pro: 'Ilimitados', highlight: true },
  { id: 'deals', name: 'Negócios', free: '50/mês', pro: 'Ilimitados', highlight: true },
  { id: 'api_access', name: 'Acesso à API', free: false, pro: true, highlight: false },
  { id: 'agi_assistant', name: 'AGI Sirius', free: 'Limitado', pro: 'Completo', highlight: true },
  { id: 'automations', name: 'Automações', free: false, pro: true, highlight: false },
  { id: 'integrations', name: 'Integrações', free: 'Básicas', pro: 'Todas', highlight: false },
  { id: 'support', name: 'Suporte', free: 'Email', pro: 'Prioritário', highlight: false },
  { id: 'analytics', name: 'Analytics', free: 'Básico', pro: 'Avançado', highlight: false },
  { id: 'export', name: 'Exportação', free: 'CSV', pro: 'CSV, PDF, Excel', highlight: false },
]

export function PricingComparison({
  highlighted,
  emphasize_features = [],
  show_roi_badge = false,
  annual_savings,
  onInteraction
}: PricingComparisonComponentProps) {

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const handleSelectPlan = (plan: 'free' | 'pro') => {
    onInteraction?.('select_plan', 'PricingComparison', { plan })
  }

  const renderFeatureValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-600" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground/50" />
      )
    }
    return <span>{value}</span>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="pricing-comparison"
    >
      <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Comparativo de Planos
            </CardTitle>
            {show_roi_badge && (
              <Badge variant="default" className="bg-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                Melhor ROI
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Plans Header */}
          <div className="grid grid-cols-3 border-b">
            <div className="p-4 font-medium text-muted-foreground">
              Recurso
            </div>
            <motion.div
              className={`p-4 text-center ${
                highlighted === 'free' ? 'bg-primary/5' : ''
              }`}
              animate={{ scale: highlighted === 'free' ? 1.02 : 1 }}
            >
              <p className="font-bold text-lg">FREE</p>
              <p className="text-2xl font-bold">R$ 0</p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </motion.div>
            <motion.div
              className={`p-4 text-center relative ${
                highlighted === 'pro' ? 'bg-primary/10' : ''
              }`}
              animate={{ scale: highlighted === 'pro' ? 1.02 : 1 }}
            >
              {highlighted === 'pro' && (
                <Badge className="absolute top-2 right-2 bg-primary">
                  <Crown className="h-3 w-3 mr-1" />
                  Recomendado
                </Badge>
              )}
              <p className="font-bold text-lg flex items-center justify-center gap-1">
                PRO <Sparkles className="h-4 w-4 text-primary" />
              </p>
              <p className="text-2xl font-bold text-primary">R$ 97</p>
              <p className="text-xs text-muted-foreground">/mês</p>
            </motion.div>
          </div>

          {/* Features List */}
          <div className="divide-y">
            {FEATURES.map((feature) => {
              const isEmphasized = emphasize_features.includes(feature.id)

              return (
                <motion.div
                  key={feature.id}
                  className={`grid grid-cols-3 ${
                    isEmphasized ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''
                  }`}
                  initial={isEmphasized ? { x: -10 } : {}}
                  animate={isEmphasized ? { x: 0 } : {}}
                >
                  <div className="p-3 flex items-center gap-2">
                    {isEmphasized && (
                      <Sparkles className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className={isEmphasized ? 'font-medium' : ''}>
                      {feature.name}
                    </span>
                  </div>
                  <div className={`p-3 text-center flex items-center justify-center ${
                    highlighted === 'free' ? 'bg-primary/5' : ''
                  }`}>
                    {renderFeatureValue(feature.free)}
                  </div>
                  <div className={`p-3 text-center flex items-center justify-center ${
                    highlighted === 'pro' ? 'bg-primary/10' : ''
                  }`}>
                    {renderFeatureValue(feature.pro)}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Annual Savings */}
          {annual_savings && annual_savings > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-green-50 dark:bg-green-950/30 p-4 border-t"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Economia Anual Estimada</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(annual_savings)}
                </span>
              </div>
            </motion.div>
          )}

          {/* CTA Buttons */}
          <div className="grid grid-cols-2 gap-4 p-4 border-t">
            <Button
              variant={highlighted === 'free' ? 'default' : 'outline'}
              onClick={() => handleSelectPlan('free')}
            >
              Começar Grátis
            </Button>
            <Button
              variant={highlighted === 'pro' ? 'default' : 'outline'}
              className={highlighted === 'pro' ? 'bg-primary' : ''}
              onClick={() => handleSelectPlan('pro')}
            >
              <Crown className="h-4 w-4 mr-2" />
              Assinar PRO
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default PricingComparison
