'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface QuickReply {
  id: string
  shortcut: string
  title: string
  content: string
  category: string | null
}

interface QuickReplyPickerProps {
  query: string // Text after "/" e.g., "sau" for "/sau"
  onSelect: (content: string) => void
  onClose: () => void
  position: { top: number; left: number }
  contact: { name: string | null; phone: string | null }
  userName: string
}

const CATEGORY_COLORS: Record<string, string> = {
  saudacao: 'bg-blue-500/10 text-blue-600',
  fechamento: 'bg-emerald-500/10 text-emerald-600',
  followup: 'bg-amber-500/10 text-amber-600',
  default: 'bg-gray-500/10 text-gray-600',
}

export function QuickReplyPicker({
  query,
  onSelect,
  onClose,
  position,
  contact,
  userName,
}: QuickReplyPickerProps) {
  const tCommon = useTranslations('common')
  const t = useTranslations('components.chat')
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch quick replies
  useEffect(() => {
    const fetchQuickReplies = async () => {
      try {
        const response = await fetch('/api/whatsapp/quick-replies')
        if (response.ok) {
          const data = await response.json()
          setQuickReplies(data)
        }
      } catch (error) {
        console.error('Error fetching quick replies:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchQuickReplies()
  }, [])

  // Filter by query
  const filtered = quickReplies.filter(qr => {
    const searchText = query.toLowerCase()
    return (
      qr.shortcut.toLowerCase().includes(searchText) ||
      qr.title.toLowerCase().includes(searchText) ||
      qr.content.toLowerCase().includes(searchText)
    )
  })

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query, filtered.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filtered, selectedIndex, onClose])

  // Resolve placeholders
  const resolvePlaceholders = (content: string): string => {
    const contactName = contact.name || 'Cliente'
    const contactPhone = contact.phone || ''
    const today = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    return content
      .replace(/\{contato\.nome\}/g, contactName)
      .replace(/\{contato\.telefone\}/g, contactPhone)
      .replace(/\{usuario\.nome\}/g, userName)
      .replace(/\{data\}/g, today)
  }

  const handleSelect = (qr: QuickReply) => {
    const resolvedContent = resolvePlaceholders(qr.content)
    onSelect(resolvedContent)
  }

  if (loading) {
    return (
      <div
        ref={containerRef}
        className="absolute z-50 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 p-3"
        style={{ bottom: position.top + 8, left: position.left }}
      >
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{tCommon('buttons.loading')}</span>
        </div>
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div
        ref={containerRef}
        className="absolute z-50 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 p-3"
        style={{ bottom: position.top + 8, left: position.left }}
      >
        <div className="text-sm text-gray-500">
          Nenhuma resposta rápida encontrada para "{query}"
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-50 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 overflow-hidden min-w-[320px] max-w-[480px]"
      style={{ bottom: position.top + 8, left: position.left }}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#00a884]" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {t('quickReply')}
          </span>
          <span className="text-xs text-gray-500 ml-auto">
            {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[280px] overflow-y-auto">
        {filtered.map((qr, index) => {
          const categoryColor = CATEGORY_COLORS[qr.category || 'default'] || CATEGORY_COLORS.default

          return (
            <button
              key={qr.id}
              onClick={() => handleSelect(qr)}
              className={cn(
                'w-full text-left px-3 py-2.5 transition-colors border-b border-gray-100 dark:border-zinc-800 last:border-b-0',
                index === selectedIndex
                  ? 'bg-[#00a884]/5 border-l-2 border-l-[#00a884]'
                  : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <code className="text-xs font-mono font-semibold text-[#00a884] bg-[#00a884]/10 px-1.5 py-0.5 rounded">
                  {qr.shortcut}
                </code>
                {qr.category && (
                  <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', categoryColor)}>
                    {qr.category}
                  </span>
                )}
              </div>
              <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 mb-0.5">
                {qr.title}
              </p>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight">
                {resolvePlaceholders(qr.content)}
              </p>
            </button>
          )
        })}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
        <p className="text-[10px] text-gray-500">
          <kbd className="px-1 py-0.5 bg-white dark:bg-zinc-700 rounded border border-gray-300 dark:border-zinc-600">
            ↑↓
          </kbd>{' '}
          navegar •{' '}
          <kbd className="px-1 py-0.5 bg-white dark:bg-zinc-700 rounded border border-gray-300 dark:border-zinc-600">
            Enter
          </kbd>{' '}
          selecionar •{' '}
          <kbd className="px-1 py-0.5 bg-white dark:bg-zinc-700 rounded border border-gray-300 dark:border-zinc-600">
            Esc
          </kbd>{' '}
          fechar
        </p>
      </div>
    </div>
  )
}
