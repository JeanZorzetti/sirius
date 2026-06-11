'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { LOST_REASONS } from './types'

/** Asks why a deal dragged into "Perdido" was lost. */
export function LostReasonDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  const tCommon = useTranslations('common')
  const [reasonInput, setReasonInput] = useState('')

  const handleConfirm = () => {
    const reason = reasonInput.trim()
    setReasonInput('')
    onConfirm(reason)
  }

  const handleCancel = () => {
    setReasonInput('')
    onCancel()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o: boolean) => { if (!o) handleCancel() }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Por que este negócio foi perdido?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="flex flex-wrap gap-2">
            {LOST_REASONS.map(reason => (
              <button
                key={reason}
                type="button"
                onClick={() => setReasonInput(reason)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm border transition-all duration-200",
                  reasonInput === reason
                    ? "bg-destructive/10 text-destructive border-destructive/40 font-medium"
                    : "bg-muted/50 text-muted-foreground border-border/60 hover:border-foreground/30 hover:text-foreground"
                )}
              >
                {reason}
              </button>
            ))}
          </div>

          <Input
            placeholder="Ou descreva outro motivo..."
            value={reasonInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReasonInput(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && reasonInput.trim() && handleConfirm()}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={handleCancel}>
            {tCommon('buttons.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reasonInput.trim()}
          >
            {tCommon('buttons.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
