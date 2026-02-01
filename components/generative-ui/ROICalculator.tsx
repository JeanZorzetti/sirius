'use client'

/**
 * ROICalculator - Interactive ROI Calculator for Sales Conversations
 *
 * Demonstrates the value of Sirius CRM by calculating:
 * - Monthly savings
 * - Annual ROI
 * - Payback period
 *
 * Features:
 * - Editable inputs for real-time calculations
 * - Comparison mode (before/after)
 * - Industry-specific insights
 * - Save calculation to deal notes
 */

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { ROICalculatorProps } from '@/lib/generative-ui/schemas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Save,
  Share2,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

interface ROICalculatorComponentProps extends ROICalculatorProps {
  onInteraction?: (action: string, component: string, data: Record<string, unknown>) => void
}

export function ROICalculator({
  scenario,
  industry,
  comparisonMode = false,
  onInteraction
}: ROICalculatorComponentProps) {
  // Editable state for real-time calculations
  const [currentCost, setCurrentCost] = useState(scenario.currentCost)
  const [withSirius, setWithSirius] = useState(scenario.withSirius)
  const [saved, setSaved] = useState(false)

  // Calculate derived values
  const monthlySavings = currentCost - withSirius
  const annualSavings = monthlySavings * 12
  const paybackPeriod = withSirius > 0 ? withSirius / monthlySavings : 0
  const roiPercentage = currentCost > 0 ? ((monthlySavings / currentCost) * 100) : 0

  // Industry-specific insights
  const getIndustryInsight = useCallback(() => {
    const insights: Record<string, string> = {
      orthodontics: 'Clínicas de ortodontia economizam em média 35% com automação de follow-ups.',
      retail: 'Varejistas veem aumento de 25% em conversão com pipeline visual.',
      services: 'Empresas de serviços reduzem 40% do tempo em tarefas administrativas.',
      manufacturing: 'Indústrias ganham visibilidade completa do funil B2B.',
      other: 'Empresas que usam CRM têm 29% mais vendas em média.',
    }
    return insights[industry || 'other']
  }, [industry])

  // Handle save action
  const handleSave = useCallback(() => {
    setSaved(true)
    onInteraction?.('save_calculation', 'ROICalculator', {
      currentCost,
      withSirius,
      monthlySavings,
      annualSavings,
      paybackPeriod,
      roiPercentage,
      industry,
    })

    // Reset saved state after animation
    setTimeout(() => setSaved(false), 2000)
  }, [currentCost, withSirius, monthlySavings, annualSavings, paybackPeriod, roiPercentage, industry, onInteraction])

  // Handle share action
  const handleShare = useCallback(() => {
    onInteraction?.('share_calculation', 'ROICalculator', {
      currentCost,
      withSirius,
      monthlySavings,
      annualSavings,
    })
  }, [currentCost, withSirius, monthlySavings, annualSavings, onInteraction])

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="roi-calculator"
    >
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Calculadora de ROI</CardTitle>
                <CardDescription>
                  Veja quanto você pode economizar com Sirius CRM
                </CardDescription>
              </div>
            </div>
            {industry && (
              <Badge variant="secondary" className="capitalize">
                {industry}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentCost" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                Custo Atual (Mensal)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentCost"
                  type="number"
                  value={currentCost}
                  onChange={(e) => setCurrentCost(Number(e.target.value))}
                  className="pl-9"
                  min={0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withSirius" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Com Sirius CRM (Mensal)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="withSirius"
                  type="number"
                  value={withSirius}
                  onChange={(e) => setWithSirius(Number(e.target.value))}
                  className="pl-9"
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* Comparison Mode: Before/After Visual */}
          {comparisonMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-muted/50 rounded-lg p-4"
            >
              <div className="flex items-center justify-center gap-4">
                <div className="text-center flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Antes</p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(currentCost)}
                  </p>
                  <p className="text-xs text-muted-foreground">/mês</p>
                </div>

                <ArrowRight className="h-6 w-6 text-primary" />

                <div className="text-center flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Depois</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(withSirius)}
                  </p>
                  <p className="text-xs text-muted-foreground">/mês</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <motion.div
              className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <p className="text-xs text-muted-foreground mb-1">Economia Mensal</p>
              <p className="text-xl font-bold text-green-600" data-field="monthly-savings">
                {formatCurrency(monthlySavings)}
              </p>
            </motion.div>

            <motion.div
              className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <p className="text-xs text-muted-foreground mb-1">Economia Anual</p>
              <p className="text-xl font-bold text-blue-600" data-field="annual-savings">
                {formatCurrency(annualSavings)}
              </p>
            </motion.div>

            <motion.div
              className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 text-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Payback</p>
              </div>
              <p className="text-xl font-bold text-purple-600" data-field="payback">
                {paybackPeriod > 0 ? `${paybackPeriod.toFixed(1)} meses` : 'N/A'}
              </p>
            </motion.div>

            <motion.div
              className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 text-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <p className="text-xs text-muted-foreground mb-1">ROI</p>
              <p className="text-xl font-bold text-amber-600" data-field="roi-percentage">
                {roiPercentage.toFixed(0)}%
              </p>
            </motion.div>
          </div>

          {/* Industry Insight */}
          {industry && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-primary/5 border border-primary/10 rounded-lg p-3"
            >
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-primary">💡 Insight:</span>{' '}
                {getIndustryInsight()}
              </p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={saved}
            >
              {saved ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Salvo!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Cálculo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default ROICalculator
