'use client'

import { useState } from 'react'
import { EmailAutomationType } from '@prisma/client'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Mail, UserPlus, TrendingUp, ArrowRight } from 'lucide-react'
import { toggleAutomation } from '@/app/[locale]/dashboard/email-automations/actions'
import { useRouter } from 'next/navigation'

interface AutomationCardProps {
  id: string
  type: EmailAutomationType
  enabled: boolean
  customSubject: string | null
  customBody: string | null
  sendDelayMinutes: number
  onEditClick: () => void
}

const automationMetadata = {
  WELCOME_EMAIL: {
    title: 'Email de Boas-Vindas',
    description: 'Enviado quando um novo usuário se registra',
    icon: UserPlus,
    color: 'text-green-600'
  },
  DEAL_CREATED: {
    title: 'Notificação de Deal Criado',
    description: 'Enviado ao OWNER quando um deal é criado',
    icon: Mail,
    color: 'text-blue-600'
  },
  DEAL_STAGE_CHANGED: {
    title: 'Mudança de Etapa',
    description: 'Enviado ao responsável quando um deal muda de etapa',
    icon: ArrowRight,
    color: 'text-purple-600'
  },
  UPGRADE_NUDGE: {
    title: 'Sugestão de Upgrade',
    description: 'Enviado quando o usuário atinge 80% do limite',
    icon: TrendingUp,
    color: 'text-orange-600'
  }
}

export function AutomationCard({
  id,
  type,
  enabled,
  customSubject,
  customBody,
  sendDelayMinutes,
  onEditClick
}: AutomationCardProps) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const metadata = automationMetadata[type]
  const Icon = metadata.icon
  const isCustomized = customSubject !== null || customBody !== null
  const hasDelay = sendDelayMinutes > 0

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true)
    const result = await toggleAutomation(id, checked)
    if (result.success) {
      setIsEnabled(checked)
      router.refresh()
    }
    setIsUpdating(false)
  }

  const getDelayText = () => {
    if (sendDelayMinutes === 0) return 'Imediato'
    if (sendDelayMinutes < 60) return `${sendDelayMinutes} min`
    if (sendDelayMinutes < 1440) return `${Math.floor(sendDelayMinutes / 60)}h`
    return `${Math.floor(sendDelayMinutes / 1440)} dias`
  }

  return (
    <Card className={`transition-all ${!isEnabled ? 'opacity-60' : ''}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-start space-x-4">
          <div className={`p-2 rounded-lg bg-gray-100 ${metadata.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {metadata.title}
              {isCustomized && (
                <Badge variant="secondary" className="text-xs">
                  Personalizado
                </Badge>
              )}
              {hasDelay && (
                <Badge variant="outline" className="text-xs">
                  Delay: {getDelayText()}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{metadata.description}</CardDescription>
          </div>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isUpdating}
        />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isCustomized ? (
              <span className="text-blue-600">Template customizado ativo</span>
            ) : (
              <span>Usando template padrão</span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onEditClick}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Configurar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
