'use client'

/**
 * Spec 014: config fields for the SEND_WHATSAPP and UPDATE_FIELD actions, shared by the new and edit automation pages.
 * Labels are visible (not placeholders) and the rules that decide whether a message goes out are written under the
 * field, since a refusal only shows up later in the execution history.
 */

import { useEffect, useId, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Config = Record<string, string>
type Props = {
  type: string
  config: Config
  onChange: (key: string, value: string) => void
}

const CAMPOS = [
  { value: 'value', label: 'Valor do negócio' },
  { value: 'userId', label: 'Responsável' },
  { value: 'closeDate', label: 'Data prevista de fechamento' },
  { value: 'dueDate', label: 'Data do retorno' },
] as const

export const ACOES_NOVAS = [
  { value: 'SEND_WHATSAPP', label: 'Enviar WhatsApp' },
  { value: 'UPDATE_FIELD', label: 'Atualizar campo' },
] as const

export const CONFIG_INICIAL_ACOES_NOVAS: { SEND_WHATSAPP: Config; UPDATE_FIELD: Config } = {
  SEND_WHATSAPP: { message: '' },
  UPDATE_FIELD: { field: 'dueDate', value: '' },
}

export function CamposAcoesNovas({ type, config, onChange }: Props) {
  const id = useId()
  const [membros, setMembros] = useState<{ id: string; name: string | null; email: string }[]>([])
  const campo = config.field || 'dueDate'

  useEffect(() => {
    if (type !== 'UPDATE_FIELD' || campo !== 'userId' || membros.length > 0) return
    fetch('/api/org/members').then(r => (r.ok ? r.json() : [])).then(setMembros).catch(() => {})
  }, [type, campo, membros.length])

  if (type === 'SEND_WHATSAPP') {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-msg`}>Mensagem</Label>
        <textarea
          id={`${id}-msg`}
          value={config.message || ''}
          onChange={e => onChange('message', e.target.value)}
          rows={3}
          aria-describedby={`${id}-msg-dica`}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <p id={`${id}-msg-dica`} className="text-xs text-muted-foreground">
          Use {'{{contactName}}'}, {'{{dealTitle}}'} e {'{{dealValue}}'}. Sai só pela API Oficial do WhatsApp e só se o
          contato escreveu nas últimas 24 horas. Até 200 mensagens automáticas por dia. Quando não puder enviar, o motivo
          fica no histórico da automação.
        </p>
      </div>
    )
  }

  if (type === 'UPDATE_FIELD') {
    const ehData = campo === 'closeDate' || campo === 'dueDate'
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-campo`}>Campo</Label>
          <select
            id={`${id}-campo`}
            value={campo}
            onChange={e => { onChange('field', e.target.value); onChange('value', '') }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CAMPOS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-valor`}>{campo === 'userId' ? 'Novo responsável' : ehData ? 'Daqui a quantos dias' : 'Novo valor (R$)'}</Label>
          {campo === 'userId' ? (
            <select
              id={`${id}-valor`}
              value={config.value || ''}
              onChange={e => onChange('value', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Escolha alguém da equipe</option>
              {membros.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
            </select>
          ) : (
            <Input
              id={`${id}-valor`}
              type="number"
              inputMode={ehData ? 'numeric' : 'decimal'}
              min={0}
              step={ehData ? 1 : 0.01}
              value={config.value || ''}
              onChange={e => onChange('value', e.target.value)}
            />
          )}
        </div>
      </div>
    )
  }

  return null
}
