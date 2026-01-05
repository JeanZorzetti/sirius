'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import { useState } from 'react'

export type PeriodOption = '7d' | '30d' | '90d' | 'custom'

interface PeriodSelectorProps {
  value: PeriodOption
  onChange: (period: PeriodOption) => void
  onCustomDateChange?: (startDate: Date, endDate: Date) => void
}

export function PeriodSelector({
  value,
  onChange,
  onCustomDateChange,
}: PeriodSelectorProps) {
  const [showCustom, setShowCustom] = useState(false)

  const periods: { value: PeriodOption; label: string }[] = [
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
    { value: 'custom', label: 'Personalizado' },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={value === period.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            onChange(period.value)
            if (period.value === 'custom') {
              setShowCustom(true)
            } else {
              setShowCustom(false)
            }
          }}
          className="text-xs"
        >
          {period.value === 'custom' && <Calendar className="mr-1 h-3 w-3" />}
          {period.label}
        </Button>
      ))}
    </div>
  )
}

/**
 * Helper para calcular datas baseado no período
 */
export function getPeriodDates(period: PeriodOption): {
  startDate: Date
  endDate: Date
} {
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)

  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)

  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(startDate.getDate() - 30)
      break
    case '90d':
      startDate.setDate(startDate.getDate() - 90)
      break
    case 'custom':
      // Para custom, as datas devem ser fornecidas externamente
      break
  }

  return { startDate, endDate }
}
