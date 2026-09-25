interface UnreadBadgeProps {
  count: number
}

export function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count === 0) return null

  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-primary-foreground bg-primary rounded-full tabular-nums">
      {count > 99 ? '99+' : count}
    </span>
  )
}
