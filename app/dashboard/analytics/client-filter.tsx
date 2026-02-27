'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const TOP_OPTIONS = [5, 10, 20]
const SORT_OPTIONS = [
  { value: 'value', label: 'Valor' },
  { value: 'count', label: 'Quantidade' },
]

export function ClientChartFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const ctop = Number(searchParams.get('ctop') ?? '10')
  const csort = searchParams.get('csort') ?? 'value'
  const isCustom = searchParams.has('ctop') || searchParams.has('csort')

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  function reset() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('ctop')
    params.delete('csort')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Top N */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-zinc-500">Top</span>
        <div className="flex rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {TOP_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setParam('ctop', String(n))}
              className={cn(
                'px-2.5 py-1 text-xs font-medium transition-colors',
                ctop === n
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'bg-white text-zinc-500 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Ordenar por */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-zinc-500">Ordenar por</span>
        <div className="flex rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setParam('csort', opt.value)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium transition-colors',
                csort === opt.value
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'bg-white text-zinc-500 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isCustom && (
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="h-8 text-xs text-zinc-500 hover:text-zinc-700 gap-1 px-2"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Resetar
        </Button>
      )}
    </div>
  )
}
