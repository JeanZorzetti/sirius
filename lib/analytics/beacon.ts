/**
 * Beacon API: Garantindo a Captura de Dados na Saída
 *
 * A interação com a calculadora de ROI muitas vezes representa o ponto final
 * da jornada de descoberta imediata. Métodos tradicionais de envio de analytics
 * (fetch/XMLHttpRequest) em unload/beforeunload são frequentemente cancelados
 * pelos navegadores modernos.
 *
 * Navigator.sendBeacon() garante que o evento seja capturado mesmo se o usuário
 * fechar a aba instantaneamente.
 */

export interface BeaconPayload {
  event: string
  properties: Record<string, any>
  timestamp: string
}

/**
 * Envia dados de analytics de forma confiável usando Beacon API
 *
 * @param endpoint - URL do endpoint de ingestão (/api/analytics/ingest)
 * @param data - Payload do evento
 * @returns Promise<boolean> - true se enviado com sucesso
 *
 * @example
 * ```ts
 * sendAnalyticsBeacon('/api/analytics/ingest', {
 *   event: 'calculator_completed',
 *   properties: { roi: 50000 },
 *   timestamp: new Date().toISOString()
 * })
 * ```
 */
export async function sendAnalyticsBeacon(
  endpoint: string,
  data: BeaconPayload
): Promise<boolean> {
  if (typeof window === 'undefined') {
    console.warn('[Beacon] Not available in server environment')
    return false
  }

  try {
    // Preferência 1: Navigator.sendBeacon() - Confiável e assíncrono
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      const sent = navigator.sendBeacon(endpoint, blob)

      if (sent) {
        return true
      } else {
        console.warn('[Beacon] sendBeacon failed, falling back to fetch')
      }
    }

    // Fallback: fetch com keepalive para navegadores legados
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      keepalive: true, // Garante que a requisição continue mesmo após fechar a página
    })

    if (response.ok) {
      return true
    } else {
      console.error('[Beacon] Fetch failed:', response.status, response.statusText)
      return false
    }
  } catch (error) {
    console.error('[Beacon] Error sending analytics:', error)
    return false
  }
}

/**
 * Hook de saída: Captura eventos críticos em beforeunload
 *
 * Instalado automaticamente para garantir que eventos pendentes
 * sejam enviados quando o usuário sair da página
 *
 * @param events - Lista de eventos pendentes para envio
 */
export function installBeaconExitHandler(getPendingEvents: () => BeaconPayload[]) {
  if (typeof window === 'undefined') return

  const handler = () => {
    const pendingEvents = getPendingEvents()

    if (pendingEvents.length > 0) {
      pendingEvents.forEach((event) => {
        sendAnalyticsBeacon('/api/analytics/ingest', event)
      })
    }
  }

  // beforeunload é disparado antes de sair da página
  window.addEventListener('beforeunload', handler)

  // visibilitychange detecta quando usuário troca de aba (mobile/desktop)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      handler()
    }
  })

  // Retorna função de cleanup
  return () => {
    window.removeEventListener('beforeunload', handler)
    document.removeEventListener('visibilitychange', handler)
  }
}

/**
 * Fila de eventos com envio automático via Beacon
 *
 * Gerencia eventos críticos que devem ser enviados mesmo se
 * o usuário sair da página imediatamente
 */
export class BeaconEventQueue {
  private queue: BeaconPayload[] = []
  private endpoint: string
  private autoFlushInterval?: NodeJS.Timeout

  constructor(endpoint: string = '/api/analytics/ingest', autoFlushMs: number = 5000) {
    this.endpoint = endpoint

    // Auto-flush a cada 5 segundos para não perder dados
    if (typeof window !== 'undefined') {
      this.autoFlushInterval = setInterval(() => {
        this.flush()
      }, autoFlushMs)

      // Instalar handler de saída
      installBeaconExitHandler(() => this.queue)
    }
  }

  /**
   * Adiciona evento à fila
   */
  enqueue(event: string, properties: Record<string, any>) {
    this.queue.push({
      event,
      properties,
      timestamp: new Date().toISOString(),
    })

  }

  /**
   * Envia todos os eventos pendentes
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return

    const eventsToSend = [...this.queue]
    this.queue = [] // Limpa a fila imediatamente

    const results = await Promise.allSettled(
      eventsToSend.map((event) => sendAnalyticsBeacon(this.endpoint, event))
    )

    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed > 0) {
      console.warn(`[BeaconQueue] ${failed} events failed to send`)
    }
  }

  /**
   * Cleanup da fila
   */
  destroy() {
    if (this.autoFlushInterval) {
      clearInterval(this.autoFlushInterval)
    }
    this.flush() // Envia eventos pendentes antes de destruir
  }
}

/**
 * Singleton global da fila de eventos
 */
let globalQueue: BeaconEventQueue | null = null

export function getBeaconQueue(): BeaconEventQueue {
  if (!globalQueue && typeof window !== 'undefined') {
    globalQueue = new BeaconEventQueue('/api/analytics/ingest', 5000)
  }

  return globalQueue!
}

/**
 * Helper simplificado: Envia evento crítico via Beacon
 *
 * @example
 * ```ts
 * sendCriticalEvent('calculator_completed', { roi: 50000 })
 * ```
 */
export function sendCriticalEvent(event: string, properties: Record<string, any> = {}) {
  const queue = getBeaconQueue()
  queue.enqueue(event, properties)
}
