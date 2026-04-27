'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, ExternalLink, Maximize2, Minimize2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  calendarEmail: string
}

export function GoogleCalendarEmbed({ calendarEmail }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [key, setKey] = useState(0)

  const encodedEmail = encodeURIComponent(calendarEmail)
  const src = `https://calendar.google.com/calendar/embed?src=${encodedEmail}&ctz=America%2FSao_Paulo&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&mode=WEEK&hl=pt_BR&wkst=1`

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300',
        expanded ? 'shadow-lg' : 'shadow-sm'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.1)]">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">Google Calendar</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{calendarEmail}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setKey(k => k + 1)}
            title="Atualizar"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => window.open(`https://calendar.google.com/calendar/r`, '_blank')}
            title="Abrir no Google Calendar"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(e => !e)}
            title={expanded ? 'Recolher' : 'Expandir'}
          >
            {expanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Iframe */}
      <AnimatePresence initial={false}>
        <motion.div
          key={expanded ? 'expanded' : 'collapsed'}
          initial={{ height: expanded ? 360 : 520 }}
          animate={{ height: expanded ? 600 : 360 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="w-full"
        >
          <iframe
            key={key}
            src={src}
            className="w-full h-full border-0"
            title="Google Calendar"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </motion.div>
      </AnimatePresence>
    </div>
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
          para ver seu calendário aqui.
        </p>
      </div>
    </div>
  )
}
