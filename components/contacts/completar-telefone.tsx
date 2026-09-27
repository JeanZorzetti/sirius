'use client'

import { useId, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { completarTelefone } from '@/app/[locale]/dashboard/contacts/actions'

/**
 * "Completar cadastro" for a contact that has no phone: the ones WhatsApp sent with only a LID (spec 012, T058).
 * Without the phone the inbox cannot answer through an integrator.
 */
export function CompletarTelefone({ contactId, onSalvo }: { contactId: string; onSalvo?: (phone: string) => void }) {
  const id = useId()
  const [telefone, setTelefone] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvo, setSalvo] = useState<string | null>(null)
  const [salvando, iniciar] = useTransition()

  if (salvo) return <p role="status" className="text-sm text-muted-foreground">Telefone salvo: {salvo}</p>

  return (
    <form
      className="space-y-2 rounded-md border border-dashed border-border p-3 text-left"
      onSubmit={(e) => {
        e.preventDefault()
        setErro(null)
        iniciar(async () => {
          const r = await completarTelefone(contactId, telefone)
          if (!r.success) return setErro(r.error)
          setSalvo(r.phone)
          onSalvo?.(r.phone)
        })
      }}
    >
      <p className="text-sm font-medium">Completar cadastro</p>
      <p id={`${id}-dica`} className="text-xs text-muted-foreground">
        O WhatsApp não mandou o número deste contato. Preencha para responder e ligar para ele.
      </p>
      <div className="flex gap-2">
        <label htmlFor={`${id}-tel`} className="sr-only">Telefone com DDD</label>
        <Input
          id={`${id}-tel`}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder="ex.: (11) 98765-4321"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          aria-describedby={erro ? `${id}-erro` : `${id}-dica`}
          aria-invalid={!!erro}
          disabled={salvando}
          required
        />
        <Button type="submit" size="sm" disabled={salvando || !telefone.trim()}>
          {salvando ? 'Salvando…' : 'Salvar telefone'}
        </Button>
      </div>
      {erro && <p id={`${id}-erro`} role="alert" className="text-xs text-destructive">{erro}</p>}
    </form>
  )
}
