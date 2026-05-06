/**
 * Performance Debug Utilities
 *
 * Instrumentation helpers to measure where time is being spent.
 * Reports to console.table and to the browser Performance API.
 *
 * Server: logs with [PERF-SSR] prefix to stdout
 * Client: logs with [PERF] prefix to console + window.__perfMarks
 */

const isServer = typeof window === 'undefined'

declare global {
  interface Window {
    __perfMarks?: Array<{ label: string; duration: number; timestamp: number }>
  }
}

export class PerfTimer {
  private start: number
  private label: string
  private marks: Array<{ name: string; at: number }> = []

  constructor(label: string) {
    this.label = label
    this.start = performance.now()
    this.mark('start')
  }

  mark(name: string) {
    this.marks.push({ name, at: performance.now() - this.start })
  }

  end(): number {
    const total = performance.now() - this.start
    this.mark('end')

    const prefix = isServer ? '[PERF-SSR]' : '[PERF]'
    const rows = this.marks.map((m, i) => ({
      step: m.name,
      'at(ms)': m.at.toFixed(1),
      'delta(ms)': i === 0 ? '0.0' : (m.at - this.marks[i - 1].at).toFixed(1),
    }))

    if (isServer) {
      console.log(`${prefix} ${this.label} — ${total.toFixed(1)}ms`)
      console.log(rows.map(r => `  ${r.step}: ${r['at(ms)']}ms (+${r['delta(ms)']}ms)`).join('\n'))
    } else {
      console.groupCollapsed(`${prefix} ${this.label} — ${total.toFixed(1)}ms`)
      console.table(rows)
      console.groupEnd()

      if (typeof window !== 'undefined') {
        window.__perfMarks ??= []
        window.__perfMarks.push({ label: this.label, duration: total, timestamp: Date.now() })
      }
    }

    return total
  }
}

/**
 * Wraps an async function and logs its duration with steps.
 */
export async function timeAsync<T>(label: string, fn: (timer: PerfTimer) => Promise<T>): Promise<T> {
  const t = new PerfTimer(label)
  try {
    const result = await fn(t)
    t.end()
    return result
  } catch (err) {
    t.mark('error')
    t.end()
    throw err
  }
}

/**
 * Wraps a sync function and logs its duration.
 */
export function timeSync<T>(label: string, fn: (timer: PerfTimer) => T): T {
  const t = new PerfTimer(label)
  try {
    const result = fn(t)
    t.end()
    return result
  } catch (err) {
    t.mark('error')
    t.end()
    throw err
  }
}
