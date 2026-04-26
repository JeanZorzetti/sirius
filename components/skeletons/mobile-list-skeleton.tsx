import { cn } from '@/lib/utils'

interface MobileListSkeletonProps {
  count?: number
  withSection?: boolean
  withLeading?: boolean
  className?: string
}

export function MobileListSkeleton({
  count = 6,
  withSection = true,
  withLeading = true,
  className,
}: MobileListSkeletonProps) {
  return (
    <div className={className}>
      {withSection && (
        <div className="px-4 py-2">
          <div className="skeleton-loader h-3 w-24 rounded" />
        </div>
      )}
      <div className="divide-y divide-border/40">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            {withLeading && (
              <div className="skeleton-loader h-10 w-10 shrink-0 rounded-full" />
            )}
            <div className="flex-1 space-y-2">
              <div className={cn('skeleton-loader h-3.5 rounded', i % 3 === 0 ? 'w-3/4' : 'w-1/2')} />
              <div className="skeleton-loader h-3 w-1/3 rounded" />
            </div>
            <div className="skeleton-loader h-4 w-4 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
