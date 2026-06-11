'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    ArrowLeftRight, ArrowRight, CheckCircle2, DollarSign, MessageSquare, Sparkles, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DealActivity, DealNote } from './types'

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

export function NoteItem({ note, onDelete }: { note: DealNote; onDelete: () => void }) {
    return (
        <div className="flex gap-3 group">
            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                {getInitials(note.user?.name || 'User')}
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{note.user?.name || 'Usuário'}</span>
                        <span className="text-xs text-zinc-500">{format(new Date(note.createdAt), "dd MMM 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500" onClick={onDelete}>
                        <Trash2 className="w-3 h-3" />
                    </Button>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg text-sm text-zinc-700 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800/50">
                    {note.content}
                </div>
            </div>
        </div>
    )
}

export function ActivityItem({ activity }: { activity: DealActivity }) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'STAGE_CHANGE': return <ArrowRight className="w-3 h-3" />
            case 'PIPELINE_CHANGE': return <ArrowLeftRight className="w-3 h-3" />
            case 'VALUE_CHANGE': return <DollarSign className="w-3 h-3" />
            case 'NOTE_ADDED': return <MessageSquare className="w-3 h-3" />
            case 'CLOSING_ADDED': return <DollarSign className="w-3 h-3" />
            case 'CLOSING_REMOVED': return <Trash2 className="w-3 h-3" />
            case 'CREATE': return <Sparkles className="w-3 h-3" />
            default: return <CheckCircle2 className="w-3 h-3" />
        }
    }

    const getBgColor = (type: string) => {
        switch (type) {
            case 'STAGE_CHANGE': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            case 'PIPELINE_CHANGE': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
            case 'VALUE_CHANGE': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            case 'NOTE_ADDED': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
            case 'CLOSING_ADDED': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
            case 'CLOSING_REMOVED': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            default: return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
        }
    }

    return (
        <div className="flex gap-4 relative">
            {/* Timeline Line */}
            <div className="absolute left-[15px] top-8 bottom-[-24px] w-px bg-zinc-100 dark:bg-zinc-800 last:hidden" />

            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10 ${getBgColor(activity.type)}`}>
                {getIcon(activity.type)}
            </div>

            <div className="pt-1.5 pb-2">
                <p className="text-sm text-zinc-900 dark:text-zinc-100">
                    {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                    <span>{activity.user?.name || 'Sistema'}</span>
                    <span>•</span>
                    <span className="capitalize">{format(new Date(activity.createdAt), "dd MMM, HH:mm", { locale: ptBR })}</span>
                </div>
            </div>
        </div>
    )
}
