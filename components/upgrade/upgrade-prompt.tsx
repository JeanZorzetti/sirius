/**
 * UpgradePrompt Component
 *
 * Mostra um prompt para o usuário fazer upgrade quando uma feature está bloqueada.
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, Sparkles, TrendingUp } from 'lucide-react'
import { SubscriptionTier } from '@prisma/client'
import {
  PLAN_NAMES,
  PLAN_PRICING,
  PLAN_DESCRIPTIONS,
} from '@/lib/entitlements'
import { useEntitlements } from '@/lib/hooks/use-entitlements'
import Link from 'next/link'

interface UpgradePromptProps {
  feature: string
  requiredTier: SubscriptionTier
  compact?: boolean
}

export function UpgradePrompt({
  feature,
  requiredTier,
  compact = false,
}: UpgradePromptProps) {
  const { tier: currentTier } = useEntitlements()

  const requiredPlanName = PLAN_NAMES[requiredTier]
  const requiredPrice = PLAN_PRICING[requiredTier]

  if (compact) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/10 p-4">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              Disponível no plano {requiredPlanName}
            </p>
            <p className="text-xs text-muted-foreground">
              Faça upgrade para desbloquear {feature}
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/settings/billing">
              Fazer Upgrade
              <TrendingUp className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Desbloqueie {feature}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Esta feature está disponível no plano {requiredPlanName}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {requiredPlanName}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* CTA */}
        <div className="flex items-center justify-between gap-4 rounded-lg bg-muted p-4">
          <div>
            <p className="text-sm font-medium">
              Plano {requiredPlanName}
            </p>
            <p className="text-2xl font-bold">
              R$ {requiredPrice}
              <span className="text-sm font-normal text-muted-foreground">
                /mês
              </span>
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/settings/billing">
              Fazer Upgrade Agora
              <TrendingUp className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

        {/* Link para comparação */}
        <div className="text-center">
          <Button asChild variant="link" size="sm">
            <Link href="/pricing">
              Ver comparação completa de planos
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
