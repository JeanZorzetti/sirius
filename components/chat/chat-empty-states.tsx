'use client'

import { MessageSquare, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** WABA configured but no conversation has happened yet. */
export function WabaWaitingState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto">
          <MessageSquare className="h-7 w-7 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold text-foreground text-lg">API Oficial do WhatsApp conectada</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Seu número está configurado via Meta Cloud API. As conversas aparecerão aqui assim que você receber ou enviar a primeira mensagem.
          </p>
        </div>
        <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/40 p-4 text-left space-y-2">
          <p className="text-xs font-medium text-green-800 dark:text-green-300 uppercase tracking-wide">Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-700 dark:text-green-400">Número ativo e aguardando mensagens</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Para testar, envie uma mensagem do seu celular para o número cadastrado na Meta.
        </p>
      </div>
    </div>
  )
}

/** Left panel while there are no conversations: sync skeleton or refresh CTA. */
export function EmptyConversationsPanel({
  isSyncing,
  isRefreshing,
  onRefresh,
}: {
  isSyncing: boolean
  isRefreshing: boolean
  onRefresh: () => void
}) {
  if (isSyncing) {
    return (
      <div className="flex flex-col">
        <div className="px-3 py-2 border-b">
          <div className="h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        </div>
        <div className="p-2 space-y-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2.5 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex justify-between gap-2">
                  <div className="h-3.5 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" style={{ width: `${55 + (i * 13) % 30}%` }} />
                  <div className="h-3 w-8 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse flex-shrink-0" />
                </div>
                <div className="h-3 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" style={{ width: `${40 + (i * 17) % 35}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto px-4 py-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin text-[#00a884]" />
            <span>Sincronizando conversas...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Nenhuma conversa ainda</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Suas conversas aparecem automaticamente ao receber mensagens
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn('mr-2 h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
          Atualizar
        </Button>
      </div>
    </div>
  )
}

/** Right-panel brand placeholder; `withHint` adds the "select a conversation" copy. */
export function ChatBrandPlaceholder({ withHint = false }: { withHint?: boolean }) {
  if (withHint) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#efeae2] dark:bg-zinc-900">
        <div className="text-center space-y-3 max-w-xs">
          <div className="w-20 h-20 rounded-full bg-white/60 dark:bg-zinc-800/60 backdrop-blur flex items-center justify-center mx-auto">
            <MessageSquare className="h-9 w-9 text-muted-foreground/50" />
          </div>
          <div>
            <h3 className="font-medium text-muted-foreground">Sirius Chat</h3>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Selecione uma conversa para ver as mensagens
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="hidden lg:flex flex-1 items-center justify-center bg-[#efeae2] dark:bg-zinc-900">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-white/60 dark:bg-zinc-800/60 backdrop-blur flex items-center justify-center mx-auto">
          <MessageSquare className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground/60">Sirius Chat</p>
      </div>
    </div>
  )
}
