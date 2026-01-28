'use client'

import { useState } from 'react'
import { FunnelMetrics } from '@/lib/analytics/funnel-service'
import { simulateRevenueGoal } from '@/lib/analytics/revenue-simulator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calculator, TrendingUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

interface RevenueSimulatorProps {
  currentMetrics: FunnelMetrics
  defaultGoal: number
}

export function RevenueSimulator({ currentMetrics, defaultGoal }: RevenueSimulatorProps) {
  const [targetRevenue, setTargetRevenue] = useState(defaultGoal)
  const [simulation, setSimulation] = useState(() =>
    simulateRevenueGoal(currentMetrics, defaultGoal)
  )

  const handleSimulate = () => {
    const newSimulation = simulateRevenueGoal(currentMetrics, targetRevenue)
    setSimulation(newSimulation)
  }

  // Ícone de viabilidade
  const FeasibilityIcon = {
    easy: CheckCircle2,
    moderate: TrendingUp,
    hard: AlertTriangle,
    unrealistic: XCircle,
  }[simulation.feasibility]

  const feasibilityColor = {
    easy: 'text-green-600',
    moderate: 'text-blue-600',
    hard: 'text-orange-600',
    unrealistic: 'text-red-600',
  }[simulation.feasibility]

  const feasibilityLabel = {
    easy: 'Viável',
    moderate: 'Moderado',
    hard: 'Desafiador',
    unrealistic: 'Irrealista',
  }[simulation.feasibility]

  return (
    <div className="space-y-6">
      {/* Input de Meta */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="target-revenue">Meta de Faturamento Mensal (R$)</Label>
          <Input
            id="target-revenue"
            type="number"
            value={targetRevenue}
            onChange={(e) => setTargetRevenue(Number(e.target.value))}
            placeholder="5000"
            min="0"
            step="100"
          />
        </div>
        <Button onClick={handleSimulate} className="gap-2">
          <Calculator className="h-4 w-4" />
          Simular
        </Button>
      </div>

      {/* Resultado da Simulação */}
      <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">
              Resultado da Simulação
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Para faturar <strong>R$ {targetRevenue.toLocaleString('pt-BR')}</strong> por mês
            </p>
          </div>
          <div className={`flex items-center gap-2 ${feasibilityColor}`}>
            <FeasibilityIcon className="h-5 w-5" />
            <span className="font-medium">{feasibilityLabel}</span>
          </div>
        </div>

        {/* Meta de Customers */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Clientes Pagantes Necessários
          </p>
          <p className="text-3xl font-bold">
            {simulation.targetCustomers} clientes PRO
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Com ticket médio de R$ {currentMetrics.unitEconomics.averageTicket}
          </p>
        </div>

        {/* Tabela de Crescimento Necessário */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {Object.entries(simulation.requiredGrowth).map(([stage, data]) => (
            <div key={stage} className="bg-white dark:bg-gray-900 p-3 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 capitalize">
                {stage === 'impressions'
                  ? 'Impressões'
                  : stage === 'clicks'
                  ? 'Cliques'
                  : stage === 'signups'
                  ? 'Cadastros'
                  : 'Ativados'}
              </p>
              <p className="text-sm font-medium mb-1">
                {data.current.toLocaleString('pt-BR')} →{' '}
                {data.required.toLocaleString('pt-BR')}
              </p>
              <p
                className={`text-xs font-semibold ${
                  data.growthRate > 100 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {data.growthRate > 0 ? '+' : ''}
                {data.growthRate}%
              </p>
            </div>
          ))}
        </div>

        {/* Recomendação Primária */}
        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-3">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            🎯 Recomendação Primária
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {simulation.primaryRecommendation}
          </p>
        </div>

        {/* Estratégia Alternativa */}
        <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
            💡 Estratégia Alternativa
          </p>
          <p className="text-sm text-purple-800 dark:text-purple-200">
            {simulation.alternativeStrategy}
          </p>
        </div>
      </div>

      {/* Nota de Rodapé */}
      <p className="text-xs text-gray-500 text-center">
        * Simulação baseada nas taxas de conversão dos últimos{' '}
        {Math.floor(
          (new Date(currentMetrics.dateRange.endDate).getTime() -
            new Date(currentMetrics.dateRange.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )}{' '}
        dias. Resultados reais podem variar.
      </p>
    </div>
  )
}
