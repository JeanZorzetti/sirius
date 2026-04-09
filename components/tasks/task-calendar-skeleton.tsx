'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function TaskCalendarSkeleton() {
  return (
    <div className="space-y-4">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>

      {/* Calendar grid (6 rows x 7 cols) */}
      <div className="space-y-2">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-6 rounded text-center" />
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 42 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
