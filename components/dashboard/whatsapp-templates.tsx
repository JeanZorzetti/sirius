'use client'

import { useEffect, useState, useMemo } from 'react'
import { CheckCircle2, Clock, AlertCircle, Pause, Ban, Search, RefreshCw, FileText, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type TemplateStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DISABLED'

interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  text?: string
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  buttons?: Array<{ type: string; text: string; url?: string; phone_number?: string }>
}

interface Template {
  id: string
  name: string
  status: TemplateStatus
  language: string
  category: string
  components: TemplateComponent[]
}

const STATUS_META: Record<TemplateStatus, { label: string; icon: typeof CheckCircle2; tone: string }> = {
  APPROVED: { label: 'Aprovado', icon: CheckCircle2, tone: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900' },
  PENDING: { label: 'Em análise', icon: Clock, tone: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900' },
  REJECTED: { label: 'Rejeitado', icon: AlertCircle, tone: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900' },
  PAUSED: { label: 'Pausado', icon: Pause, tone: 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 border-border' },
  DISABLED: { label: 'Desativado', icon: Ban, tone: 'text-zinc-500 bg-muted border-border' },
}

function getBody(t: Template): string {
  return t.components.find(c => c.type === 'BODY')?.text || ''
}

function getHeader(t: Template): TemplateComponent | undefined {
  return t.components.find(c => c.type === 'HEADER')
}

function getButtons(t: Template): NonNullable<TemplateComponent['buttons']> {
  return t.components.find(c => c.type === 'BUTTONS')?.buttons || []
}

function TemplateCard({ template, selected, onSelect }: { template: Template; selected: boolean; onSelect: () => void }) {
  const meta = STATUS_META[template.status] || STATUS_META.DISABLED
  const Icon = meta.icon
  const body = getBody(template)
  const header = getHeader(template)
  const buttons = getButtons(template)

  return (
    <button
      onClick={onSelect}
      className={cn(
        'group w-full text-left rounded-xl border bg-card p-4 transition-all duration-200',
        'hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected && 'border-primary/60 bg-accent/30 ring-1 ring-primary/30'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-foreground truncate tracking-tight">
            {template.name}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
            {template.language} · {template.category}
          </p>
        </div>
        <div className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wide shrink-0',
          meta.tone
        )}>
          <Icon className="h-2.5 w-2.5" />
          {meta.label}
        </div>
      </div>

      {header?.text && (
        <p className="text-xs font-semibold text-foreground/80 mb-1 line-clamp-1">
          {header.text}
        </p>
      )}
      {header?.format && header.format !== 'TEXT' && (
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
          Cabeçalho: {header.format.toLowerCase()}
        </p>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {body || <span className="italic">Sem corpo</span>}
      </p>

      {buttons.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mt-2.5">
          {buttons.slice(0, 3).map((b, i) => (
            <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border/60">
              {b.text}
            </span>
          ))}
          {buttons.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{buttons.length - 3}</span>
          )}
        </div>
      )}

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity absolute" />
    </button>
  )
}

function TemplateDetail({ template }: { template: Template }) {
  const meta = STATUS_META[template.status] || STATUS_META.DISABLED
  const Icon = meta.icon

  return (
    <Card className="p-6 sticky top-4">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-foreground truncate">
            {template.name}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            {template.language} · {template.category}
          </p>
        </div>
        <div className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-wide',
          meta.tone
        )}>
          <Icon className="h-3 w-3" />
          {meta.label}
        </div>
      </div>

      <div className="space-y-4">
        {template.components.map((c, i) => (
          <div key={i} className="rounded-lg border border-border/60 p-3 bg-muted/30">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
              {c.type}
              {c.format && ` · ${c.format}`}
            </p>
            {c.text && (
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {c.text}
              </p>
            )}
            {c.buttons && c.buttons.length > 0 && (
              <div className="space-y-1.5">
                {c.buttons.map((b, bi) => (
                  <div key={bi} className="flex items-center justify-between gap-2 p-2 rounded bg-background border border-border/40">
                    <span className="text-xs font-medium text-foreground">{b.text}</span>
                    <span className="text-[10px] text-muted-foreground font-mono uppercase">{b.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
        Templates podem ser usados via <code className="font-mono bg-muted px-1 py-0.5 rounded">sendTemplateMessage()</code> com parâmetros que substituem as variáveis <code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{1}}, {{2}}, ...`}</code>.
      </p>
    </Card>
  )
}

function Skeleton() {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-4 space-y-3 animate-pulse">
      <div className="flex justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-2.5 bg-muted/60 rounded w-1/3" />
        </div>
        <div className="h-5 w-16 bg-muted rounded-full" />
      </div>
      <div className="h-3 bg-muted/60 rounded w-full" />
      <div className="h-3 bg-muted/60 rounded w-4/5" />
    </div>
  )
}

export function WhatsAppTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | 'ALL'>('ALL')
  const [selected, setSelected] = useState<Template | null>(null)

  const fetchTemplates = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/whatsapp/templates')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError({ message: err.error || 'Erro ao carregar', code: err.code })
        setTemplates([])
        return
      }
      const data = await res.json()
      setTemplates(data.templates || [])
      if (!selected && (data.templates?.length ?? 0) > 0) {
        setSelected(data.templates[0])
      }
    } catch (err: any) {
      setError({ message: err?.message || 'Erro ao carregar' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter(t => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        getBody(t).toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      )
    })
  }, [templates, query, statusFilter])

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: templates.length }
    for (const t of templates) c[t.status] = (c[t.status] || 0) + 1
    return c
  }, [templates])

  const STATUS_TABS: Array<TemplateStatus | 'ALL'> = ['ALL', 'APPROVED', 'PENDING', 'REJECTED']

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Templates de mensagem
          </h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-2xl">
            Templates pré-aprovados pela Meta para iniciar conversas fora da janela de 24h. Mudanças neste painel devem ser feitas no Meta Business Suite.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTemplates}
          disabled={loading}
          className="gap-1.5 shrink-0"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Atualizar
        </Button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome, categoria ou corpo..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted">
          {STATUS_TABS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 h-7 rounded-md text-xs font-medium transition-all duration-200',
                'hover:text-foreground',
                statusFilter === s
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              )}
            >
              {s === 'ALL' ? 'Todos' : STATUS_META[s as TemplateStatus]?.label || s}
              <span className="ml-1.5 text-[10px] tabular-nums opacity-70">
                {counts[s] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="p-6 border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">{error.message}</p>
              {error.code === 'MISSING_WABA_ID' && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Configure o <strong>WABA Business Account ID</strong> em Configurações → Integrações → WhatsApp Business API. Você encontra o ID no Meta Business Suite.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Content grid */}
      {!error && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
          <div className="space-y-2.5">
            {loading ? (
              <>
                <Skeleton />
                <Skeleton />
                <Skeleton />
              </>
            ) : filtered.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-semibold text-foreground">Nenhum template encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {query ? 'Tente outro termo de busca' : 'Crie templates no Meta Business Suite'}
                </p>
              </Card>
            ) : (
              filtered.map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  selected={selected?.id === t.id}
                  onSelect={() => setSelected(t)}
                />
              ))
            )}
          </div>

          <div className="hidden lg:block">
            {selected && <TemplateDetail template={selected} />}
          </div>
        </div>
      )}
    </div>
  )
}
