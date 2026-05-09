'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Repeat, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { cn, formatDateBR } from '@/lib/utils'

interface Recurrence {
  id: string
  frequency: string
  interval: number
  daysOfWeek: number[]
  dayOfMonth: number | null
  endDate: string | null
  maxOccurrences: number | null
  occurrencesCreated: number
  nextRunAt: string | null
  enabled: boolean
}

interface TaskRecurrenceConfigProps {
  taskId: string
}

const DAYS = [
  { value: 0, label: 'D' },
  { value: 1, label: 'S' },
  { value: 2, label: 'T' },
  { value: 3, label: 'Q' },
  { value: 4, label: 'Q' },
  { value: 5, label: 'S' },
  { value: 6, label: 'S' },
]

export function TaskRecurrenceConfig({ taskId }: TaskRecurrenceConfigProps) {
  const tCommon = useTranslations('common')
  const [recurrence, setRecurrence] = useState<Recurrence | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [frequency, setFrequency] = useState('WEEKLY')
  const [interval, setInterval] = useState(1)
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
  const [dayOfMonth, setDayOfMonth] = useState<number | ''>('')
  const [endDate, setEndDate] = useState('')
  const [maxOccurrences, setMaxOccurrences] = useState<number | ''>('')
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    load()
  }, [taskId])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/recurrence`)
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setRecurrence(data)
          setFrequency(data.frequency)
          setInterval(data.interval)
          setDaysOfWeek(data.daysOfWeek || [])
          setDayOfMonth(data.dayOfMonth || '')
          setEndDate(data.endDate ? data.endDate.slice(0, 10) : '')
          setMaxOccurrences(data.maxOccurrences || '')
          setEnabled(data.enabled)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/recurrence`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frequency,
          interval,
          daysOfWeek,
          dayOfMonth: dayOfMonth || null,
          endDate: endDate || null,
          maxOccurrences: maxOccurrences || null,
          enabled,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'fail')
      }
      toast.success(tCommon('toasts.saved'))
      load()
    } catch (e: any) {
      toast.error(e.message || tCommon('toasts.failedSave'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm('Remover recorrência?')) return
    try {
      const res = await fetch(`/api/tasks/${taskId}/recurrence`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('fail')
      setRecurrence(null)
      toast.success(tCommon('toasts.deleted'))
    } catch {
      toast.error(tCommon('toasts.failedDelete'))
    }
  }

  const toggleDay = (d: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    )
  }

  if (loading) {
    return <div className="text-xs text-muted-foreground">{tCommon('buttons.loading')}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Recorrência</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Ativo</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border/40 bg-card/30 p-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Frequência</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="mt-1 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Diária</SelectItem>
                <SelectItem value="WEEKLY">Semanal</SelectItem>
                <SelectItem value="BIWEEKLY">Quinzenal</SelectItem>
                <SelectItem value="MONTHLY">Mensal</SelectItem>
                <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                <SelectItem value="YEARLY">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Intervalo</Label>
            <Input
              type="number"
              min={1}
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
              className="mt-1 h-8 text-xs"
            />
          </div>
        </div>

        {frequency === 'WEEKLY' && (
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Dias da semana</Label>
            <div className="mt-1 flex gap-1">
              {DAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={cn(
                    'h-7 w-7 rounded-md text-[10px] font-semibold transition',
                    daysOfWeek.includes(d.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border/50 bg-card text-muted-foreground hover:bg-accent'
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {frequency === 'MONTHLY' && (
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Dia do mês</Label>
            <Input
              type="number"
              min={1}
              max={31}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="Ex: 15"
              className="mt-1 h-8 text-xs"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Termina em</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 h-8 text-xs"
            />
          </div>

          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Máx. ocorrências</Label>
            <Input
              type="number"
              min={1}
              value={maxOccurrences}
              onChange={(e) => setMaxOccurrences(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="Ilimitado"
              className="mt-1 h-8 text-xs"
            />
          </div>
        </div>

        {recurrence && (
          <div className="flex items-center justify-between rounded-md bg-muted/30 px-2 py-1.5 text-[10px] text-muted-foreground">
            <span>Criadas: {recurrence.occurrencesCreated}</span>
            {recurrence.nextRunAt && (
              <span>
                Próxima: {formatDateBR(recurrence.nextRunAt)}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          {recurrence && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10"
              onClick={remove}
            >
              <Trash2 className="h-3 w-3" />
              {tCommon('buttons.remove')}
            </Button>
          )}
          <Button size="sm" onClick={save} disabled={saving} className="h-7 gap-1 text-xs">
            <Save className="h-3 w-3" />
            {saving ? tCommon('buttons.saving') : tCommon('buttons.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
