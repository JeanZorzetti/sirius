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
  defaultId?: string
}

export function PipelineFilter({ pipelines, defaultId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Multi-select: comma-separated IDs in ?pid=
  // When nothing in URL, visually highlight the default pipeline
  const raw = searchParams.get('pid') ?? ''
  const selected = raw ? raw.split(',').filter(Boolean) : (defaultId ? [defaultId] : [])

  function toggle(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    // Use only what's actually in the URL — not the visual fallback to defaultId.
    // Without this, clicking pipeline B when nothing is in the URL produces
    // ?pid=defaultId,B instead of ?pid=B, making the server query both pipelines.
    const currentInUrl = raw.split(',').filter(Boolean)
    const next = currentInUrl.includes(id)
      ? currentInUrl.filter((s) => s !== id)
      : [...currentInUrl, id]

    if (next.length === 0) {
      params.delete('pid')
    } else {
      params.set('pid', next.join(','))
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-zinc-500 shrink-0">Pipeline:</span>
      <div className="flex flex-wrap gap-1.5">
        {pipelines.map((p) => {
          const isActive = selected.includes(p.id)
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                isActive
                  ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400 hover:text-zinc-800 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-white'
              )}
            >
              {p.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
