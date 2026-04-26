import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SwipeAction {
  label: string
  color: string
  onAction: () => void
}

interface MobileListItemProps {
  leading?: React.ReactNode
  title: string
  subtitle?: string
  meta?: string
  trailing?: React.ReactNode
  showChevron?: boolean
  href?: string
  onClick?: () => void
  className?: string
}

export function MobileListItem({
  leading,
  title,
  subtitle,
  meta,
  trailing,
  showChevron = true,
  href,
  onClick,
  className,
}: MobileListItemProps) {
  const inner = (
    <>
      {leading && (
        <div className="shrink-0">{leading}</div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium leading-tight">{title}</p>
        {subtitle && (
          <p className="text-mobile-meta mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      <div className="ml-2 flex shrink-0 items-center gap-1">
        {meta && <span className="text-mobile-meta text-right">{meta}</span>}
        {trailing ?? (showChevron && (
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
        ))}
      </div>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cn('list-item-card', className)}>
        {inner}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      className={cn('list-item-card w-full text-left', className)}
    >
      {inner}
    </button>
  )
}
