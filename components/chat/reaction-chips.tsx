'use client'

import { cn } from '@/lib/utils'

interface Reaction {
  emoji: string
  count: number
  userReacted: boolean
}

interface ReactionChipsProps {
  reactions: Reaction[]
  onToggle: (emoji: string) => void
  className?: string
}

/**
 * Reaction Chips Component (Fase 4.2)
 *
 * Displays reaction pills below message bubbles
 * Shows emoji + count, highlights if user reacted
 */
export function ReactionChips({ reactions, onToggle, className }: ReactionChipsProps) {
  if (reactions.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-1 mt-1', className)}>
      {reactions.map(({ emoji, count, userReacted }) => (
        <button
          key={emoji}
          onClick={() => onToggle(emoji)}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all',
            'border hover:scale-105 active:scale-95',
            userReacted
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-white dark:bg-zinc-800 border-border dark:border-zinc-700 text-muted-foreground hover:bg-muted dark:hover:bg-zinc-700'
          )}
          title={userReacted ? 'Remover sua reação' : 'Reagir'}
        >
          <span className="text-sm leading-none">{emoji}</span>
          <span className="tabular-nums">{count}</span>
        </button>
      ))}
    </div>
  )
}
