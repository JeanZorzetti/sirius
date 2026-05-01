'use client'
import { Calendar, List } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type CalendarView = 'calendar' | 'list'

export function ViewToggle({ view, onChange }: { view: CalendarView; onChange: (v: CalendarView) => void }) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      <Button
        variant="ghost"
        size="sm"
        className={`rounded-none gap-1.5 px-3 h-8 ${view === 'calendar' ? 'bg-purple-500/10 text-purple-400' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => onChange('calendar')}
      >
        <Calendar className="h-3.5 w-3.5" /> Calendário
      </Button>
      <div className="w-px bg-border" />
      <Button
        variant="ghost"
        size="sm"
        className={`rounded-none gap-1.5 px-3 h-8 ${view === 'list' ? 'bg-purple-500/10 text-purple-400' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => onChange('list')}
      >
        <List className="h-3.5 w-3.5" /> Lista
      </Button>
    </div>
  )
}
