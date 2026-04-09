'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { ChevronDown } from 'lucide-react'

export function TaskListSkeleton() {
  return (
    <div className="space-y-4">
      {/* 3 status groups */}
      {Array.from({ length: 3 }).map((_, groupIdx) => (
        <div
          key={groupIdx}
          className="rounded-lg border border-border/50 bg-card/50 overflow-hidden"
        >
          {/* Group header */}
          <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3 bg-muted/20">
            <div className="flex-shrink-0">
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-6" />
          </div>

          {/* Task rows (4 per group) */}
          <div className="space-y-2 p-3">
            {Array.from({ length: 4 }).map((_, rowIdx) => (
              <div
                key={rowIdx}
                className="flex items-center gap-3 rounded-md p-2"
              >
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16 hidden md:block" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
