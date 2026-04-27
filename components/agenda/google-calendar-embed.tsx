'use client'

import { motion } from 'framer-motion'
import { CalendarDays, ExternalLink, Plus, Clock, Grid3x3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  calendarEmail: string
}

const QUICK_LINKS = [
  {
    label: 'Hoje',
    icon: Clock,
    href: 'https://calendar.google.com/calendar/r/day',
  },
  {
    label: 'Semana',
    icon: Grid3x3,
    href: 'https://calendar.google.com/calendar/r/week',
  },
  {
    label: 'Mês',
    icon: CalendarDays,
    href: 'https://calendar.google.com/calendar/r/month',
  },
  {
    label: 'Novo evento',
    icon: Plus,
    href: 'https://calendar.google.com/calendar/r/eventedit',
  },
]

export function GoogleCalendarEmbed({ calendarEmail }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Google Calendar</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{calendarEmail}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => window.open('https://calendar.google.com/calendar/r', '_blank', 'noopener')}
        >
          Abrir Google Calendar
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>

      {/* Quick access grid */}
      <div className="grid grid-cols-4 divide-x divide-border">
        {QUICK_LINKS.map(({ label, icon: Icon, href }) => (
          <button
            key={label}
            onClick={() => window.open(href, '_blank', 'noopener')}
            className="flex flex-col items-center justify-center gap-2 py-5 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-150 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-150">
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2.5 border-t border-border bg-muted/20">
        <p className="text-[11px] text-muted-foreground/60 text-center">
          O Google Calendar não permite embed direto — use os atalhos acima para abrir em nova aba
        </p>
      </div>
    </motion.div>
  )
}

export function GoogleCalendarEmbedPlaceholder() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 flex flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
        <CalendarDays className="h-5 w-5 text-muted-foreground/50" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">Google Calendar não conectado</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Conecte em{' '}
          <a
            href="/dashboard/settings/integrations/google-calendar"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Configurações &rarr; Integrações
          </a>{' '}
          para ver os atalhos aqui.
        </p>
      </div>
    </div>
  )
}
