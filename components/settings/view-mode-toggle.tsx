'use client'

import { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type ViewMode = 'expanded' | 'compact'

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={value === 'expanded' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onChange('expanded')}
              className="h-7 w-7 p-0"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Vista Expandida</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={value === 'compact' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onChange('compact')}
              className="h-7 w-7 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Vista Compacta</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
