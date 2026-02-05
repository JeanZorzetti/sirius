/**
 * QuotaDisplay Components
 *
 * Componentes para exibir quotas de IA e créditos de scraping.
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Brain,
  Search,
  Infinity as InfinityIcon,
  AlertCircle,
  ShoppingCart,
} from 'lucide-react'
import {
  useAgiQuotaStatus,
  useScrapingCreditsStatus,
} from '@/lib/hooks/use-entitlements'
import Link from 'next/link'

/**
 * Mostra a quota de IA (AGI)
 */
export function AgiQuotaDisplay() {
  const quota = useAgiQuotaStatus()

  if (!quota.hasAccess) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              IA (AGI Sirius)
            </CardTitle>
            <Badge variant="secondary">Sem acesso</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            A IA está disponível no plano PRO
          </p>
          <Button asChild size="sm" className="w-full">
            <Link href="/settings/billing">Fazer Upgrade</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (quota.isUnlimited) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              IA (AGI Sirius)
            </CardTitle>
            <Badge variant="default" className="gap-1">
              <InfinityIcon className="h-3 w-3" />
              Ilimitado
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Você tem acesso ilimitado à IA
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {quota.used} gerações este mês
          </p>
        </CardContent>
      </Card>
    )
  }

  const isExceeded = quota.isExceeded
  const isNearLimit = quota.percentage >= 80

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4" />
            IA (AGI Sirius)
          </CardTitle>
          <Badge
            variant={isExceeded ? 'destructive' : isNearLimit ? 'secondary' : 'default'}
            className="font-mono"
          >
            {quota.used}/{quota.limit}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={quota.percentage} className="h-2" />

        {isExceeded ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Quota excedida
            </p>
            <Button asChild size="sm" className="w-full">
              <Link href="/settings/billing">
                Upgrade para ilimitado
              </Link>
            </Button>
          </div>
        ) : isNearLimit ? (
          <p className="text-xs text-muted-foreground">
            {quota.remaining} gerações restantes este mês
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {quota.remaining} de {quota.limit} gerações disponíveis
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Mostra os créditos de scraping
 */
export function ScrapingCreditsDisplay() {
  const credits = useScrapingCreditsStatus()

  if (!credits.hasAccess) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Créditos de Prospecção
            </CardTitle>
            <Badge variant="secondary">Sem acesso</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Prospecção automática disponível no plano PRO
          </p>
          <Button asChild size="sm" className="w-full">
            <Link href="/settings/billing">Fazer Upgrade</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isLow = credits.balance < 10
  const isExhausted = credits.balance === 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Search className="h-4 w-4" />
            Créditos de Prospecção
          </CardTitle>
          <Badge
            variant={isExhausted ? 'destructive' : isLow ? 'secondary' : 'default'}
            className="font-mono"
          >
            {credits.balance}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Quota mensal</span>
            <span>{credits.monthlyQuota} créditos/mês</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Usados este mês</span>
            <span>{credits.used}</span>
          </div>
        </div>

        {isExhausted ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Créditos esgotados
            </p>
            <Button asChild size="sm" className="w-full" variant="default">
              <Link href="/settings/addons">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Comprar créditos extras
              </Link>
            </Button>
          </div>
        ) : isLow ? (
          <div className="space-y-2">
            <p className="text-xs text-yellow-600 dark:text-yellow-500">
              Poucos créditos restantes
            </p>
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href="/settings/addons">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Comprar mais
              </Link>
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {credits.balance} créditos disponíveis
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Exibe ambas as quotas lado a lado
 */
export function QuotaDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <AgiQuotaDisplay />
      <ScrapingCreditsDisplay />
    </div>
  )
}
