'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Pipeline {
  id: string
  name: string
  isDefault: boolean
}

interface Props {
  pipelines: Pipeline[]
}

export function PipelineFilter({ pipelines }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pid = searchParams.get('pid') ?? 'all'

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('pid')
    } else {
      params.set('pid', value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const options = [{ id: 'all', name: 'Todas', isDefault: false }, ...pipelines]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-zinc-500 shrink-0">Pipeline:</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((p) => (
          <button
            key={p.id}
            onClick={() => select(p.id)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              pid === p.id
                ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white'
                : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400 hover:text-zinc-800 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-white'
            )}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  )
}
