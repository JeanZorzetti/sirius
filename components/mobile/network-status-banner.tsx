'use client'

import * as React from 'react'
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getQueueSize, syncOfflineQueue } from '@/lib/mobile/offline'
import { toast } from 'sonner'

/**
 * NetworkStatusBanner — banner sutil que aparece quando o app fica offline
 * ou quando há ações na fila aguardando sync.
 *
 * Comportamento:
 * - Detecta `online`/`offline` events e mostra estado visual
 * - Quando volta online com fila pendente, dispara `syncOfflineQueue()`
 *   automaticamente e mostra toast de sucesso
 * - Permite trigger manual via botão "Tentar agora"
 *
 * Render: fixed top, abaixo do header, full-width, fica acima do bottom-nav.
 */
export function NetworkStatusBanner() {
  const [online, setOnline] = React.useState(true)
  const [queueSize, setQueueSize] = React.useState(0)
  const [syncing, setSyncing] = React.useState(false)

  // Inicializa estado a partir do navigator + lê fila
  React.useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setOnline(navigator.onLine)
    }
    void refreshQueueSize()
  }, [])

  // Listeners online/offline
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const handleOnline = () => {
      setOnline(true)
      // Tenta sync imediato quando volta
      void runSync(true)
    }
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Re-checa fila a cada 30s para refletir mudanças feitas em outros tabs/views
  React.useEffect(() => {
    const id = setInterval(refreshQueueSize, 30_000)
    return () => clearInterval(id)
  }, [])

  async function refreshQueueSize() {
    try {
      const size = await getQueueSize()
      setQueueSize(size)
    } catch {
      /* no-op */
    }
  }

  async function runSync(silent = false) {
    if (syncing) return
    setSyncing(true)
    try {
      const result = await syncOfflineQueue()
      await refreshQueueSize()
      if (!silent && result.synced > 0) {
        toast.success(`${result.synced} ação(ões) sincronizada(s)`)
      } else if (silent && result.synced > 0) {
        toast.success(`${result.synced} ação(ões) pendente(s) sincronizada(s)`)
      }
      if (result.failed > 0 && !silent) {
        toast.warning(`${result.failed} ação(ões) falharam — tentaremos novamente`)
      }
    } catch {
      if (!silent) toast.error('Erro ao sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  // Não renderiza nada quando: online + fila vazia
  if (online && queueSize === 0) return null

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 top-14 z-40 flex justify-center px-4 lg:top-4',
        'animate-in fade-in slide-in-from-top-2 duration-300',
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'pointer-events-auto flex items-center gap-3 rounded-full border px-4 py-2 text-xs font-medium shadow-lg backdrop-blur-md',
          !online
            ? 'border-amber-500/30 bg-amber-50/95 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200'
            : 'border-blue-500/30 bg-blue-50/95 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200',
        )}
      >
        {!online ? (
          <>
            <CloudOff className="h-4 w-4 shrink-0" />
            <span>
              Sem conexão
              {queueSize > 0 && ` — ${queueSize} pendente${queueSize !== 1 ? 's' : ''}`}
            </span>
          </>
        ) : (
          <>
            {syncing ? (
              <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span>
              {queueSize} ação{queueSize !== 1 ? 'ões' : ''} aguardando sync
            </span>
            <button
              type="button"
              onClick={() => runSync(false)}
              disabled={syncing}
              className="ml-1 rounded-full bg-blue-600/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700 transition-colors hover:bg-blue-600/20 disabled:opacity-50 dark:text-blue-300"
            >
              {syncing ? 'Sincronizando' : 'Tentar agora'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
