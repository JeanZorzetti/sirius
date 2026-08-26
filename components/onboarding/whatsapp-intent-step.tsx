'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BadgeCheck, QrCode, Clock, Loader2 } from 'lucide-react'

export type WhatsAppIntent = 'waba' | 'qr' | 'later'

interface WhatsAppIntentStepProps {
  onChoose: (intent: WhatsAppIntent) => void
  isLoading: boolean
}

/**
 * Renderiza dentro do mesmo Dialog do WelcomeModal (troca de step, sem remount do Dialog).
 * Título/descrição acessíveis ficam no DialogTitle/DialogDescription do pai — não duplicar heading aqui.
 */
export function WhatsAppIntentStep({ onChoose, isLoading }: WhatsAppIntentStepProps) {
  const t = useTranslations('components.onboarding.whatsappIntent')

  const options: Array<{
    intent: WhatsAppIntent
    icon: React.ReactNode
    cardClass: string
    iconWrapClass: string
  }> = [
    {
      intent: 'waba',
      icon: <BadgeCheck className="w-6 h-6 text-green-600 dark:text-green-400" />,
      cardClass: 'hover:border-green-300',
      iconWrapClass: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      intent: 'qr',
      icon: <QrCode className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      cardClass: 'hover:border-blue-300',
      iconWrapClass: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      intent: 'later',
      icon: <Clock className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />,
      cardClass: 'hover:border-zinc-400',
      iconWrapClass: 'bg-zinc-100 dark:bg-zinc-800',
    },
  ]

  return (
    <div className="grid gap-4 py-6 sm:grid-cols-3">
      {options.map(({ intent, icon, cardClass, iconWrapClass }, index) => (
        <Card
          key={intent}
          className={`p-6 border-2 border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-lg ${cardClass}`}
        >
          <div className="space-y-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${iconWrapClass}`}>
              {icon}
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-bold text-lg">{t(`${intent}.label`)}</h3>
              <p className="text-sm text-muted-foreground">{t(`${intent}.description`)}</p>
            </div>

            <Button
              variant={intent === 'later' ? 'outline' : 'default'}
              className="w-full"
              disabled={isLoading}
              autoFocus={index === 0}
              onClick={() => onChoose(intent)}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t(`${intent}.button`)}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
