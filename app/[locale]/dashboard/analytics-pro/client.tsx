'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Target,
  DollarSign,
  Clock,
  Zap,
  Filter,
  RefreshCw,
} from 'lucide-react'
import { OrganizationKPICard } from '@/components/analytics/organization-kpi-card'
import {
  PeriodSelector,
  PeriodOption,
  getPeriodDates,
} from '@/components/analytics/period-selector'
import { PipelineTrendChart } from '@/components/analytics/pipeline-trend-chart'
import {
  ConversionFunnelChart,
  WinLossChart,
} from '@/components/analytics/funnel-chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  getOrganizationKPIs,
  getDealSnapshots,
  getConversionFunnelData,
  getWinLossData,
} from './actions'

interface AnalyticsProClientProps {
  pipelines: Array<{
    id: string
    name: string
    isDefault: boolean
  }>
}

export function AnalyticsProClient({ pipelines }: AnalyticsProClientProps) {
  const [period, setPeriod] = useState<PeriodOption>('30d')
  const [selectedPipeline, setSelectedPipeline] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [backfilling, setBackfilling] = useState(false)

  const [kpis, setKpis] = useState<any>(null)
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [funnelData, setFunnelData] = useState<any[]>([])
  const [winLossData, setWinLossData] = useState<any[]>([])

  // Buscar dados quando período ou pipeline mudarem
  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const { startDate, endDate } = getPeriodDates(period)
      const pipelineId = selectedPipeline === 'all' ? undefined : selectedPipeline

      try {
        const [kpisResult, snapshotsResult, funnelResult, winLossResult] =
          await Promise.all([
            getOrganizationKPIs(startDate, endDate, pipelineId),
            getDealSnapshots(startDate, endDate, pipelineId),
            getConversionFunnelData(startDate, endDate, pipelineId),
            getWinLossData(startDate, endDate, pipelineId),
          ])

        if (kpisResult.success) {
          setKpis(kpisResult.data)
        }
        if (snapshotsResult.success) {
          setSnapshots(snapshotsResult.data || [])
        }
        if (funnelResult.success) {
          setFunnelData(funnelResult.data || [])
        }
        if (winLossResult.success) {
          setWinLossData(winLossResult.data || [])
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period, selectedPipeline])

  // Popular dados históricos
  const handleBackfill = async () => {
    if (!confirm('Popular dados históricos dos últimos 90 dias? Isso pode levar alguns minutos.')) {
      return
    }

    setBackfilling(true)
    try {
      const response = await fetch('/api/analytics/backfill-snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 90 }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ Sucesso! ${result.stats.successful} snapshots criados.`)
        // Recarregar dados
        const { startDate, endDate } = getPeriodDates(period)
        const pipelineId = selectedPipeline === 'all' ? undefined : selectedPipeline
        const snapshotsResult = await getDealSnapshots(startDate, endDate, pipelineId)
        if (snapshotsResult.success) {
          setSnapshots(snapshotsResult.data || [])
        }
      } else {
        alert(`❌ Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('Backfill error:', error)
      alert('❌ Erro ao popular dados históricos')
    } finally {
      setBackfilling(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Analytics PRO
        </h1>
        <p className="text-muted-foreground">
          Insights avançados para otimizar suas vendas
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PeriodSelector value={period} onChange={setPeriod} />

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botão para popular dados históricos (se não houver snapshots) */}
          {snapshots.length === 0 && !loading && (
            <Button
              onClick={handleBackfill}
              disabled={backfilling}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${backfilling ? 'animate-spin' : ''}`} />
              {backfilling ? 'Populando...' : 'Popular Dados Históricos'}
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os pipelines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os pipelines</SelectItem>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                    {pipeline.isDefault && ' (Padrão)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <OrganizationKPICard
          title="Conversion Rate"
          value={kpis ? `${kpis.conversionRate.toFixed(1)}%` : '-'}
          subtitle="Taxa de conversão"
          icon={TrendingUp}
          loading={loading}
        />
        <OrganizationKPICard
          title="Win Rate"
          value={kpis ? `${kpis.winRate.toFixed(1)}%` : '-'}
          subtitle="Taxa de vitória"
          icon={Target}
          loading={loading}
        />
        <OrganizationKPICard
          title="Ticket Médio"
          value={
            kpis
              ? kpis.avgDealValue.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : '-'
          }
          subtitle="Valor médio do deal"
          icon={DollarSign}
          loading={loading}
        />
        <OrganizationKPICard
          title="Ciclo de Vendas"
          value={kpis ? `${kpis.salesCycleLength.toFixed(0)} dias` : '-'}
          subtitle="Tempo médio de fechamento"
          icon={Clock}
          loading={loading}
        />
        <OrganizationKPICard
          title="Velocidade"
          value={kpis ? `${kpis.pipelineVelocity.toFixed(2)}/dia` : '-'}
          subtitle="Deals fechados por dia"
          icon={Zap}
          loading={loading}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <PipelineTrendChart data={snapshots} loading={loading} />
        </div>

        <ConversionFunnelChart data={funnelData} loading={loading} />

        <WinLossChart data={winLossData} loading={loading} />
      </div>
    </div>
  )
}
