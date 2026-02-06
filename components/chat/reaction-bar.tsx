'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReactionBarProps {
  onReact: (emoji: string) => void
  className?: string
}

// Quick reaction emojis (WhatsApp-style)
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

// Extended emoji palette for picker
const EMOJI_CATEGORIES = {
  'Pessoas': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'],
  'Mãos': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  'Corações': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  'Objetos': ['⭐', '🌟', '💫', '✨', '🔥', '💯', '✔️', '✅', '❌', '⚠️', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉'],
}

/**
 * Reaction Bar Component (Fase 4.2)
 *
 * Shows on hover/long-press with quick emoji reactions + full picker
 */
export function ReactionBar({ onReact, className }: ReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-full px-2 py-1.5 shadow-[0_2px_8px_rgba(11,20,26,0.16)] border border-[#e9edef] dark:border-zinc-700">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#f0f2f5] dark:hover:bg-zinc-700 transition-colors text-lg"
            title={`Reagir com ${emoji}`}
          >
            {emoji}
          </button>
        ))}
        <div className="w-px h-5 bg-[#e9edef] dark:bg-zinc-700 mx-1" />
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[#f0f2f5] dark:hover:bg-zinc-700 transition-colors"
          title="Mais reações"
        >
          <Plus className="h-4 w-4 text-[#667781]" />
        </button>
      </div>

      {showPicker && (
        <>
          {/* Backdrop to close picker */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPicker(false)}
          />
          {/* Simple Emoji Picker */}
          <div className="absolute bottom-full mb-2 left-0 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-[0_2px_16px_rgba(11,20,26,0.2)] border border-[#e9edef] dark:border-zinc-700 p-3 w-[320px] max-h-[300px] overflow-y-auto">
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <div key={category} className="mb-3 last:mb-0">
                <p className="text-xs font-semibold text-[#667781] mb-1.5">{category}</p>
                <div className="flex flex-wrap gap-1">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReact(emoji)
                        setShowPicker(false)
                      }}
                      className="flex items-center justify-center w-8 h-8 rounded hover:bg-[#f0f2f5] dark:hover:bg-zinc-700 transition-colors text-lg"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
