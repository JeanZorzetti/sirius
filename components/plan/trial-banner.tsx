'use client'

import { AlertTriangle, Clock, Zap } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type TrialBannerProps = {
  trialEndsAt: Date | null
  trialStatus: string | null
  tier: string
}

function getDaysRemaining(endsAt: Date): number {
  const ms = endsAt.getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

export function TrialBanner({ trialEndsAt, trialStatus, tier }: TrialBannerProps) {
  if (tier !== 'FREE') return null

  const isExpired = !trialEndsAt || trialStatus === 'EXPIRED' || new Date(trialEndsAt) <= new Date()
  const daysLeft = trialEndsAt ? getDaysRemaining(new Date(trialEndsAt)) : 0

  if (isExpired) {
    return (
      <div className="flex items-center justify-between gap-3 bg-destructive/10 border-b border-destructive/20 px-4 py-2.5 text-sm">
        <div className="flex items-center gap-2 text-destructive font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Trial expirado — sua conta está em modo somente leitura.</span>
        </div>
        <Link
          href="/dashboard/billing"
          className="shrink-0 rounded-md bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors"
        >
          Fazer upgrade
        </Link>
      </div>
    )
  }

  const urgent = daysLeft <= 2

  return (
    <div className={cn(
      'flex items-center justify-between gap-3 border-b px-4 py-2.5 text-sm',
      urgent
        ? 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
        : 'bg-primary/5 border-primary/10'
    )}>
      <div className={cn(
        'flex items-center gap-2 font-medium',
        urgent ? 'text-orange-700 dark:text-orange-400' : 'text-primary'
      )}>
        {urgent ? <Clock className="h-4 w-4 shrink-0" /> : <Zap className="h-4 w-4 shrink-0" />}
        <span>
          {daysLeft === 0
            ? 'Último dia do trial PRO. Faça upgrade para não perder o acesso.'
            : `Trial PRO: ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}.`
          }
        </span>
      </div>
      <Link
        href="/dashboard/billing"
        className={cn(
          'shrink-0 rounded-md px-3 py-1 text-xs font-semibold transition-colors',
          urgent
            ? 'bg-orange-600 text-white hover:bg-orange-700'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
      >
        Ver planos
      </Link>
    </div>
  )
}
