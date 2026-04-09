'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function TaskTableSkeleton() {
  return (
    <div className="space-y-3">
      {/* Export toolbar */}
      <div className="flex justify-end">
        <Skeleton className="h-7 w-24 rounded" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                {/* Columns: checkbox, title, status, priority, assignee, labels, due date, menu */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <th key={i} className="px-3 py-2.5">
                    {i === 0 ? (
                      <Skeleton className="h-5 w-5 rounded" />
                    ) : (
                      <Skeleton className="h-4 w-16" />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 8 row skeletons */}
              {Array.from({ length: 8 }).map((_, rowIdx) => (
                <tr key={rowIdx} className="border-b border-border/30">
                  {/* checkbox */}
                  <td className="w-10 px-3 py-2.5">
                    <Skeleton className="h-5 w-5 rounded" />
                  </td>
                  {/* title */}
                  <td className="px-3 py-2.5">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  {/* status */}
                  <td className="px-3 py-2.5">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  {/* priority */}
                  <td className="px-3 py-2.5">
                    <Skeleton className="h-4 w-4" />
                  </td>
                  {/* assignee */}
                  <td className="px-3 py-2.5">
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </td>
                  {/* labels */}
                  <td className="px-3 py-2.5">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  {/* due date */}
                  <td className="px-3 py-2.5">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  {/* menu */}
                  <td className="px-3 py-2.5">
                    <Skeleton className="h-7 w-7 rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
