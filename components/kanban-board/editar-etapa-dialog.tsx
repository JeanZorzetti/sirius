'use client'

/**
 * Spec 016: edit a stage's name, chance of closing and colour. The chance feeds the weighted forecast; leaving it
 * empty keeps the default (100 on a won stage, 0 on a lost one, an even climb on the open ones).
 */

import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CORES_DE_ETAPA, type CorDeEtapa } from '@/lib/pipeline/previsao'
import type { Stage } from './types'

export type EdicaoDeEtapa = { name: string; probability: number | null; color: string | null }

export function EditarEtapaDialog({
  stage,
  chancePadrao,
  open,
  onOpenChange,
  onSalvar,
}: {
  stage: Stage
  chancePadrao: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSalvar: (edicao: EdicaoDeEtapa) => Promise<string | null>
}) {
  const id = useId()
  const [nome, setNome] = useState(stage.name)
  const [chance, setChance] = useState(stage.probability != null ? String(stage.probability) : '')
  const [cor, setCor] = useState<string | null>(stage.color ?? null)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    const n = chance.trim() === '' ? null : Number(chance)
    if (n != null && (!Number.isInteger(n) || n < 0 || n > 100)) {
      setErro('Use um número inteiro de 0 a 100.')
      return
    }
    setSalvando(true)
    const falha = await onSalvar({ name: nome.trim(), probability: n, color: cor })
    setSalvando(false)
    if (falha) setErro(falha)
    else onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar etapa</DialogTitle>
        </DialogHeader>
        <form onSubmit={salvar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-nome`}>Nome</Label>
            <Input id={`${id}-nome`} value={nome} onChange={e => setNome(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-chance`}>Chance de fechar (%)</Label>
            <Input
              id={`${id}-chance`}
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              placeholder={String(chancePadrao)}
              value={chance}
              onChange={e => { setChance(e.target.value); setErro(null) }}
              aria-describedby={`${id}-chance-dica`}
              aria-invalid={erro ? true : undefined}
            />
            <p id={`${id}-chance-dica`} className="text-xs text-muted-foreground">
              Entra na previsão ponderada: valor do negócio × chance. Em branco, usa {chancePadrao}%.
            </p>
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">Cor</legend>
            <div className="flex flex-wrap gap-2">
              <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs has-[:checked]:border-foreground">
                <input type="radio" name={`${id}-cor`} className="sr-only" checked={cor == null} onChange={() => setCor(null)} />
                Sem cor
              </label>
              {(Object.keys(CORES_DE_ETAPA) as CorDeEtapa[]).map(k => (
                <label key={k} className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs has-[:checked]:border-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
                  <input type="radio" name={`${id}-cor`} className="sr-only" checked={cor === k} onChange={() => setCor(k)} />
                  <span aria-hidden className="h-3 w-3 rounded-full" style={{ background: CORES_DE_ETAPA[k].valor }} />
                  {CORES_DE_ETAPA[k].nome}
                </label>
              ))}
            </div>
          </fieldset>
          {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={salvando || !nome.trim()}>{salvando ? 'Salvando…' : 'Salvar etapa'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
