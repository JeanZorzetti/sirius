'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'

export interface FilterSection {
  id: string
  label: string
  content: React.ReactNode
}

interface FiltersSheetProps {
  open: boolean
  onClose: () => void
  sections: FilterSection[]
  activeCount?: number
  onClear?: () => void
  onApply?: () => void
  applyLabel?: string
}

export function FiltersSheet({
  open,
  onClose,
  sections,
  activeCount = 0,
  onClear,
  onApply,
  applyLabel,
}: FiltersSheetProps) {
  function handleApply() {
    onApply?.()
    onClose()
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-3">
          <DrawerTitle>Filtros</DrawerTitle>
          {onClear && activeCount > 0 && (
            <button
              onClick={onClear}
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 active:opacity-60"
            >
              Limpar tudo
            </button>
          )}
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          {sections.map((section, i) => (
            <div key={section.id} className={i > 0 ? 'border-t border-border/40' : ''}>
              <div className="px-4 py-3">
                <p className="text-mobile-section mb-3">{section.label}</p>
                {section.content}
              </div>
            </div>
          ))}
          <div className="h-4" />
        </div>

        <div className="border-t border-border/40 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
          <Button onClick={handleApply} className="w-full" size="lg">
            {applyLabel ?? (activeCount > 0 ? `Aplicar (${activeCount} ativos)` : 'Aplicar')}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
