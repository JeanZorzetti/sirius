'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertCircle, Bell, CheckCircle2, Clock } from 'lucide-react'

/** Status banner shown under the follow-up datetime field. */
export function FollowUpBanner({
    dueDateValue,
    dueDateNote,
    onComplete,
}: {
    dueDateValue: string
    dueDateNote: string
    onComplete: () => void
}) {
    const due = new Date(dueDateValue)
    const now = new Date()
    const diffMs = due.getTime() - now.getTime()
    const diffH = diffMs / (1000 * 60 * 60)
    const diffD = Math.floor(Math.abs(diffH) / 24)
    const isOverdue = diffMs < 0
    const isToday = !isOverdue && diffH < 24
    const timeLabel = isOverdue
        ? diffD === 0 ? 'há algumas horas' : `há ${diffD} dia${diffD > 1 ? 's' : ''}`
        : diffH < 1 ? 'em menos de 1 hora'
        : diffH < 24 ? `em ${Math.round(diffH)}h`
        : `em ${diffD} dia${diffD > 1 ? 's' : ''}`
    const formattedDate = format(due, "dd/MM 'às' HH:mm", { locale: ptBR })

    return (
        <div className={`flex items-start gap-3 rounded-lg border px-3.5 py-3 text-sm transition-all ${
            isOverdue
                ? 'border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30'
                : isToday
                ? 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30'
                : 'border-indigo-200 bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-950/30'
        }`}>
            <div className="mt-0.5 shrink-0">
                {isOverdue
                    ? <AlertCircle className="w-4 h-4 text-red-500" />
                    : isToday
                    ? <Clock className="w-4 h-4 text-amber-500" />
                    : <Bell className="w-4 h-4 text-indigo-500" />
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className={`font-medium leading-none mb-0.5 ${
                    isOverdue ? 'text-red-700 dark:text-red-400'
                    : isToday ? 'text-amber-700 dark:text-amber-400'
                    : 'text-indigo-700 dark:text-indigo-400'
                }`}>
                    {isOverdue ? 'Follow-up atrasado' : isToday ? 'Follow-up hoje' : 'Follow-up agendado'}
                    <span className="ml-2 font-normal text-xs opacity-80">{formattedDate} · {timeLabel}</span>
                </p>
                {dueDateNote && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">{dueDateNote}</p>
                )}
            </div>
            <button
                type="button"
                title="Marcar como concluído"
                onClick={onComplete}
                className="shrink-0 text-zinc-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
                <CheckCircle2 className="w-4 h-4" />
            </button>
        </div>
    )
}
