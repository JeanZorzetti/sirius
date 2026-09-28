'use client'

/**
 * Spec 017: the companies a contact belongs to and the contact's role in each (decisor, influenciador, champion).
 * Typing a company name that already exists in the account links to it instead of creating a second one.
 */

import { useCallback, useEffect, useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { desvincularEmpresa, empresasDoContato, mudarPapel, vincularEmpresa } from '@/app/[locale]/dashboard/settings/campos/actions'

type Papel = 'DECISOR' | 'INFLUENCIADOR' | 'CHAMPION' | 'OUTRO'
type Vinculo = { id: string; role: Papel; company: { id: string; name: string } }

export const PAPEIS: { value: Papel; label: string }[] = [
  { value: 'DECISOR', label: 'Decisor' },
  { value: 'INFLUENCIADOR', label: 'Influenciador' },
  { value: 'CHAMPION', label: 'Champion (defende a compra)' },
  { value: 'OUTRO', label: 'Outro' },
]

const selectClass = 'rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export function EmpresaDoContato({ contactId, nomeDoContato }: { contactId: string; nomeDoContato: string }) {
  const id = useId()
  const [vinculos, setVinculos] = useState<Vinculo[] | null>(null)
  const [nome, setNome] = useState('')
  const [papel, setPapel] = useState<Papel>('OUTRO')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const recarregar = useCallback(() => {
    empresasDoContato(contactId).then(v => setVinculos(v as Vinculo[]))
  }, [contactId])
  useEffect(recarregar, [recarregar])

  const adicionar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    const r = await vincularEmpresa(contactId, nome, papel)
    setSalvando(false)
    if (!r.ok) { setErro(r.erro); return }
    setErro(null); setNome(''); setPapel('OUTRO'); recarregar()
  }

  return (
    <div className="space-y-3">
      {vinculos === null ? (
        <p className="text-xs text-muted-foreground">Carregando empresas…</p>
      ) : vinculos.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma empresa ligada a este contato.</p>
      ) : (
        <ul className="space-y-2">
          {vinculos.map(v => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium">{v.company.name}</span>
              <span className="flex items-center gap-1">
                <select
                  aria-label={`Papel de ${nomeDoContato} em ${v.company.name}`}
                  value={v.role}
                  onChange={async e => { await mudarPapel(v.id, e.target.value as Papel); recarregar() }}
                  className={selectClass}
                >
                  {PAPEIS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Tirar ${v.company.name} deste contato`}
                  onClick={async () => { await desvincularEmpresa(v.id); recarregar() }}
                >
                  Tirar
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={adicionar} className="flex flex-wrap items-end gap-2">
        <div className="min-w-[10rem] flex-1 space-y-1">
          <Label htmlFor={`${id}-empresa`} className="text-xs">Empresa</Label>
          <Input id={`${id}-empresa`} value={nome} onChange={e => setNome(e.target.value)} aria-describedby={erro ? `${id}-erro` : undefined} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${id}-papel`} className="text-xs">Papel</Label>
          <select id={`${id}-papel`} value={papel} onChange={e => setPapel(e.target.value as Papel)} className={selectClass}>
            {PAPEIS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <Button type="submit" size="sm" disabled={salvando || !nome.trim()}>Ligar empresa</Button>
      </form>
      {erro && <p id={`${id}-erro`} role="alert" className="text-xs text-destructive">{erro}</p>}
    </div>
  )
}
