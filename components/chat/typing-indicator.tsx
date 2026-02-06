'use client'

import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  className?: string
  variant?: 'bubble' | 'inline'
}

/**
 * Typing Indicator Component (Fase 4.1)
 *
 * Displays 3 animated dots to show when a contact is typing.
 * Two variants:
 * - 'bubble': Dots inside a WhatsApp-style bubble (default)
 * - 'inline': Just the dots with text (for use in conversation list)
 */
export function TypingIndicator({ className, variant = 'bubble' }: TypingIndicatorProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span className="text-[13px] text-[#00a884] font-normal italic">digitando</span>
        <div className="flex items-center gap-0.5">
          <div className="typing-dot" />
          <div className="typing-dot" style={{ animationDelay: '0.15s' }} />
          <div className="typing-dot" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    )
  }

  // Bubble variant
  return (
    <div className={cn('flex justify-start animate-in fade-in-0 slide-in-from-bottom-2 duration-200', className)}>
      <div className="bg-white dark:bg-zinc-800 rounded-[18px] px-4 py-3 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] flex items-center gap-1.5">
        <div className="typing-dot" />
        <div className="typing-dot" style={{ animationDelay: '0.15s' }} />
        <div className="typing-dot" style={{ animationDelay: '0.3s' }} />
      </div>
    </div>
  )
}
