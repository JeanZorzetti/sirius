import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileEmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function MobileEmptyState({ icon: Icon, title, description, action, className }: MobileEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center px-6', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 ring-1 ring-indigo-500/10">
        <Icon className="h-6 w-6 text-indigo-500/60" />
      </div>
      <div className="space-y-1">
        <p className="text-[15px] font-semibold text-foreground/80">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">{description}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-1 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
