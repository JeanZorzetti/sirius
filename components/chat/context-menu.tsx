'use client'

import { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface ContextMenuItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onSelect: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
  separator?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

/**
 * Floating context menu positioned at (x, y).
 * Auto-flips when near viewport edges and closes on outside click / Escape.
 * Renders in a portal so it escapes any overflow:hidden parent.
 */
export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x, top: y, opacity: 0 })

  // Position with edge-flipping after first render measures the node
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    let left = x
    let top = y
    if (left + rect.width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - rect.width - 8)
    if (top + rect.height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - rect.height - 8)
    setPos({ left, top, opacity: 1 })
  }, [x, y])

  // Outside click + Escape close
  useEffect(() => {
    function onPointer(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    // Defer so the right-click that opened us doesn't immediately close it
    const t = setTimeout(() => {
      document.addEventListener('mousedown', onPointer)
      document.addEventListener('contextmenu', onPointer)
      window.addEventListener('keydown', onKey)
    }, 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('contextmenu', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  if (typeof window === 'undefined') return null

  return createPortal(
    <div
      ref={ref}
      role="menu"
      style={{ position: 'fixed', left: pos.left, top: pos.top, opacity: pos.opacity }}
      className="z-50 min-w-[200px] rounded-lg border border-border bg-popover py-1 shadow-lg shadow-black/10 dark:shadow-black/40 animate-in fade-in-0 zoom-in-95 duration-100"
    >
      {items.map((item, i) => {
        if (item.separator) {
          return <div key={item.id || `sep-${i}`} className="my-1 h-px bg-border/60" />
        }
        const Icon = item.icon
        return (
          <button
            key={item.id}
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return
              item.onSelect()
              onClose()
            }}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-left transition-colors',
              'focus-visible:outline-none focus-visible:bg-accent',
              item.disabled
                ? 'opacity-50 cursor-not-allowed'
                : item.variant === 'danger'
                  ? 'text-destructive hover:bg-destructive/10'
                  : 'text-foreground hover:bg-accent'
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            <span className="flex-1 truncate">{item.label}</span>
          </button>
        )
      })}
    </div>,
    document.body
  )
}

interface UseContextMenuOptions {
  onOpen?: () => void
}

export function useContextMenu(_opts: UseContextMenuOptions = {}) {
  const [state, setState] = useState<{ x: number; y: number } | null>(null)

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState({ x: e.clientX, y: e.clientY })
  }

  const close = () => setState(null)

  return { state, onContextMenu, close }
}
