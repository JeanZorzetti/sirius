import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonCardListProps {
  count?: number
  className?: string
}

/**
 * SkeletonCardList — placeholder shape-matching para a versão mobile
 * (lg:hidden) das listas de contatos/deals. Renderiza N cards com a mesma
 * altura do ContactMobileCard real para evitar layout shift quando os dados
 * chegam.
 */
export function SkeletonCardList({ count = 5, className }: SkeletonCardListProps) {
  return (
    <div className={cn('flex flex-col gap-3 lg:hidden', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-white/[0.02]"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="h-5 w-5 shrink-0 rounded-sm" />
            <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
          <div className="mt-4 space-y-2 border-t border-border/40 pt-3">
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <div className="mt-3 flex gap-2 border-t border-border/40 pt-3">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface SkeletonTableProps {
  rows?: number
  columns?: number
  className?: string
}

/**
 * SkeletonTable — placeholder para a tabela desktop. Esconde-se em mobile
 * para deixar o SkeletonCardList tomar conta.
 */
export function SkeletonTable({
  rows = 8,
  columns = 6,
  className,
}: SkeletonTableProps) {
  return (
    <div
      className={cn(
        'hidden overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm lg:block dark:border-white/5 dark:bg-white/[0.02]',
        className,
      )}
    >
      <div className="border-b border-black/5 bg-black/[0.02] px-4 py-3 dark:border-white/5 dark:bg-white/[0.02]">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-black/5 dark:divide-white/5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-4">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
