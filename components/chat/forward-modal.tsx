'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Send, Loader2, Check, Forward as ForwardIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ContactOption {
  id: string
  name: string | null
  phone: string | null
}

interface ForwardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The source message being forwarded */
  sourceMessageId: string | null
  /** The source message text (for preview only) */
  sourceText: string | null
  /** All available contacts (typically conversation list) */
  contacts: ContactOption[]
  /** The contact ID where source message came from — excluded from targets */
  excludeContactId?: string
}

function initials(c: ContactOption): string {
  if (c.name) return c.name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const d = (c.phone || '').replace(/\D/g, '')
  return d ? d.slice(-2) : '??'
}

export function ForwardModal({
  open,
  onOpenChange,
  sourceMessageId,
  sourceText,
  contacts,
  excludeContactId,
}: ForwardModalProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelected(new Set())
      setSending(false)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return contacts
      .filter(c => c.id !== excludeContactId)
      .filter(c => {
        if (!q) return true
        return (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q)
      })
      .slice(0, 50)
  }, [contacts, query, excludeContactId])

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 10) next.add(id)
      else toast.error('Máximo 10 destinatários')
      return next
    })
  }

  async function handleSend() {
    if (!sourceMessageId || selected.size === 0) return
    setSending(true)
    try {
      const res = await fetch('/api/whatsapp/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceMessageId,
          targetContactIds: Array.from(selected),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao encaminhar')
      }
      const data = await res.json()
      if (data.succeeded === data.total) {
        toast.success(`Encaminhado para ${data.succeeded} ${data.succeeded === 1 ? 'contato' : 'contatos'}`)
      } else {
        toast.warning(`Encaminhado para ${data.succeeded} de ${data.total} — alguns falharam`)
      }
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao encaminhar')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ForwardIcon className="h-4 w-4" />
            Encaminhar mensagem
          </DialogTitle>
        </DialogHeader>

        {sourceText && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1 font-semibold">
              Mensagem
            </p>
            <p className="text-[13px] text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-snug">
              {sourceText}
            </p>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar contato..."
            className="pl-9"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto -mx-2 px-2 space-y-0.5">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 py-8">Nenhum contato encontrado</p>
          ) : (
            filtered.map(c => {
              const isSelected = selected.has(c.id)
              return (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left',
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/30'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[11px] bg-zinc-300 dark:bg-zinc-700">
                      {initials(c)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {c.name || c.phone || '—'}
                    </p>
                    {c.name && c.phone && (
                      <p className="text-[11px] text-zinc-500 truncate">{c.phone}</p>
                    )}
                  </div>
                  <div className={cn(
                    'h-5 w-5 rounded-full flex items-center justify-center transition-all shrink-0',
                    isSelected
                      ? 'bg-emerald-500 text-white'
                      : 'border-2 border-zinc-300 dark:border-zinc-600'
                  )}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <p className="text-[12px] text-zinc-500">
            {selected.size > 0 ? `${selected.size}/10 selecionados` : 'Selecione até 10 contatos'}
          </p>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={selected.size === 0 || sending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {sending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Send className="h-3.5 w-3.5" />}
            Encaminhar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
