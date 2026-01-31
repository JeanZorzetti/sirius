/**
 * Component Skeleton - Loading States
 *
 * Displays contextual skeleton screens while AI-generated
 * components are being loaded and rendered.
 */

'use client'

import { Skeleton } from '@/components/ui/skeleton'
import type { SkeletonVariant } from '@/lib/generative-ui/types'

interface ComponentSkeletonProps {
  height?: number
  variant: SkeletonVariant
}

export function ComponentSkeleton({ height = 400, variant }: ComponentSkeletonProps) {
  const variants = {
    calculator: (
      <div
        className="space-y-4 p-6 border border-border rounded-lg bg-card"
        style={{ height }}
      >
        <Skeleton className="h-8 w-1/2" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
        <Skeleton className="h-px w-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-16 w-full rounded" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    ),

    form: (
      <div
        className="space-y-4 p-6 border border-border rounded-lg bg-card"
        style={{ height }}
      >
        <Skeleton className="h-8 w-2/3" />
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    ),

    table: (
      <div
        className="space-y-2 p-6 border border-border rounded-lg bg-card"
        style={{ height }}
      >
        <Skeleton className="h-8 w-1/3 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    ),

    dashboard: (
      <div
        className="space-y-4 p-6 border border-border rounded-lg bg-card"
        style={{ height }}
      >
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-20 w-full rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-20 w-full rounded" />
          </div>
        </div>
        <Skeleton className="h-40 w-full rounded" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    ),

    timeline: (
      <div
        className="space-y-4 p-6 border border-border rounded-lg bg-card"
        style={{ height }}
      >
        <Skeleton className="h-8 w-1/2 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                {i < 4 && <Skeleton className="h-16 w-0.5 my-2" />}
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),

    card: (
      <div
        className="p-6 border border-border rounded-lg bg-card space-y-3"
        style={{ height }}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-px w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 rounded" />
          <Skeleton className="h-9 flex-1 rounded" />
        </div>
      </div>
    ),

    email: (
      <div
        className="space-y-4 p-6 border border-border rounded-lg bg-card"
        style={{ height }}
      >
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-px w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="space-y-2 bg-muted/50 p-4 rounded">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full mt-4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    ),

    iframe: (
      <div
        className="border border-border rounded-lg bg-card overflow-hidden"
        style={{ height }}
      >
        <div className="p-4 border-b border-border bg-muted/50">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-full" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
          <div className="flex justify-between items-center pt-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    ),

    text: (
      <div
        className="space-y-3 p-6 border border-border rounded-lg bg-card"
        style={{ height }}
      >
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-px w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full mt-4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex justify-end pt-4">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    ),
  }

  return (
    <div className="animate-pulse">
      {variants[variant] || (
        <Skeleton style={{ height }} className="w-full rounded-lg" />
      )}
    </div>
  )
}
