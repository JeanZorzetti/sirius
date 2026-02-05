/**
 * LimitBadge Component
 *
 * Mostra um badge indicando o uso atual vs limite de um recurso.
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Infinity } from 'lucide-react'
import { useLimitStatus } from '@/lib/hooks/use-entitlements'
import { cn } from '@/lib/utils'

interface LimitBadgeProps {
  resource: 'deals' | 'users' | 'pipelines'
  currentCount: number
  className?: string
  showIcon?: boolean
}

export function LimitBadge({
  resource,
  currentCount,
  className,
  showIcon = true,
}: LimitBadgeProps) {
  const status = useLimitStatus(resource, currentCount)

  if (status.isUnlimited) {
    return (
      <Badge
        variant="secondary"
        className={cn('gap-1 font-mono', className)}
      >
        {showIcon && <Infinity className="h-3 w-3" />}
        {currentCount}
      </Badge>
    )
  }

  const variant = status.isAtLimit
    ? 'destructive'
    : status.isNearLimit
      ? 'secondary'
      : 'outline'

  const Icon = status.isAtLimit
    ? AlertCircle
    : status.isNearLimit
      ? AlertCircle
      : CheckCircle

  return (
    <Badge
      variant={variant}
      className={cn('gap-1 font-mono', className)}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {currentCount}/{status.limit}
    </Badge>
  )
}

/**
 * ProgressBar para limite
 */
interface LimitProgressProps {
  resource: 'deals' | 'users' | 'pipelines'
  currentCount: number
  className?: string
}

export function LimitProgress({
  resource,
  currentCount,
  className,
}: LimitProgressProps) {
  const status = useLimitStatus(resource, currentCount)

  if (status.isUnlimited) {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground capitalize">{resource}</span>
          <span className="font-medium">{currentCount} (Ilimitado)</span>
        </div>
      </div>
    )
  }

  const color = status.isAtLimit
    ? 'bg-destructive'
    : status.isNearLimit
      ? 'bg-yellow-500'
      : 'bg-primary'

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground capitalize">{resource}</span>
        <span className="font-medium">
          {currentCount}/{status.limit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full transition-all', color)}
          style={{ width: `${status.percentage}%` }}
        />
      </div>
      {status.isAtLimit && (
        <p className="text-xs text-destructive">
          Limite atingido. Faça upgrade para continuar.
        </p>
      )}
      {status.isNearLimit && !status.isAtLimit && (
        <p className="text-xs text-yellow-600 dark:text-yellow-500">
          Você está próximo do limite ({status.remaining} restantes)
        </p>
      )}
    </div>
  )
}
