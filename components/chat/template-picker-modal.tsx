'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileText, Search, Loader2, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  text?: string
  format?: string
}

interface Template {
  id: string
  name: string
  status: string
  language: string
  category: string
  components: TemplateComponent[]
}

interface TemplatePickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: string
  onSent?: (msg: any) => void
}

function getBody(t: Template): string {
  return t.components.find(c => c.type === 'BODY')?.text || ''
}

function extractParamCount(body: string): number {
  const matches = body.match(/\{\{\d+\}\}/g) || []
  return matches.length
}

export function TemplatePickerModal({ open, onOpenChange, contactId, onSent }: TemplatePickerModalProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Template | null>(null)
  const [params, setParams] = useState<string[]>([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelected(null)
      setParams([])
      return
    }
    setLoading(true)
    setError(null)
    fetch('/api/whatsapp/templates')
      .then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}))
          throw new Error(err.error || 'Erro ao carregar')
        }
        return r.json()
      })
      .then((data: { templates: Template[] }) => {
        // Only APPROVED templates are sendable
        const approved = (data.templates || []).filter(t => t.status === 'APPROVED')
        setTemplates(approved)
      })
      .catch(err => setError(err?.message || 'Erro ao carregar templates'))
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (!selected) {
      setParams([])
      return
    }
    const count = extractParamCount(getBody(selected))
    setParams(new Array(count).fill(''))
  }, [selected])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return templates
    return templates.filter(t =>
      t.name.toLowerCase().includes(q) ||
      getBody(t).toLowerCase().includes(q)
    )
  }, [templates, query])

  function renderPreview(): string {
    if (!selected) return ''
    const body = getBody(selected)
    return body.replace(/\{\{(\d+)\}\}/g, (_, idx) => {
      const i = parseInt(idx) - 1
      const val = params[i]?.trim()
      return val ? val : `{{${idx}}}`
    })
  }

  async function handleSend() {
    if (!selected) return
    // All params must be filled
    if (params.some(p => !p.trim())) {
      toast.error('Preencha todos os parâmetros')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/whatsapp/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          templateName: selected.name,
          language: selected.language,
          parameters: params,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao enviar')
      }
      const data = await res.json()
      toast.success(`Template "${selected.name}" enviado`)
      onSent?.(data)
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 tracking-tight">
            <FileText className="h-4 w-4" />
            Enviar template aprovado
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 min-h-[360px]">
          {/* Left: list */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar template..."
                className="pl-9 h-9"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
              {loading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {templates.length === 0 ? 'Nenhum template aprovado' : 'Nenhum resultado'}
                </p>
              ) : (
                filtered.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className={cn(
                      'w-full text-left rounded-lg border bg-card p-2.5 transition-all duration-150',
                      'hover:border-primary/40 hover:bg-accent/30',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected?.id === t.id && 'border-primary/60 bg-accent/40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm text-foreground truncate flex-1">
                        {t.name}
                      </p>
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {t.language} · {t.category}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: detail + params */}
          <div className="space-y-3">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-12">
                <FileText className="h-8 w-8 opacity-40 mb-2" />
                <p className="text-sm">Selecione um template à esquerda</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">
                    Preview
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {renderPreview() || <span className="italic text-muted-foreground">Sem corpo</span>}
                  </p>
                </div>

                {params.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">
                      Parâmetros ({params.length})
                    </Label>
                    {params.map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground w-8 shrink-0">
                          {`{${i + 1}}`}
                        </span>
                        <Input
                          value={p}
                          onChange={e => setParams(prev => prev.map((v, j) => j === i ? e.target.value : v))}
                          placeholder={`Valor para {{${i + 1}}}`}
                          className="h-8"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleSend}
                  disabled={sending || params.some(p => !p.trim())}
                  className="w-full gap-1.5"
                >
                  {sending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Send className="h-3.5 w-3.5" />}
                  Enviar template
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
