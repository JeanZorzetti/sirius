'use client'

import { AlertTriangle, Clock, FileText as FileTextIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface WindowStatus {
  open: boolean
  minutesRemaining: number | null
}

/** WABA 24h-window banners: closed (templates only) and closing-soon hint. */
export function WindowBanners({
  windowStatus,
  onOpenTemplate,
}: {
  windowStatus: WindowStatus | null
  onOpenTemplate: () => void
}) {
  if (!windowStatus) return null

  if (!windowStatus.open) {
    return (
      <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-900/50 flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-[12.5px] text-amber-800 dark:text-amber-300 flex-1 leading-snug">
          Janela de 24h fechada — só é possível iniciar com um <strong>template aprovado</strong>.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 gap-1 shrink-0"
          onClick={onOpenTemplate}
        >
          <FileTextIcon className="h-3 w-3" />
          Escolher template
        </Button>
      </div>
    )
  }

  if (windowStatus.minutesRemaining !== null && windowStatus.minutesRemaining < 60) {
    return (
      <div className="px-4 py-1.5 bg-amber-50/50 dark:bg-amber-950/20 border-t border-amber-200/60 dark:border-amber-900/30 flex items-center gap-2">
        <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-tight">
          Janela 24h fecha em {windowStatus.minutesRemaining} min — depois disso só templates.
        </p>
      </div>
    )
  }

  return null
}
