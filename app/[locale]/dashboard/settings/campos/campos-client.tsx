'use client'

/** Spec 017: owners and managers create the account's custom fields for the contact and the deal sheets. */

import { useCallback, useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apagarCampo, criarCampo, listarCampos } from './actions'
import { ROTULO_DO_TIPO, type TipoCampo } from '@/lib/campos-personalizados'

type Entidade = 'CONTACT' | 'DEAL'
type Campo = { id: string; label: string; type: TipoCampo; options: string[] }

const selectClass = 'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

function Secao({ entidade, titulo }: { entidade: Entidade; titulo: string }) {
  const id = useId()
  const [campos, setCampos] = useState<Campo[] | null>(null)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoCampo>('TEXTO')
  const [opcoes, setOpcoes] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(() => { listarCampos(entidade).then(c => setCampos(c as Campo[])) }, [entidade])
  useEffect(recarregar, [recarregar])

  const criar = async (e: React.FormEvent) => {
    e.preventDefault()
    const r = await criarCampo({ entity: entidade, label: nome, type: tipo, options: opcoes.split(',') })
    if (!r.ok) { setErro(r.erro); return }
    setErro(null); setNome(''); setOpcoes(''); setTipo('TEXTO'); recarregar()
  }

  return (
    <section aria-labelledby={`${id}-titulo`} className="space-y-4 rounded-lg border border-border p-4">
      <h2 id={`${id}-titulo`} className="text-base font-semibold">{titulo}</h2>
      {campos === null ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : campos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum campo ainda. Crie o primeiro abaixo.</p>
      ) : (
        <ul className="divide-y divide-border">
          {campos.map(c => (
            <li key={c.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span>
                <span className="font-medium">{c.label}</span>{' '}
                <span className="text-muted-foreground">· {ROTULO_DO_TIPO[c.type]}{c.options.length ? ` (${c.options.join(', ')})` : ''}</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                aria-label={`Apagar o campo ${c.label}`}
                onClick={async () => {
                  if (!confirm(`Apagar o campo "${c.label}"? Os valores preenchidos nele também serão apagados.`)) return
                  const r = await apagarCampo(c.id)
                  if (!r.ok) setErro(r.erro)
                  recarregar()
                }}
              >
                Apagar
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={criar} className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <div className="space-y-1">
          <Label htmlFor={`${id}-nome`}>Nome do campo</Label>
          <Input id={`${id}-nome`} value={nome} onChange={e => setNome(e.target.value)} maxLength={60} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${id}-tipo`}>Tipo</Label>
          <select id={`${id}-tipo`} value={tipo} onChange={e => setTipo(e.target.value as TipoCampo)} className={selectClass}>
            {(Object.keys(ROTULO_DO_TIPO) as TipoCampo[]).map(t => <option key={t} value={t}>{ROTULO_DO_TIPO[t]}</option>)}
          </select>
        </div>
        <Button type="submit" disabled={!nome.trim()}>Criar campo</Button>
        {tipo === 'SELECAO' && (
          <div className="space-y-1 sm:col-span-3">
            <Label htmlFor={`${id}-opcoes`}>Opções</Label>
            <Input id={`${id}-opcoes`} value={opcoes} onChange={e => setOpcoes(e.target.value)} aria-describedby={`${id}-opcoes-dica`} />
            <p id={`${id}-opcoes-dica`} className="text-xs text-muted-foreground">Separe por vírgula. Exemplo: Bronze, Prata, Ouro.</p>
          </div>
        )}
      </form>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    </section>
  )
}

export function CamposClient() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div className="space-y-1">
        <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Configurações
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Campos personalizados</h1>
        <p className="text-sm text-muted-foreground">
          Informações próprias do seu negócio na ficha do contato e do negócio. Só o dono e o gerente da conta criam ou apagam campos.
        </p>
      </div>
      <Secao entidade="CONTACT" titulo="Ficha do contato" />
      <Secao entidade="DEAL" titulo="Ficha do negócio" />
    </div>
  )
}
