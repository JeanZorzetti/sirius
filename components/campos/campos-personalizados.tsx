'use client'

/**
 * Spec 017: the account's custom fields on a contact or a deal. Each field saves on its own when it loses focus (or
 * on change, for checkbox, select and date), and an invalid value keeps the input and says why under it.
 */

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { lerValores, salvarValor } from '@/app/[locale]/dashboard/settings/campos/actions'
import { valorParaTela, type TipoCampo } from '@/lib/campos-personalizados'

type Campo = { id: string; label: string; type: TipoCampo; options: string[] }

export function CamposPersonalizados({ entity, recordId }: { entity: 'CONTACT' | 'DEAL'; recordId: string }) {
  const id = useId()
  const [campos, setCampos] = useState<Campo[] | null>(null)
  const [valores, setValores] = useState<Record<string, string | boolean>>({})
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvo, setSalvo] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    lerValores(entity, recordId).then(({ campos, valores }) => {
      if (!vivo) return
      const cs = campos as Campo[]
      setCampos(cs)
      setValores(Object.fromEntries(cs.map(c => [c.id, valorParaTela(c.type, valores.find(v => v.definitionId === c.id))])))
    })
    return () => { vivo = false }
  }, [entity, recordId])

  if (campos === null) return <p className="text-xs text-muted-foreground">Carregando campos personalizados…</p>
  if (campos.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Nenhum campo personalizado. <Link href="/dashboard/settings/campos" className="underline">Criar campos</Link>
      </p>
    )
  }

  const salvar = async (c: Campo, bruto: string | boolean) => {
    const r = await salvarValor(c.id, recordId, bruto === '' ? null : bruto)
    setErros(e => ({ ...e, [c.id]: r.ok ? '' : r.erro }))
    if (r.ok) { setSalvo(c.id); setTimeout(() => setSalvo(s => (s === c.id ? null : s)), 1500) }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {campos.map(c => {
        const campoId = `${id}-${c.id}`
        const erro = erros[c.id]
        const valor = valores[c.id]
        const definir = (v: string | boolean) => setValores(vs => ({ ...vs, [c.id]: v }))
        return (
          <div key={c.id} className="space-y-1">
            {c.type === 'CHECKBOX' ? (
              <label htmlFor={campoId} className="flex items-center gap-2 text-sm">
                <input
                  id={campoId}
                  type="checkbox"
                  className="h-4 w-4"
                  checked={valor === true}
                  onChange={e => { definir(e.target.checked); void salvar(c, e.target.checked) }}
                />
                {c.label}
              </label>
            ) : (
              <>
                <Label htmlFor={campoId} className="text-xs">{c.label}</Label>
                {c.type === 'SELECAO' ? (
                  <select
                    id={campoId}
                    value={String(valor ?? '')}
                    onChange={e => { definir(e.target.value); void salvar(c, e.target.value) }}
                    aria-invalid={erro ? true : undefined}
                    aria-describedby={erro ? `${campoId}-erro` : undefined}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">—</option>
                    {c.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <Input
                    id={campoId}
                    type={c.type === 'DATA' ? 'date' : 'text'}
                    inputMode={c.type === 'NUMERO' ? 'decimal' : undefined}
                    value={String(valor ?? '')}
                    onChange={e => { definir(e.target.value); if (c.type === 'DATA') void salvar(c, e.target.value) }}
                    onBlur={e => { if (c.type !== 'DATA') void salvar(c, e.target.value) }}
                    aria-invalid={erro ? true : undefined}
                    aria-describedby={erro ? `${campoId}-erro` : undefined}
                  />
                )}
              </>
            )}
            {erro ? (
              <p id={`${campoId}-erro`} role="alert" className="text-xs text-destructive">{erro}</p>
            ) : salvo === c.id ? (
              <p className="text-xs text-muted-foreground" aria-live="polite">Salvo</p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
