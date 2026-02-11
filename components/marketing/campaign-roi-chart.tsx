'use client'

/**
 * ✅ FASE 17: Gráfico de ROI de Campanhas (Client Component)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from 'recharts'

interface DailySpend {
  date: string
  spend: number
  conversions: number
  cac: number
}

interface CampaignSummary {
  campaignName: string
  source: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  cpc: number
  cpa: number
}

interface CampaignROIChartProps {
  dailyData: DailySpend[]
  campaignSummary: CampaignSummary[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

const SOURCE_COLORS: Record<string, string> = {
  google_ads: '#4285F4',
  facebook_ads: '#1877F2',
  manual: '#6b7280',
}

export function CampaignROIChart({ dailyData, campaignSummary }: CampaignROIChartProps) {
  return (
    <div className="space-y-6">
      {/* Gasto diário */}
      {dailyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gasto e Conversões por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'spend' ? formatCurrency(Number(value ?? 0)) : value,
                      name === 'spend' ? 'Gasto' : 'Conversões',
                    ]}
                  />
                  <Legend formatter={v => v === 'spend' ? 'Gasto' : 'Conversões'} />
                  <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top campanhas por gasto */}
      {campaignSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Campanhas por Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignSummary.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                  <YAxis
                    type="category"
                    dataKey="campaignName"
                    width={140}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value ?? 0)),
                      'Gasto',
                    ]}
                  />
                  <Bar dataKey="spend" radius={[0, 4, 4, 0]}>
                    {campaignSummary.slice(0, 8).map((entry, i) => (
                      <rect
                        key={`rect-${i}`}
                        fill={SOURCE_COLORS[entry.source] ?? '#8b5cf6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
