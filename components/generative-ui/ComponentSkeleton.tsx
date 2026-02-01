/**
 * Component Skeleton - Loading States
 *
 * Displays contextual skeleton screens while AI-generated
 * components are being loaded and rendered.
 *
 * Phase 5 Enhancement: Added more skeleton variants and
 * improved animations for better perceived performance.
 */

'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { SkeletonVariant } from '@/lib/generative-ui/types'

interface ComponentSkeletonProps {
  height?: number
  variant: SkeletonVariant
  /** Show a subtle shimmer effect */
  shimmer?: boolean
  /** Add a label while loading */
  label?: string
  /** Custom className */
  className?: string
}

export function ComponentSkeleton({
  height = 400,
  variant,
  shimmer = true,
  label,
  className,
}: ComponentSkeletonProps) {
  const variants: Record<SkeletonVariant | string, React.ReactNode> = {
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

    // Additional variants for Phase 5
    chart: (
      <div
        className="space-y-4 p-6 border border-border rounded-lg bg-card"
        style={{ height }}
      >
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
          </div>
        </div>
        <div className="flex-1 flex items-end gap-2 pt-4" style={{ height: height - 150 }}>
          {[40, 65, 35, 80, 55, 70, 45, 90, 60, 75].map((h, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </div>
    ),

    metrics: (
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4"
        style={{ minHeight: height }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 border border-border rounded-lg bg-card space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    ),

    comparison: (
      <div
        className="p-6 border border-border rounded-lg bg-card space-y-4"
        style={{ height }}
      >
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    ),

    wizard: (
      <div
        className="p-6 border border-border rounded-lg bg-card space-y-6"
        style={{ height }}
      >
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              <Skeleton className="h-8 w-8 rounded-full" />
              {i < 4 && <Skeleton className="h-1 flex-1" />}
            </React.Fragment>
          ))}
        </div>
        {/* Content */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        {/* Form fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    ),

    insight: (
      <div
        className="p-5 border border-border rounded-lg bg-card space-y-3"
        style={{ height }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-px w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1 rounded" />
          <Skeleton className="h-9 flex-1 rounded" />
        </div>
      </div>
    ),
  }

  return (
    <div
      className={cn(
        shimmer && 'animate-pulse',
        'relative overflow-hidden',
        className
      )}
    >
      {label && (
        <div className="absolute top-2 left-2 z-10">
          <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
            {label}
          </span>
        </div>
      )}
      {variants[variant] || (
        <Skeleton style={{ height }} className="w-full rounded-lg" />
      )}
      {shimmer && (
        <div
          className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{ animationDelay: '0.5s' }}
        />
      )}
    </div>
  )
}

/**
 * Inline skeleton for text content
 */
export function InlineSkeleton({
  width = 100,
  className,
}: {
  width?: number | string
  className?: string
}) {
  return (
    <Skeleton
      className={cn('h-4 inline-block align-middle', className)}
      style={{ width: typeof width === 'number' ? `${width}px` : width }}
    />
  )
}

/**
 * Circular skeleton for avatars/icons
 */
export function CircleSkeleton({
  size = 40,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <Skeleton
      className={cn('rounded-full', className)}
      style={{ width: size, height: size }}
    />
  )
}
