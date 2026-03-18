'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  Users,
  Building2,
  Target,
  Activity,
} from 'lucide-react'
import { PlatformKPICard } from '@/components/analytics/platform-kpi-card'
import {
  RevenueTrendChart,
  OrganizationDistributionChart,
  NewOrganizationsChart,
} from '@/components/analytics/revenue-trend-chart'
import { ForecastChart } from '@/components/analytics/forecast-chart'
import {
  getPlatformKPIs,
  getRevenueSnapshots,
  getLatestForecast,
  getPlatformStats,
} from './actions'

export function AdminAnalyticsClient() {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<any>(null)
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [forecast, setForecast] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear()

      try {
        const [kpisResult, snapshotsResult, forecastResult, statsResult] =
          await Promise.all([
            getPlatformKPIs(currentMonth, currentYear),
            getRevenueSnapshots(6), // Últimos 6 meses
            getLatestForecast(),
            getPlatformStats(),
          ])

        if (kpisResult.success) {
          setKpis(kpisResult.data)
        }
        if (snapshotsResult.success) {
          setSnapshots(snapshotsResult.data || [])
        }
        if (forecastResult.success) {
          setForecast(forecastResult.data)
        }
        if (statsResult.success) {
          setStats(statsResult.data)
        }
      } catch (error) {
        console.error('Error fetching admin analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Analytics da Plataforma
        </h1>
        <p className="text-muted-foreground">
          Métricas e KPIs globais do Sirius CRM
        </p>
      </div>

      {/* KPI Cards - Linha 1: Receita */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PlatformKPICard
          title="MRR"
          value={
            kpis
              ? kpis.mrr.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : '-'
          }
          subtitle="Monthly Recurring Revenue"
          icon={DollarSign}
          loading={loading}
          variant="success"
        />
        <PlatformKPICard
          title="ARR"
          value={
            kpis
              ? kpis.arr.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : '-'
          }
          subtitle="Annual Recurring Revenue"
          icon={TrendingUp}
          loading={loading}
          variant="success"
        />
        <PlatformKPICard
          title="Churn Rate"
          value={kpis ? `${kpis.churnRate.toFixed(1)}%` : '-'}
          subtitle="Taxa de cancelamento"
          icon={Activity}
          loading={loading}
          variant={kpis && kpis.churnRate > 5 ? 'warning' : 'default'}
        />
        <PlatformKPICard
          title="LTV / CAC"
          value={
            kpis && kpis.ltvCacRatio > 0
              ? `${kpis.ltvCacRatio.toFixed(1)}x`
              : 'N/A'
          }
          subtitle="Ratio (ideal > 3x)"
          icon={Target}
          loading={loading}
          variant={
            kpis && kpis.ltvCacRatio >= 3
              ? 'success'
              : kpis && kpis.ltvCacRatio > 0
              ? 'warning'
              : 'default'
          }
        />
      </div>

      {/* KPI Cards - Linha 2: Organizações */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PlatformKPICard
          title="Total de Organizações"
          value={kpis ? kpis.totalOrganizations : '-'}
          subtitle="Todas as organizações"
          icon={Building2}
          loading={loading}
        />
        <PlatformKPICard
          title="Organizações Pagas"
          value={kpis ? kpis.proOrganizations : '-'}
          subtitle={
            kpis
              ? `${((kpis.proOrganizations / kpis.totalOrganizations) * 100).toFixed(1)}% do total`
              : ''
          }
          icon={Users}
          loading={loading}
          variant="success"
        />
        <PlatformKPICard
          title="Organizações FREE"
          value={kpis ? kpis.freeOrganizations : '-'}
          subtitle={
            kpis
              ? `${((kpis.freeOrganizations / kpis.totalOrganizations) * 100).toFixed(1)}% do total`
              : ''
          }
          icon={Users}
          loading={loading}
        />
        <PlatformKPICard
          title="LTV Médio"
          value={
            kpis && kpis.ltv > 0
              ? kpis.ltv.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : 'N/A'
          }
          subtitle="Lifetime Value por cliente"
          icon={DollarSign}
          loading={loading}
        />
      </div>

      {/* Gráficos - Linha 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <RevenueTrendChart data={snapshots} loading={loading} />
        <ForecastChart data={forecast} loading={loading} />
      </div>

      {/* Gráficos - Linha 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <OrganizationDistributionChart
          data={{
            freeOrganizations: kpis?.freeOrganizations || 0,
            proOrganizations: kpis?.proOrganizations || 0,
          }}
          loading={loading}
        />
        <NewOrganizationsChart data={snapshots} loading={loading} />
      </div>

      {/* Tabela de Snapshots Históricos */}
      {snapshots.length > 0 && (
        <div className="rounded-lg border">
          <div className="p-4">
            <h3 className="text-lg font-semibold">Histórico de Revenue Snapshots</h3>
            <p className="text-sm text-muted-foreground">
              Últimos {snapshots.length} meses de dados
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-t bg-muted/50">
                <tr>
                  <th className="p-3 text-left font-medium">Mês/Ano</th>
                  <th className="p-3 text-right font-medium">MRR</th>
                  <th className="p-3 text-right font-medium">ARR</th>
                  <th className="p-3 text-right font-medium">Orgs</th>
                  <th className="p-3 text-right font-medium">PRO</th>
                  <th className="p-3 text-right font-medium">FREE</th>
                  <th className="p-3 text-right font-medium">Novas</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {snapshots.map((snapshot, index) => (
                  <tr key={index} className="hover:bg-muted/50">
                    <td className="p-3">
                      {snapshot.month.toString().padStart(2, '0')}/{snapshot.year}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {snapshot.mrr.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {snapshot.arr.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="p-3 text-right">{snapshot.totalOrganizations}</td>
                    <td className="p-3 text-right text-green-600 dark:text-green-400">
                      {snapshot.proOrganizations}
                    </td>
                    <td className="p-3 text-right text-muted-foreground">
                      {snapshot.freeOrganizations}
                    </td>
                    <td className="p-3 text-right text-blue-600 dark:text-blue-400">
                      {snapshot.newOrganizations}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
