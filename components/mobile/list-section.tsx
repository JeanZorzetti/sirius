import { cn } from '@/lib/utils'

interface MobileListSectionProps {
  label: string
  count?: number
  total?: string
  className?: string
  children: React.ReactNode
}

export function MobileListSection({ label, count, total, className, children }: MobileListSectionProps) {
  return (
    <section className={className}>
      <header className="sticky top-[var(--app-bar-height)] z-10 glass-header px-4 py-2">
        <span className="text-mobile-section">{label}</span>
        {count != null && <span className="text-mobile-meta ml-2">· {count}</span>}
        {total != null && <span className="text-mobile-meta ml-1">· {total}</span>}
      </header>
      <div className="divide-y divide-border/40">{children}</div>
    </section>
  )
}

interface MobilePageHeaderProps {
  className?: string
  children: React.ReactNode
}

export function MobilePageHeader({ className, children }: MobilePageHeaderProps) {
  return (
    <div className={cn('px-4 pb-2 pt-4', className)}>
      {children}
    </div>
  )
}
