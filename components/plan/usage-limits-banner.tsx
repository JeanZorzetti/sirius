'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { AlertCircle, Sparkles, ArrowRight, TrendingUp } from 'lucide-react'

interface UsageLimitsBannerProps {
  plan: 'FREE' | 'PRO'
  usage: {
    contacts: number
    pipelines: number
  }
  limits: {
    maxContacts: number
    maxPipelines: number
  }
  contactsUsagePercent: number
  pipelinesUsagePercent: number
  hasReachedContactLimit: boolean
  hasReachedPipelineLimit: boolean
  isApproachingContactLimit: boolean
  isApproachingPipelineLimit: boolean
}

export function UsageLimitsBanner({
  plan,
  usage,
  limits,
  contactsUsagePercent,
  pipelinesUsagePercent,
  hasReachedContactLimit,
  hasReachedPipelineLimit,
  isApproachingContactLimit,
  isApproachingPipelineLimit,
}: UsageLimitsBannerProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Don't show for PRO users
  if (plan === 'PRO') {
    return null
  }

  // Check if should show warning (approaching or reached limits)
  const showWarning = isApproachingContactLimit || isApproachingPipelineLimit ||
    hasReachedContactLimit || hasReachedPipelineLimit

  if (!showWarning) {
    return null
  }

  const isLimitReached = hasReachedContactLimit || hasReachedPipelineLimit

  return (
    <>
      <Card className={`mb-6 border-2 ${
        isLimitReached
          ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
          : 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              isLimitReached
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-orange-100 dark:bg-orange-900/30'
            }`}>
              {isLimitReached ? (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500" />
              ) : (
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-500" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4">
              {/* Header */}
              <div>
                <h3 className="font-bold text-lg mb-1">
                  {isLimitReached
                    ? 'Sua empresa está crescendo! 🚀'
                    : 'Você está se aproximando do limite'}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {isLimitReached
                    ? 'Você atingiu o limite do plano gratuito. Desbloqueie recursos ilimitados por apenas R$ 49/mês.'
                    : 'Você está usando quase todo o plano gratuito. Considere fazer upgrade para continuar crescendo.'}
                </p>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3">
                {/* Contacts Progress */}
                {(isApproachingContactLimit || hasReachedContactLimit) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">
                        Contatos/Leads
                      </span>
                      <span className={`font-mono ${
                        hasReachedContactLimit
                          ? 'text-red-600 dark:text-red-500 font-bold'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {usage.contacts} / {limits.maxContacts}
                      </span>
                    </div>
                    <Progress
                      value={contactsUsagePercent}
                      className={`h-2 ${
                        hasReachedContactLimit ? 'bg-red-200 dark:bg-red-900/30' : ''
                      }`}
                      indicatorClassName={
                        hasReachedContactLimit
                          ? 'bg-red-600'
                          : contactsUsagePercent >= 90
                          ? 'bg-orange-500'
                          : 'bg-blue-500'
                      }
                    />
                  </div>
                )}

                {/* Pipelines Progress */}
                {(isApproachingPipelineLimit || hasReachedPipelineLimit) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">
                        Pipelines
                      </span>
                      <span className={`font-mono ${
                        hasReachedPipelineLimit
                          ? 'text-red-600 dark:text-red-500 font-bold'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {usage.pipelines} / {limits.maxPipelines}
                      </span>
                    </div>
                    <Progress
                      value={pipelinesUsagePercent}
                      className={`h-2 ${
                        hasReachedPipelineLimit ? 'bg-red-200 dark:bg-red-900/30' : ''
                      }`}
                      indicatorClassName={
                        hasReachedPipelineLimit
                          ? 'bg-red-600'
                          : pipelinesUsagePercent >= 90
                          ? 'bg-orange-500'
                          : 'bg-blue-500'
                      }
                    />
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Sparkles className="mr-2 w-4 h-4" />
                  Fazer Upgrade por R$ 49/mês
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/billing">
                    Ver Detalhes do Plano
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              Desbloqueie o Sirius PRO
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Continue crescendo sem limites por apenas R$ 49/mês.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* O que você ganha */}
            <div className="space-y-3">
              <h3 className="font-semibold">O que você desbloqueia:</h3>
              <div className="space-y-2">
                {[
                  'Contatos/Leads Ilimitados',
                  'Pipelines Ilimitados',
                  'Negociações Ilimitadas',
                  'Integrações Avançadas',
                  'Suporte Prioritário',
                  'Acesso a Novos Recursos (IA, Automações)',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <span className="text-green-600 dark:text-green-500 text-xs">✓</span>
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-blue-600">R$ 49</span>
                <span className="text-zinc-600 dark:text-zinc-400">/mês</span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Cancele quando quiser • Sem multa • Sem compromisso
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUpgradeModal(false)}
              className="w-full sm:w-auto"
            >
              Agora Não
            </Button>
            <Button
              asChild
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Link href="/dashboard/billing">
                Fazer Upgrade Agora
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
