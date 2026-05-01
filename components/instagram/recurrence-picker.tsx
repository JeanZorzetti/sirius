'use client'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface RecurrenceValue {
  rule: 'NONE' | 'WEEKLY' | 'MONTHLY'
  endDate: string // ISO date string or ''
}

interface Props {
  value: RecurrenceValue
  onChange: (v: RecurrenceValue) => void
  disabled?: boolean
}

export function RecurrencePicker({ value, onChange, disabled }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Repetir</Label>
        <Select
          value={value.rule}
          onValueChange={rule => onChange({ ...value, rule: rule as RecurrenceValue['rule'] })}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">Não repetir</SelectItem>
            <SelectItem value="WEEKLY">Toda semana</SelectItem>
            <SelectItem value="MONTHLY">Todo mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value.rule !== 'NONE' && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Repetir até (opcional)</Label>
          <Input
            type="date"
            value={value.endDate}
            onChange={e => onChange({ ...value, endDate: e.target.value })}
            disabled={disabled}
            className="h-8 text-xs"
          />
        </div>
      )}
    </div>
  )
}
