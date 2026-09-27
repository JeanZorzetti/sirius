'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AceiteIntegrador } from './aceite-integrador'
import { NOME_INTEGRADOR, type ConexaoPublica } from './conexao-ui'
import type { Provider } from '@/lib/whatsapp/integradores/tipos'

interface NewConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Created and waiting for the QR Code, or already paired */
  onConectada: (conexao: ConexaoPublica) => void
}

type Campo = { nome: string; rotulo: string; exemplo?: string; dica?: string; segredo?: boolean; opcional?: boolean }

/** Only the fields each integrator asks for (spec 012, contracts/rotas.md) */
const CAMPOS: Record<Provider, Campo[]> = {
  ZAPI: [
    { nome: 'instanceId', rotulo: 'ID da instância', dica: 'No painel da Z-API, na página da instância.' },
    { nome: 'token', rotulo: 'Token da instância', segredo: true },
    { nome: 'clientToken', rotulo: 'Client-Token', segredo: true, opcional: true, dica: 'Só se a sua conta usa o token de segurança. Fica em Segurança, no painel da Z-API.' },
  ],
  UAZAPI: [
    { nome: 'baseUrl', rotulo: 'Endereço do servidor', exemplo: 'ex.: https://suaempresa.uazapi.com' },
    { nome: 'token', rotulo: 'Token da instância', segredo: true },
  ],
  EVOLUTION: [
    { nome: 'baseUrl', rotulo: 'Endereço do servidor', exemplo: 'ex.: https://evolution.suaempresa.com.br' },
    { nome: 'instanceName', rotulo: 'Nome da instância' },
    { nome: 'apiKey', rotulo: 'API key da instância', segredo: true, dica: 'Use a chave da instância, não a chave global do servidor.' },
  ],
}

export function NewConnectionDialog({ open, onOpenChange, onConectada }: NewConnectionDialogProps) {
  const id = useId()
  const [provider, setProvider] = useState<Provider>('ZAPI')
  const [valores, setValores] = useState<Record<string, string>>({})
  const [aceite, setAceite] = useState(false)
  const [erro, setErro] = useState<{ texto: string; limite: boolean } | null>(null)
  const [enviando, setEnviando] = useState(false)

  const limpar = () => {
    setValores({})
    setAceite(false)
    setErro(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const corpo: Record<string, unknown> = { provider, aceite }
      for (const campo of CAMPOS[provider]) {
        const valor = valores[campo.nome]?.trim()
        if (valor) corpo[campo.nome] = valor
      }
      const res = await fetch('/api/whatsapp/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro({ texto: data.error || 'Não foi possível conectar agora. Tente de novo em instantes.', limite: data.codigo === 'LIMITE' })
        return
      }
      const conexao = data as ConexaoPublica
      if (conexao.status === 'FAILED') {
        // Paired with a number the account already has (FR-008): the reason says which
        setErro({ texto: `Não foi possível ativar: ${conexao.statusMotivo ?? 'o integrador recusou a conexão'}.`, limite: false })
        return
      }
      if (conexao.status === 'CONNECTED') toast.success('WhatsApp conectado.')
      limpar()
      onOpenChange(false)
      onConectada(conexao)
    } catch {
      setErro({ texto: 'Sem resposta do Sirius. Confira sua internet e tente de novo.', limite: false })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(aberto) => { if (!aberto) limpar(); onOpenChange(aberto) }}>
      <DialogContent className="sm:max-w-lg max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
          <DialogDescription>
            Use a conta que você já tem num integrador. O Sirius confere as credenciais e liga sozinho o aviso de mensagens.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={erro ? `${id}-erro` : undefined}>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Integrador</legend>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(CAMPOS) as Provider[]).map((p) => (
                <label
                  key={p}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                >
                  <input
                    type="radio"
                    name={`${id}-provider`}
                    value={p}
                    checked={provider === p}
                    onChange={() => { setProvider(p); setErro(null) }}
                    className="accent-primary"
                  />
                  {NOME_INTEGRADOR[p]}
                </label>
              ))}
            </div>
          </fieldset>

          {CAMPOS[provider].map((campo) => {
            const campoId = `${id}-${provider}-${campo.nome}`
            return (
              <div key={campoId} className="space-y-1.5">
                <Label htmlFor={campoId}>
                  {campo.rotulo}
                  {campo.opcional && <span className="font-normal text-muted-foreground"> (opcional)</span>}
                </Label>
                <Input
                  id={campoId}
                  type={campo.segredo ? 'password' : campo.nome === 'baseUrl' ? 'url' : 'text'}
                  inputMode={campo.nome === 'baseUrl' ? 'url' : undefined}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={campo.exemplo}
                  required={!campo.opcional}
                  value={valores[campo.nome] ?? ''}
                  onChange={(e) => setValores((v) => ({ ...v, [campo.nome]: e.target.value }))}
                  disabled={enviando}
                  aria-describedby={campo.dica ? `${campoId}-dica` : undefined}
                />
                {campo.dica && <p id={`${campoId}-dica`} className="text-xs text-muted-foreground">{campo.dica}</p>}
              </div>
            )
          })}

          <AceiteIntegrador checked={aceite} onChange={setAceite} />

          {erro && (
            <div id={`${id}-erro`} role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {erro.texto}
              {erro.limite && (
                <Link href="/dashboard/billing" className="mt-1 block underline underline-offset-2">
                  Ver conexões extras e planos
                </Link>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Prefere a API oficial da Meta? Ela está no plano Business, em{' '}
            <Link href="/dashboard/settings/integrations" className="underline underline-offset-2">Configurações → Integrações</Link>.
          </p>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={enviando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando || !aceite}>
              {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {enviando ? 'Conferindo credenciais…' : 'Conectar WhatsApp'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
