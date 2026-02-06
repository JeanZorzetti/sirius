'use client'

import { cn } from '@/lib/utils'

interface QuotedMessageProps {
  text: string
  senderName: string
  outbound?: boolean
  onClick?: () => void
}

export function QuotedMessage({ text, senderName, outbound = false, onClick }: QuotedMessageProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-md px-2.5 py-1.5 mb-1 border-l-4 transition-colors',
        'hover:bg-black/10 cursor-pointer',
        outbound
          ? 'bg-black/5 border-l-[#00a884]'
          : 'bg-white/50 border-l-[#00a884]'
      )}
    >
      <p className="text-[11px] font-semibold text-[#00a884] leading-tight truncate">
        {senderName}
      </p>
      <p className="text-[12px] text-[#667781] line-clamp-2 leading-tight mt-0.5">
        {text}
      </p>
    </button>
  )
}
