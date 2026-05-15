'use client'

import { useState } from 'react'
import { Loader2, Plus, Trash2, Send, ListChecks } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ButtonsComposerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: string
  onSent?: (msg: any) => void
}

interface ButtonDraft {
  id: string
  title: string
}

function newButton(): ButtonDraft {
  return { id: `btn_${Math.random().toString(36).slice(2, 8)}`, title: '' }
}

export function ButtonsComposerModal({ open, onOpenChange, contactId, onSent }: ButtonsComposerModalProps) {
  const [body, setBody] = useState('')
  const [buttons, setButtons] = useState<ButtonDraft[]>([newButton()])
  const [sending, setSending] = useState(false)

  function addButton() {
    if (buttons.length >= 3) return
    setButtons(prev => [...prev, newButton()])
  }

  function removeButton(idx: number) {
    setButtons(prev => prev.filter((_, i) => i !== idx))
  }

  function updateButton(idx: number, patch: Partial<ButtonDraft>) {
    setButtons(prev => prev.map((b, i) => i === idx ? { ...b, ...patch } : b))
  }

  async function handleSend() {
    const trimmedBody = body.trim()
    if (!trimmedBody) {
      toast.error('Escreva o texto da mensagem')
      return
    }
    const valid = buttons.filter(b => b.title.trim() && b.id.trim())
    if (valid.length === 0) {
      toast.error('Adicione pelo menos 1 botão com título')
      return
    }
    if (valid.some(b => b.title.length > 20)) {
      toast.error('Título de botão excede 20 caracteres')
      return
    }
    const ids = new Set(valid.map(b => b.id))
    if (ids.size !== valid.length) {
      toast.error('IDs de botões devem ser únicos')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/whatsapp/send-buttons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          message: trimmedBody,
          buttons: valid.map(b => ({ id: b.id.trim(), title: b.title.trim() })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao enviar')
      }
      const data = await res.json()
      toast.success('Mensagem com botões enviada')
      onSent?.(data)
      onOpenChange(false)
      setBody('')
      setButtons([newButton()])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 tracking-tight">
            <ListChecks className="h-4 w-4" />
            Mensagem com botões
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">
              Texto da mensagem
            </Label>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Ex: Qual horário fica melhor para a reunião?"
              rows={3}
              maxLength={1024}
              className="resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right tabular-nums">
              {body.length}/1024
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">
                Botões ({buttons.length}/3)
              </Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={addButton}
                disabled={buttons.length >= 3}
                className="h-6 px-2 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {buttons.map((b, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">#{i + 1}</span>
                    <Input
                      value={b.title}
                      onChange={e => updateButton(i, { title: e.target.value })}
                      placeholder="Título do botão (máx 20 caracteres)"
                      maxLength={20}
                      className="h-7 text-sm"
                    />
                    <button
                      onClick={() => removeButton(i)}
                      disabled={buttons.length === 1}
                      className={cn(
                        'p-1 rounded text-muted-foreground transition-colors',
                        buttons.length === 1
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:text-destructive hover:bg-destructive/10'
                      )}
                      title="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Input
                    value={b.id}
                    onChange={e => updateButton(i, { id: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') })}
                    placeholder="ID interno (ex: yes_morning)"
                    maxLength={256}
                    className="h-6 text-[11px] font-mono text-muted-foreground bg-background"
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              O ID é enviado de volta no webhook quando o usuário clica — útil para roteamento sem parsing de texto.
            </p>
          </div>

          <Button
            onClick={handleSend}
            disabled={sending}
            className="w-full gap-1.5"
          >
            {sending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Send className="h-3.5 w-3.5" />}
            Enviar com botões
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
