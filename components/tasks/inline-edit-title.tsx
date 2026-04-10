'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineEditTitleProps {
  value: string
  onSave: (newValue: string) => Promise<void>
  className?: string
  inputClassName?: string
  placeholder?: string
  disabled?: boolean
}

export function InlineEditTitle({
  value,
  onSave,
  className,
  inputClassName,
  placeholder = 'Nome...',
  disabled = false,
}: InlineEditTitleProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = async () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === value) {
      setEditing(false)
      setDraft(value)
      return
    }
    setSaving(true)
    try {
      await onSave(trimmed)
      setEditing(false)
    } catch {
      setDraft(value)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') cancel()
          }}
          disabled={saving}
          placeholder={placeholder}
          className={cn(
            'min-w-0 flex-1 rounded-md border border-primary/40 bg-background px-2 py-0.5 text-sm font-medium',
            'focus:outline-none focus:ring-2 focus:ring-primary/30',
            inputClassName
          )}
        />
        <button
          onClick={commit}
          disabled={saving}
          className="flex h-6 w-6 items-center justify-center rounded text-emerald-500 hover:bg-emerald-500/10 transition-colors"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={cancel}
          disabled={saving}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn('group flex items-center gap-1.5 min-w-0', className)}
    >
      <span className="truncate">{value}</span>
      {!disabled && (
        <button
          onClick={() => setEditing(true)}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:text-muted-foreground hover:bg-muted/50"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
