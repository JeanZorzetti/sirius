/**
 * FeatureGate Component
 *
 * Componente que controla acesso a features baseado no plano.
 * Se o usuário não tem acesso, mostra um upgrade prompt.
 */

'use client'

import { ReactNode } from 'react'
import { useFeatureAccess } from '@/lib/hooks/use-entitlements'
import { UpgradePrompt } from './upgrade-prompt'
import { SubscriptionTier } from '@prisma/client'

interface FeatureGateProps {
  feature: string
  requiredTier: SubscriptionTier
  featureName?: string
  fallback?: ReactNode
  children: ReactNode
}

export function FeatureGate({
  feature,
  requiredTier,
  featureName,
  fallback,
  children,
}: FeatureGateProps) {
  const hasAccess = useFeatureAccess(feature)

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <UpgradePrompt
        feature={featureName || feature}
        requiredTier={requiredTier}
      />
    )
  }

  return <>{children}</>
}
