'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Power, QrCode, RefreshCw, Smartphone, Wifi, WifiOff, AlertTriangle, PauseCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'
import { NewConnectionDialog } from './new-connection-dialog'
import { QRCodeDialog } from './qr-code-dialog'
import { ROTULO_ESTADO, desde, nomeDaConexao, nomeDoIntegrador, semCredencial, type ConexaoPublica } from './conexao-ui'

interface ConnectionManagerProps {
  conexoes: ConexaoPublica[]
  limite: number
  usadas: number
  podeGerenciar: boolean
  /** Something changed: the parent reloads the connections */
  onMudou: () => void
}

const VISUAL: Record<ConexaoPublica['status'], { icone: typeof Wifi; classe: string }> = {
  CONNECTED: { icone: Wifi, classe: 'text-emerald-700 dark:text-emerald-400' },
  CONNECTING: { icone: QrCode, classe: 'text-amber-700 dark:text-amber-400' },
  DISCONNECTED: { icone: WifiOff, classe: 'text-zinc-600 dark:text-zinc-400' },
  FAILED: { icone: AlertTriangle, classe: 'text-red-700 dark:text-red-400' },
  SUSPENDED: { icone: PauseCircle, classe: 'text-zinc-600 dark:text-zinc-400' },
}

/** Reconnecting by QR does not fix these; the guide below says what does */
const reconectavel = (c: ConexaoPublica) =>
  (c.status === 'DISCONNECTED' || c.status === 'FAILED') && !semCredencial(c) && !/bloquead|já está conectado|aviso novo/i.test(c.statusMotivo ?? '')

/** What the owner does next, from the reason (US3, T070) */
function orientacao(c: ConexaoPublica): { texto: string; link?: { href: string; rotulo: string } } | null {
  const motivo = c.statusMotivo ?? ''
  if (semCredencial(c)) return { texto: 'Para usar este número de novo, conecte com as credenciais do integrador.' }
  if (c.status === 'SUSPENDED') {
    return { texto: 'O plano da conta não inclui WhatsApp. A conexão volta sozinha quando a conta tiver um plano pago.', link: { href: '/dashboard/billing/plans', rotulo: 'Ver planos' } }
  }
  if (c.status !== 'FAILED') return null
  if (/bloquead/i.test(motivo)) {
    return { texto: 'O WhatsApp bloqueou este número. A saída segura é a API oficial da Meta, no plano Business.', link: { href: '/dashboard/settings/integrations', rotulo: 'Ver API oficial' } }
  }
  if (/já está conectado|já conectado/i.test(motivo)) {
    return { texto: 'Cada número entra em uma conexão só. Desconecte a outra antes de usar este número aqui.' }
  }
  if (/aviso novo/i.test(motivo)) return { texto: 'Conecte de novo e aceite o aviso atualizado para reativar.' }
  return { texto: 'Leia o QR Code de novo com o celular do número para reconectar.' }
}

export function ConnectionManager({ conexoes, limite, usadas, podeGerenciar, onMudou }: ConnectionManagerProps) {
  const [novaAberta, setNovaAberta] = useState(false)
  const [qrDe, setQrDe] = useState<ConexaoPublica | null>(null)
  const [desconectar, setDesconectar] = useState<ConexaoPublica | null>(null)
  const [ocupada, setOcupada] = useState<string | null>(null)
  const cabe = usadas < limite

  const handleDesconectar = async (c: ConexaoPublica) => {
    setOcupada(c.id)
    try {
      const res = await fetch(`/api/whatsapp/connections/${c.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Não foi possível desconectar agora. Tente de novo.')
      }
      toast.success(`${nomeDaConexao(c)} desconectado. As conversas continuam no inbox.`)
      onMudou()
    } catch (erro) {
      toast.error((erro as Error).message)
    } finally {
      setOcupada(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Conexões de WhatsApp</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {usadas} de {limite} {limite === 1 ? 'conexão' : 'conexões'} do plano
          </p>
        </div>
        {podeGerenciar && (
          <Button onClick={() => setNovaAberta(true)} disabled={!cabe} size="sm" aria-describedby={!cabe ? 'conexoes-limite' : undefined}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Conectar número
          </Button>
        )}
      </div>

      {podeGerenciar && !cabe && (
        <p id="conexoes-limite" className="text-sm text-muted-foreground">
          {limite === 0 ? 'WhatsApp por integrador está nos planos pagos, a partir do Starter.' : `Seu plano permite ${limite} ${limite === 1 ? 'conexão' : 'conexões'}.`}{' '}
          <Link href="/dashboard/billing" className="underline underline-offset-2">Comprar conexão extra ou mudar de plano</Link>
        </p>
      )}
      {!podeGerenciar && (
        <p className="text-sm text-muted-foreground">Só o dono e o gerente da conta conectam e desconectam números.</p>
      )}

      {conexoes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Smartphone className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="font-medium">Nenhum número conectado</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Conecte o WhatsApp pelo integrador que você já usa (Z-API, uazapi ou Evolution API) e as conversas aparecem aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {conexoes.map((c) => {
            const { icone: Icone, classe } = VISUAL[c.status]
            const guia = orientacao(c)
            const ocupadaAgora = ocupada === c.id
            return (
              <li key={c.id}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border bg-background">
                        <Icone className={cn('h-4 w-4', classe)} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{nomeDaConexao(c)}</p>
                        <p className="text-xs text-muted-foreground">
                          {nomeDoIntegrador(c)} · <span className={cn('font-medium', classe)}>{ROTULO_ESTADO[c.status]}</span>
                          {c.statusMotivo ? ` · ${c.statusMotivo}` : ''}
                          {desde(c.statusMudouEm) ? ` · ${desde(c.statusMudouEm)}` : ''}
                        </p>
                      </div>
                      {podeGerenciar && (
                        <div className="flex flex-shrink-0 items-center gap-2">
                          {c.status === 'CONNECTING' && (
                            <Button variant="outline" size="sm" onClick={() => setQrDe(c)}>
                              <QrCode className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                              Mostrar QR Code
                            </Button>
                          )}
                          {reconectavel(c) && (
                            <Button variant="outline" size="sm" onClick={() => setQrDe(c)}>
                              <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                              Reconectar
                            </Button>
                          )}
                          {!semCredencial(c) ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDesconectar(c)}
                              disabled={ocupadaAgora}
                              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              {ocupadaAgora ? <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Power className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />}
                              Desconectar
                            </Button>
                          ) : null}
                        </div>
                      )}
                    </div>
                    {guia && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {guia.texto}{' '}
                        {guia.link && <Link href={guia.link.href} className="underline underline-offset-2">{guia.link.rotulo}</Link>}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <NewConnectionDialog
        open={novaAberta}
        onOpenChange={setNovaAberta}
        onConectada={(c) => {
          onMudou()
          if (c.status === 'CONNECTING') setQrDe(c)
        }}
      />

      <ConfirmDialog
        open={!!desconectar}
        onOpenChange={(aberto) => !aberto && setDesconectar(null)}
        title="Desconectar número"
        description={desconectar
          ? `${nomeDaConexao(desconectar)} deixa de receber e enviar mensagens pelo Sirius. As conversas ficam no inbox. Para voltar, conecte de novo com as credenciais do integrador.`
          : ''}
        confirmLabel="Desconectar número"
        onConfirm={() => {
          if (desconectar) handleDesconectar(desconectar)
          setDesconectar(null)
        }}
      />

      {qrDe && (
        <QRCodeDialog connection={qrDe} open={!!qrDe} onOpenChange={(aberto) => !aberto && setQrDe(null)} onConectado={onMudou} />
      )}
    </div>
  )
}
