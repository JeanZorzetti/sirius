'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bot, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentAction {
  id: string
  agentName: string
  status: string
  confidence: number
  createdAt: string
}

interface AgentActionsBadgeProps {
  contactId: string
  /**
   * Refresh interval in ms. 0 disables polling.
   */
  refreshIntervalMs?: number
}

export function AgentActionsBadge({ contactId, refreshIntervalMs = 30000 }: AgentActionsBadgeProps) {
  const [actions, setActions] = useState<AgentAction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchActions() {
      try {
        const res = await fetch(`/api/ia/actions/contact?contactId=${contactId}`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setActions(data.actions || [])
      } catch {} finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchActions()
    if (refreshIntervalMs > 0) {
      const id = setInterval(fetchActions, refreshIntervalMs)
      return () => { cancelled = true; clearInterval(id) }
    }
    return () => { cancelled = true }
  }, [contactId, refreshIntervalMs])

  if (loading || actions.length === 0) return null

  const pending = actions.filter(a => a.status === 'NEEDS_APPROVAL' || a.status === 'PENDING').length
  const recentSuccess = actions.filter(a =>
    a.status === 'SUCCESS' &&
    new Date(a.createdAt).getTime() > Date.now() - 60 * 60 * 1000
  ).length

  if (pending === 0 && recentSuccess === 0) return null

  return (
    <Link
      href="/IA"
      target="_blank"
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium transition-all',
        pending > 0
          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60 hover:bg-amber-200/60'
          : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60 hover:bg-emerald-200/60'
      )}
      title={pending > 0 ? `${pending} ação(ões) aguardando aprovação` : `${recentSuccess} ação(ões) recente(s) da IA`}
    >
      {pending > 0 ? <AlertCircle className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
      {pending > 0
        ? <span>{pending} pendente{pending > 1 ? 's' : ''}</span>
        : <span>IA ativa</span>
      }
    </Link>
  )
}
