'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Bell, CheckSquare, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface NotificationPreferences {
  newDealEnabled: boolean
  dealWonEnabled: boolean
  whatsappMessageEnabled: boolean
  calendarReminderEnabled: boolean
  taskAssignedEnabled: boolean
  taskDueSoonEnabled: boolean
  taskOverdueEnabled: boolean
  taskCompletedEnabled: boolean
}

const DEFAULT_PREFS: NotificationPreferences = {
  newDealEnabled: true,
  dealWonEnabled: true,
  whatsappMessageEnabled: true,
  calendarReminderEnabled: true,
  taskAssignedEnabled: true,
  taskDueSoonEnabled: true,
  taskOverdueEnabled: true,
  taskCompletedEnabled: true,
}

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFS)
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
        setPreferences({ ...DEFAULT_PREFS, ...data.preferences })
      }
    } catch {
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
    } catch {
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
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          NOTIFICAÇÕES
        </h2>
        <p className="text-sm text-zinc-500">
          Configure quais notificações push você deseja receber.
        </p>
      </div>

      <div className="space-y-4 max-w-2xl">
        {/* CRM notifications */}
        <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm">
          <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                CRM & Vendas
              </CardTitle>
              <CardDescription className="text-zinc-500 text-xs">
                Notificações sobre deals, WhatsApp e calendário
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <PrefRow
              id="newDeal"
              label="Novos Deals"
              description="Notificação quando um novo deal for criado para você"
              checked={preferences.newDealEnabled}
              onChange={(v) => updatePreference('newDealEnabled', v)}
              disabled={saving}
            />
            <PrefRow
              id="dealWon"
              label="Deals Ganhos"
              description="Notificação quando um deal for marcado como ganho"
              checked={preferences.dealWonEnabled}
              onChange={(v) => updatePreference('dealWonEnabled', v)}
              disabled={saving}
            />
            <PrefRow
              id="whatsapp"
              label="Mensagens WhatsApp"
              description="Notificação quando receber uma nova mensagem no WhatsApp"
              checked={preferences.whatsappMessageEnabled}
              onChange={(v) => updatePreference('whatsappMessageEnabled', v)}
              disabled={saving}
            />
            <PrefRow
              id="calendar"
              label="Lembretes de Calendário"
              description="Notificação 24h antes de eventos do calendário"
              checked={preferences.calendarReminderEnabled}
              onChange={(v) => updatePreference('calendarReminderEnabled', v)}
              disabled={saving}
            />
          </CardContent>
        </Card>

        {/* Task notifications */}
        <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm">
          <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Tarefas
              </CardTitle>
              <CardDescription className="text-zinc-500 text-xs">
                Notificações sobre atribuições, prazos e conclusões de tarefas
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <PrefRow
              id="taskAssigned"
              label="Tarefa atribuída a mim"
              description="Notificação quando alguém atribuir uma tarefa a você"
              checked={preferences.taskAssignedEnabled}
              onChange={(v) => updatePreference('taskAssignedEnabled', v)}
              disabled={saving}
            />
            <PrefRow
              id="taskDueSoon"
              label="Prazo próximo"
              description="Lembrete quando uma tarefa sua estiver próxima do vencimento"
              checked={preferences.taskDueSoonEnabled}
              onChange={(v) => updatePreference('taskDueSoonEnabled', v)}
              disabled={saving}
            />
            <PrefRow
              id="taskOverdue"
              label="Tarefa atrasada"
              description="Alerta quando uma tarefa sua ultrapassar o prazo"
              checked={preferences.taskOverdueEnabled}
              onChange={(v) => updatePreference('taskOverdueEnabled', v)}
              disabled={saving}
            />
            <PrefRow
              id="taskCompleted"
              label="Tarefa concluída"
              description="Notificação quando uma tarefa que você criou for concluída"
              checked={preferences.taskCompletedEnabled}
              onChange={(v) => updatePreference('taskCompletedEnabled', v)}
              disabled={saving}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PrefRow({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5 min-w-0">
        <Label htmlFor={id} className="text-sm font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer">
          {label}
        </Label>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="shrink-0"
      />
    </div>
  )
}
