'use client'

import { SEODeviceData } from '@/lib/google-search-console'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Monitor, Smartphone, Tablet, TrendingDown, AlertCircle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface SEODeviceBreakdownProps {
  devices: SEODeviceData[]
}

const DEVICE_CONFIG = {
  desktop: {
    label: 'Desktop',
    icon: Monitor,
    color: '#3b82f6', // blue-500
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  mobile: {
    label: 'Mobile',
    icon: Smartphone,
    color: '#8b5cf6', // purple-500
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
  },
  tablet: {
    label: 'Tablet',
    icon: Tablet,
    color: '#ec4899', // pink-500
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
  },
}

export function SEODeviceBreakdown({ devices }: SEODeviceBreakdownProps) {
  // Safety check
  if (!devices || devices.length === 0) {
    return null
  }

  // Prepare data for pie chart - filter out invalid devices
  const chartData = devices
    .filter((device) => device.device && DEVICE_CONFIG[device.device])
    .map((device) => ({
      name: DEVICE_CONFIG[device.device].label,
      value: device.clicks,
      percentage: device.percentage,
      deviceType: device.device,
    }))

  // Detect mobile issues (mobile CTR significantly lower than desktop)
  const desktopDevice = devices.find((d) => d.device === 'desktop')
  const mobileDevice = devices.find((d) => d.device === 'mobile')
  const hasMobileIssue =
    desktopDevice &&
    mobileDevice &&
    mobileDevice.ctr < desktopDevice.ctr * 0.7 // Mobile CTR < 70% of desktop

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-slate-900">Breakdown por Dispositivo</CardTitle>
            <CardDescription className="text-slate-500">
              Performance em Desktop, Mobile e Tablet
            </CardDescription>
          </div>

          {hasMobileIssue && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 border border-yellow-300">
              <AlertCircle className="h-4 w-4 text-yellow-700" />
              <span className="text-xs font-medium text-yellow-800">Alerta Mobile</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pie Chart */}
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, index }) => {
                    if (
                      typeof midAngle === 'undefined' ||
                      typeof index === 'undefined' ||
                      typeof cx === 'undefined' ||
                      typeof cy === 'undefined' ||
                      typeof innerRadius === 'undefined' ||
                      typeof outerRadius === 'undefined'
                    ) {
                      return null
                    }

                    const RADIAN = Math.PI / 180
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                    const x = cx + radius * Math.cos(-midAngle * RADIAN)
                    const y = cy + radius * Math.sin(-midAngle * RADIAN)
                    const percentage = chartData[index].percentage

                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        className="text-xs font-bold"
                      >
                        {`${percentage.toFixed(0)}%`}
                      </text>
                    )
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => {
                    const deviceType = entry.deviceType
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={DEVICE_CONFIG[deviceType].color}
                      />
                    )
                  })}
                </Pie>
                <Tooltip
                  formatter={(value: number | undefined) => {
                    if (typeof value === 'undefined') return ['0 cliques', 'Total']
                    return [`${value.toLocaleString('pt-BR')} cliques`, 'Total']
                  }}
                />
                <Legend
                  formatter={(value: string) => {
                    // Find the device by name - with safety check
                    const device = devices.find(d => d.device && DEVICE_CONFIG[d.device] && DEVICE_CONFIG[d.device].label === value)
                    if (!device) return value
                    return `${value} (${device.percentage.toFixed(1)}%)`
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Device Cards */}
          <div className="space-y-3">
            {devices
              .filter((device) => device.device && DEVICE_CONFIG[device.device])
              .map((device) => {
                const config = DEVICE_CONFIG[device.device]
                const Icon = config.icon

                return (
                <div
                  key={device.device}
                  className={`p-4 rounded-lg border-2 ${config.borderColor} ${config.bgColor}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className={`h-5 w-5 ${config.textColor}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {config.label}
                        </p>
                        <p className={`text-xl font-bold ${config.textColor}`}>
                          {device.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div>
                      <p className="font-medium">Cliques</p>
                      <p className="text-sm font-bold text-slate-900">
                        {device.clicks.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Impressões</p>
                      <p className="text-sm font-bold text-slate-900">
                        {device.impressions.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">CTR</p>
                      <p className="text-sm font-bold text-slate-900">
                        {device.ctr.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Posição Média</p>
                      <p className="text-sm font-bold text-slate-900">
                        {device.position.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile Issue Warning */}
        {hasMobileIssue && mobileDevice && desktopDevice && (
          <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-start gap-3">
              <TrendingDown className="h-5 w-5 text-yellow-700 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-yellow-800 mb-1">
                  ⚠️ Problema de UX Mobile Detectado
                </p>
                <p className="text-xs text-yellow-700">
                  O CTR mobile ({mobileDevice.ctr.toFixed(2)}%) está{' '}
                  {((1 - mobileDevice.ctr / desktopDevice.ctr) * 100).toFixed(0)}% abaixo do
                  desktop ({desktopDevice.ctr.toFixed(2)}%). Isso pode indicar problemas de
                  usabilidade mobile ou snippets não otimizados para dispositivos móveis.
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  <span className="font-medium">Ação recomendada:</span> Verificar Core Web Vitals
                  mobile e testar snippets em dispositivos móveis.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
