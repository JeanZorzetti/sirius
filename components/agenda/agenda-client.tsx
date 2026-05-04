'use client'

import { useState, useTransition, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Flag,
  Inbox,
  User,
  CheckSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { EditDealDialog } from '@/components/deals/edit-deal-dialog'
import { AnimatedPageContainer } from '@/components/dashboard/animated-page-container'
import { GoogleCalendarEmbed, GoogleCalendarEmbedPlaceholder } from './google-calendar-embed'
import { cn } from '@/lib/utils'
import { format, isToday, isTomorrow, isPast, isThisWeek, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppBar } from '@/components/mobile/app-bar-context'

type Deal = {
  id: string
  title: string
  value: number | null
  dueDate: string
  stageId: string
  contactId: string | null
  stage: { id: string; name: string }
  pipeline: { id: string; name: string }
  contact: { id: string; name: string; phone: string | null } | null
}

type AgendaTask = {
  id: string
  title: string
  dueDate: string
  priority: string
  status: { id: string; name: string; color: string } | null
  project: { id: string; name: string } | null
  assignee: { id: string; name: string } | null
}

type AgendaItem =
  | { kind: 'deal'; item: Deal }
  | { kind: 'task'; item: AgendaTask }

type Group = {
  label: string
  color: string
  dotColor: string
  items: AgendaItem[]
}

type ExportState = 'idle' | 'loading' | 'done' | 'error'

type Props = {
  deals: Deal[]
  stages: { id: string; name: string }[]
  contacts: { id: string; name: string; phone: string | null }[]
  tasks: AgendaTask[]
  googleCalendarEnabled: boolean
  googleCalendarEmail: string | null
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'text-red-500',
  HIGH: 'text-orange-500',
  MEDIUM: 'text-yellow-500',
  LOW: 'text-blue-400',
  NONE: 'text-muted-foreground',
}

function groupItems(deals: Deal[], tasks: AgendaTask[]): Group[] {
  const overdue: AgendaItem[] = []
  const today: AgendaItem[] = []
  const tomorrow: AgendaItem[] = []
  const thisWeek: AgendaItem[] = []
  const upcoming: AgendaItem[] = []

  const push = (item: AgendaItem) => {
    const date = parseISO(item.kind === 'deal' ? item.item.dueDate : item.item.dueDate)
    if (isPast(date) && !isToday(date)) overdue.push(item)
    else if (isToday(date)) today.push(item)
    else if (isTomorrow(date)) tomorrow.push(item)
    else if (isThisWeek(date, { locale: ptBR })) thisWeek.push(item)
    else upcoming.push(item)
  }

  for (const d of deals) push({ kind: 'deal', item: d })
  for (const t of tasks) push({ kind: 'task', item: t })

  return [
    { label: 'Atrasado', color: 'text-red-600 dark:text-red-400', dotColor: 'bg-red-500', items: overdue },
    { label: 'Hoje', color: 'text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500', items: today },
    { label: 'Amanhã', color: 'text-blue-600 dark:text-blue-400', dotColor: 'bg-blue-500', items: tomorrow },
    { label: 'Esta semana', color: 'text-indigo-600 dark:text-indigo-400', dotColor: 'bg-indigo-500', items: thisWeek },
    { label: 'Próximas datas', color: 'text-zinc-500', dotColor: 'bg-zinc-400', items: upcoming },
  ].filter(g => g.items.length > 0)
}

function ExportButton({
  kind,
  id,
  calendarEnabled,
}: {
  kind: 'deal' | 'task'
  id: string
  calendarEnabled: boolean
}) {
  const [state, setState] = useState<ExportState>('idle')
  const [, startTransition] = useTransition()

  if (!calendarEnabled) return null

  async function handleExport(e: React.MouseEvent) {
    e.stopPropagation()
    if (state !== 'idle') return
    setState('loading')
    try {
      const res = await fetch('/api/agenda/push-to-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, id }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          setState('done')
          return
        }
        throw new Error(data.error || 'Erro')
      }
      setState('done')
      if (data.htmlLink) {
        startTransition(() => {
          window.open(data.htmlLink, '_blank', 'noopener')
        })
      }
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleExport}
            className={cn(
              'shrink-0 flex items-center justify-center h-7 w-7 rounded-lg border transition-all duration-150',
              state === 'idle' && 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5',
              state === 'loading' && 'border-border text-muted-foreground cursor-wait',
              state === 'done' && 'border-green-500/30 text-green-500 bg-green-500/5 cursor-default',
              state === 'error' && 'border-red-500/30 text-red-500 bg-red-500/5',
            )}
          >
            {state === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {state === 'done' && <CheckCircle2 className="h-3.5 w-3.5" />}
            {state === 'error' && <AlertCircle className="h-3.5 w-3.5" />}
            {state === 'idle' && <CalendarDays className="h-3.5 w-3.5" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {state === 'idle' && 'Exportar para Google Calendar'}
          {state === 'loading' && 'Criando evento...'}
          {state === 'done' && 'Evento criado no Google Calendar'}
          {state === 'error' && 'Erro ao exportar. Tente novamente.'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function DealRow({
  deal,
  calendarEnabled,
  onClick,
}: {
  deal: Deal
  calendarEnabled: boolean
  onClick: () => void
}) {
  const date = parseISO(deal.dueDate)
  const overdue = isPast(date) && !isToday(date)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex items-center gap-2"
    >
      <button
        onClick={onClick}
        className="flex-1 text-left group flex items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-border/80 transition-all active:scale-[0.99] duration-150"
      >
        <div className={cn(
          'shrink-0 flex flex-col items-center justify-center w-11 sm:w-14 text-center',
          overdue ? 'text-red-500' : 'text-muted-foreground'
        )}>
          <span className="text-xs font-semibold tabular-nums leading-none">
            {format(date, 'HH:mm')}
          </span>
          <span className="text-[10px] mt-0.5 leading-none">
            {isToday(date) ? 'Hoje' : format(date, 'dd/MM', { locale: ptBR })}
          </span>
        </div>

        <div className="h-8 w-px bg-border shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {deal.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground min-w-0">
            <span className="truncate max-w-[80px] sm:max-w-none">{deal.stage.name}</span>
            {deal.contact && (
              <>
                <span className="shrink-0">·</span>
                <span className="flex items-center gap-1 truncate">
                  <User className="h-3 w-3 shrink-0" />
                  <span className="truncate">{deal.contact.name}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {deal.value != null && (
          <span className="hidden sm:inline shrink-0 text-sm font-semibold tabular-nums text-foreground/80">
            {deal.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </span>
        )}

        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
      </button>

      <ExportButton kind="deal" id={deal.id} calendarEnabled={calendarEnabled} />
    </motion.div>
  )
}

function TaskRow({
  task,
  calendarEnabled,
}: {
  task: AgendaTask
  calendarEnabled: boolean
}) {
  const date = parseISO(task.dueDate)
  const overdue = isPast(date) && !isToday(date)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex items-center gap-2"
    >
      <Link
        href={`/dashboard/tasks/task/${task.id}`}
        className="flex-1 group flex items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.03] hover:bg-indigo-500/[0.07] hover:border-indigo-500/30 transition-all active:scale-[0.99] duration-150"
      >
        <div className={cn(
          'shrink-0 flex flex-col items-center justify-center w-11 sm:w-14 text-center',
          overdue ? 'text-red-500' : 'text-muted-foreground'
        )}>
          <span className="text-xs font-semibold tabular-nums leading-none">
            {format(date, 'HH:mm')}
          </span>
          <span className="text-[10px] mt-0.5 leading-none">
            {isToday(date) ? 'Hoje' : format(date, 'dd/MM', { locale: ptBR })}
          </span>
        </div>

        <div className="h-8 w-px bg-border shrink-0" />

        <div className="flex-1 min-w-0 flex items-start gap-2">
          <CheckSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 text-indigo-500/70" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {task.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              {task.project && <span className="truncate">{task.project.name}</span>}
              {task.status && (
                <>
                  {task.project && <span>·</span>}
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: task.status.color }} />
                    {task.status.name}
                  </span>
                </>
              )}
              {task.assignee && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 truncate">
                    <User className="h-3 w-3 shrink-0" />
                    {task.assignee.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {task.priority !== 'NONE' && (
          <Flag className={cn('h-3.5 w-3.5 shrink-0', PRIORITY_COLORS[task.priority])} />
        )}

        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
      </Link>

      <ExportButton kind="task" id={task.id} calendarEnabled={calendarEnabled} />
    </motion.div>
  )
}

export function AgendaClient({
  deals,
  stages,
  contacts,
  tasks,
  googleCalendarEnabled,
  googleCalendarEmail,
}: Props) {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const groups = groupItems(deals, tasks)
  const totalItems = deals.length + tasks.length
  const { setConfig } = useAppBar()

  useEffect(() => {
    const subtitle = totalItems === 0
      ? 'Nenhum item'
      : `${deals.length > 0 ? `${deals.length} deal${deals.length > 1 ? 's' : ''}` : ''}${deals.length > 0 && tasks.length > 0 ? ' · ' : ''}${tasks.length > 0 ? `${tasks.length} tarefa${tasks.length > 1 ? 's' : ''}` : ''}`
    setConfig({ title: 'Agenda', subtitle })
    return () => setConfig(null)
  }, [totalItems, deals.length, tasks.length])

  function openDeal(deal: Deal) {
    setSelectedDeal(deal)
    setDialogOpen(true)
  }

  return (
    <AnimatedPageContainer>
      <div className="px-4 md:px-0">
      {/* Header — desktop only */}
      <div className="hidden lg:flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
            <p className="text-sm text-muted-foreground">
              {totalItems === 0
                ? 'Nenhum item agendado'
                : `${deals.length > 0 ? `${deals.length} deal${deals.length > 1 ? 's' : ''}` : ''}${deals.length > 0 && tasks.length > 0 ? ' · ' : ''}${tasks.length > 0 ? `${tasks.length} tarefa${tasks.length > 1 ? 's' : ''}` : ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {googleCalendarEnabled ? (
            <Button
              variant={showCalendar ? 'default' : 'outline'}
              size="sm"
              className="gap-2 h-8 text-xs"
              onClick={() => setShowCalendar(v => !v)}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {showCalendar ? 'Ocultar calendário' : 'Ver Google Calendar'}
            </Button>
          ) : (
            <Link href="/dashboard/settings/integrations/google-calendar">
              <Button variant="outline" size="sm" className="gap-2 h-8 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Conectar Google Calendar
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Google Calendar button */}
      <div className="lg:hidden mb-4 px-1">
        {googleCalendarEnabled ? (
          <Button variant={showCalendar ? 'default' : 'outline'} size="sm"
            className="gap-2 h-8 text-xs w-full" onClick={() => setShowCalendar(v => !v)}>
            <CalendarDays className="h-3.5 w-3.5" />
            {showCalendar ? 'Ocultar calendário' : 'Ver Google Calendar'}
          </Button>
        ) : (
          <Link href="/dashboard/settings/integrations/google-calendar">
            <Button variant="outline" size="sm" className="gap-2 h-8 text-xs text-muted-foreground w-full">
              <CalendarDays className="h-3.5 w-3.5" />
              Conectar Google Calendar
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </div>

      {/* Google Calendar embed panel */}
      {showCalendar && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mb-8"
        >
          {googleCalendarEnabled && googleCalendarEmail ? (
            <GoogleCalendarEmbed calendarEmail={googleCalendarEmail} />
          ) : (
            <GoogleCalendarEmbedPlaceholder />
          )}
        </motion.div>
      )}

      {/* Empty state */}
      {totalItems === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-base font-medium text-muted-foreground">Nenhum item agendado</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Defina uma data de follow-up em deals ou tarefas
          </p>
        </div>
      )}

      {/* Export hint */}
      {totalItems > 0 && googleCalendarEnabled && (
        <p className="text-xs text-muted-foreground/60 mb-4 flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3" />
          Clique no ícone de calendário em cada item para exportar ao Google Calendar
        </p>
      )}

      {/* Groups */}
      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn('h-2 w-2 rounded-full shrink-0', group.dotColor)} />
              <span className={cn('text-sm font-semibold', group.color)}>{group.label}</span>
              <span className="text-xs text-muted-foreground">({group.items.length})</span>
            </div>
            <div className="space-y-2">
              {group.items.map((item, i) => (
                <motion.div
                  key={item.kind === 'deal' ? `deal-${item.item.id}` : `task-${item.item.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  {item.kind === 'deal' ? (
                    <DealRow
                      deal={item.item}
                      calendarEnabled={googleCalendarEnabled}
                      onClick={() => openDeal(item.item)}
                    />
                  ) : (
                    <TaskRow
                      task={item.item}
                      calendarEnabled={googleCalendarEnabled}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <EditDealDialog
        deal={selectedDeal ? {
          id: selectedDeal.id,
          title: selectedDeal.title,
          value: selectedDeal.value,
          stageId: selectedDeal.stageId,
          contactId: selectedDeal.contactId,
          dueDate: selectedDeal.dueDate,
        } : null}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        stages={stages}
        contacts={contacts}
        onSuccess={() => window.location.reload()}
      />
      </div>
    </AnimatedPageContainer>
  )
}
