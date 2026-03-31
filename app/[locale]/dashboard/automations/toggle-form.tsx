'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface AutomationToggleFormProps {
  automationId: string
  enabled: boolean
}

export function AutomationToggleForm({ automationId, enabled }: AutomationToggleFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleToggle() {
    startTransition(async () => {
      try {
        await fetch(`/api/automations/${automationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !enabled })
        })
        router.refresh()
      } catch {
        // Silent fail
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={enabled ? 'Desativar automação' : 'Ativar automação'}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        enabled ? 'bg-primary' : 'bg-input'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
          enabled ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
