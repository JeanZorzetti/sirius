'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Bell, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface NotificationPreferences {
  newDealEnabled: boolean
  dealWonEnabled: boolean
  whatsappMessageEnabled: boolean
  calendarReminderEnabled: boolean
}

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    newDealEnabled: true,
    dealWonEnabled: true,
    whatsappMessageEnabled: true,
    calendarReminderEnabled: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/push/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
      toast.error('Erro ao carregar preferências')
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = async (field: keyof NotificationPreferences, value: boolean) => {
    setSaving(true)

    try {
      const response = await fetch('/api/push/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })

      if (response.ok) {
        setPreferences((prev) => ({ ...prev, [field]: value }))
        toast.success('Preferências atualizadas')
      } else {
        toast.error('Erro ao atualizar preferências')
      }
    } catch (error) {
      console.error('Failed to update preference:', error)
      toast.error('Erro ao atualizar preferências')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            NOTIFICAÇÕES
          </h2>
          <p className="text-sm text-zinc-500">
            Configure quais notificações push você deseja receber.
          </p>
        </div>
      </div>

      <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm max-w-2xl">
        <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Preferências de Notificação
            </CardTitle>
            <CardDescription className="text-zinc-500 text-xs">
              Escolha os tipos de notificações que você deseja receber
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="newDeal" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Novos Deals
              </Label>
              <p className="text-xs text-zinc-500">
                Notificação quando um novo deal for criado para você
              </p>
            </div>
            <Switch
              id="newDeal"
              checked={preferences.newDealEnabled}
              onCheckedChange={(value) => updatePreference('newDealEnabled', value)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dealWon" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Deals Ganhos
              </Label>
              <p className="text-xs text-zinc-500">
                Notificação quando um deal for marcado como ganho na sua organização
              </p>
            </div>
            <Switch
              id="dealWon"
              checked={preferences.dealWonEnabled}
              onCheckedChange={(value) => updatePreference('dealWonEnabled', value)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="whatsapp" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Mensagens WhatsApp
              </Label>
              <p className="text-xs text-zinc-500">
                Notificação quando receber uma nova mensagem no WhatsApp
              </p>
            </div>
            <Switch
              id="whatsapp"
              checked={preferences.whatsappMessageEnabled}
              onCheckedChange={(value) => updatePreference('whatsappMessageEnabled', value)}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="calendar" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Lembretes de Calendário
              </Label>
              <p className="text-xs text-zinc-500">
                Notificação 24h antes de eventos do calendário
              </p>
            </div>
            <Switch
              id="calendar"
              checked={preferences.calendarReminderEnabled}
              onCheckedChange={(value) => updatePreference('calendarReminderEnabled', value)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
