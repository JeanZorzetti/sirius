'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function TaskKanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {/* 4 columns */}
      {Array.from({ length: 4 }).map((_, colIdx) => (
        <div
          key={colIdx}
          className="w-80 flex-shrink-0 rounded-xl border border-border/50 bg-muted/30 overflow-hidden flex flex-col"
        >
          {/* Column header */}
          <div className="flex items-center justify-between gap-2 border-b border-border/50 p-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-6" />
            </div>
            <Skeleton className="h-7 w-7 rounded" />
          </div>

          {/* Cards (3 per column) */}
          <div className="flex flex-1 flex-col gap-2 p-3 min-h-[200px]">
            {Array.from({ length: 3 }).map((_, cardIdx) => (
              <Skeleton
                key={cardIdx}
                className="h-24 rounded-xl"
                style={{
                  animationDelay: `${colIdx * 100 + cardIdx * 50}ms`,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
