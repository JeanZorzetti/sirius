'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { WhatsAppMessage } from './types'

/**
 * AI reply drafts: on-demand generation plus the co-pilot mode that
 * auto-drafts whenever a fresh inbound message arrives.
 */
export function useAIDraft(contactId: string, messages: WhatsAppMessage[]) {
  const [aiDraft, setAiDraft] = useState<{ text: string; agentName: string; usedRag: boolean } | null>(null)
  const [aiDraftLoading, setAiDraftLoading] = useState(false)
  const [coPilotEnabled, setCoPilotEnabled] = useState(false)

  const requestAIDraft = useCallback(async (agentId: string = 'default', instruction: string = '') => {
    setAiDraftLoading(true)
    try {
      const res = await fetch('/api/ia/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, agentId, instruction }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao gerar rascunho')
      }
      const data = await res.json()
      setAiDraft({ text: data.draft, agentName: data.agentName, usedRag: !!data.usedRag })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar rascunho')
      setAiDraft(null)
    } finally {
      setAiDraftLoading(false)
    }
  }, [contactId])

  // Co-pilot: auto-generate a draft when a new INBOUND message arrives
  const lastSeenInboundIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!coPilotEnabled || messages.length === 0) return
    const last = messages[messages.length - 1]
    if (last.direction !== 'INBOUND') return
    if (lastSeenInboundIdRef.current === last.id) return
    lastSeenInboundIdRef.current = last.id
    // Skip on initial load — only react to truly new inbound messages
    if (Date.now() - new Date(last.sentAt).getTime() > 60_000) return
    requestAIDraft('default', '')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, coPilotEnabled])

  // Reset co-pilot state when switching contacts
  useEffect(() => {
    lastSeenInboundIdRef.current = null
    setAiDraft(null)
  }, [contactId])

  return {
    aiDraft, setAiDraft, aiDraftLoading,
    coPilotEnabled, toggleCoPilot: () => setCoPilotEnabled(v => !v),
    requestAIDraft,
  }
}
