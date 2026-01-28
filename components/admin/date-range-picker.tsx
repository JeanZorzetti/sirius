'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DateRangePickerProps {
  currentStartDate: string
  currentEndDate: string
}

// Preset options
const presets = [
  { label: 'Ultimos 7 dias', value: '7d' },
  { label: 'Ultimos 14 dias', value: '14d' },
  { label: 'Ultimos 28 dias', value: '28d' },
  { label: 'Ultimos 3 meses', value: '3m' },
  { label: 'Personalizado', value: 'custom' },
]

function formatDateForDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function getPresetDates(preset: string): { from: string; to: string } {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const endDate = yesterday.toISOString().split('T')[0]
  let startDate: string

  switch (preset) {
    case '7d':
      const start7 = new Date(today)
      start7.setDate(start7.getDate() - 7)
      startDate = start7.toISOString().split('T')[0]
      break
    case '14d':
      const start14 = new Date(today)
      start14.setDate(start14.getDate() - 14)
      startDate = start14.toISOString().split('T')[0]
      break
    case '28d':
      const start28 = new Date(today)
      start28.setDate(start28.getDate() - 28)
      startDate = start28.toISOString().split('T')[0]
      break
    case '3m':
      const start3m = new Date(today)
      start3m.setMonth(start3m.getMonth() - 3)
      startDate = start3m.toISOString().split('T')[0]
      break
    default:
      const defaultStart = new Date(today)
      defaultStart.setDate(defaultStart.getDate() - 28)
      startDate = defaultStart.toISOString().split('T')[0]
  }

  return { from: startDate, to: endDate }
}

function getCurrentPreset(startDate: string, endDate: string): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const expectedEnd = yesterday.toISOString().split('T')[0]

  if (endDate !== expectedEnd) return 'custom'

  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 7) return '7d'
  if (diffDays === 14) return '14d'
  if (diffDays === 28) return '28d'

  // Check for ~3 months
  const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  if (diffMonths >= 2 && diffMonths <= 3) return '3m'

  return 'custom'
}

export function DateRangePicker({ currentStartDate, currentEndDate }: DateRangePickerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [customFrom, setCustomFrom] = useState(currentStartDate)
  const [customTo, setCustomTo] = useState(currentEndDate)
  const [isCustomOpen, setIsCustomOpen] = useState(false)

  const currentPreset = getCurrentPreset(currentStartDate, currentEndDate)

  const updateDateRange = useCallback(
    (from: string, to: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('from', from)
      params.set('to', to)
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  const handlePresetChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomOpen(true)
      return
    }

    const { from, to } = getPresetDates(value)
    updateDateRange(from, to)
  }

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      updateDateRange(customFrom, customTo)
      setIsCustomOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={currentPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px] bg-white border-slate-200">
          <Calendar className="h-4 w-4 mr-2 text-slate-500" />
          <SelectValue placeholder="Selecione periodo" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-slate-600 bg-white border-slate-200"
          >
            {formatDateForDisplay(currentStartDate)} - {formatDateForDisplay(currentEndDate)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Periodo Personalizado</h4>
              <p className="text-xs text-slate-500">
                Selecione as datas de inicio e fim
              </p>
            </div>

            <div className="grid gap-3">
              <div className="space-y-1">
                <Label htmlFor="from" className="text-xs">
                  Data Inicio
                </Label>
                <Input
                  id="from"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="to" className="text-xs">
                  Data Fim
                </Label>
                <Input
                  id="to"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>

            <Button
              onClick={handleCustomApply}
              className="w-full"
              size="sm"
            >
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
