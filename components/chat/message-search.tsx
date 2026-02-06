'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MessageSearchProps {
  messages: Array<{ id: string; text: string }>
  onClose: () => void
  onNavigate: (messageId: string) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function MessageSearch({ messages, onClose, onNavigate, containerRef }: MessageSearchProps) {
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<string[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

  // Buscar matches quando query mudar (com debounce)
  useEffect(() => {
    if (!query.trim()) {
      setMatches([])
      setCurrentMatchIndex(0)
      return
    }

    const timer = setTimeout(() => {
      const lowerQuery = query.toLowerCase()
      const matchedIds = messages
        .filter(msg => msg.text.toLowerCase().includes(lowerQuery))
        .map(msg => msg.id)

      setMatches(matchedIds)
      setCurrentMatchIndex(matchedIds.length > 0 ? 0 : -1)

      // Navegar para o primeiro match
      if (matchedIds.length > 0) {
        onNavigate(matchedIds[0])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, messages, onNavigate])

  const goToPrevious = useCallback(() => {
    if (matches.length === 0) return
    const newIndex = currentMatchIndex > 0 ? currentMatchIndex - 1 : matches.length - 1
    setCurrentMatchIndex(newIndex)
    onNavigate(matches[newIndex])
  }, [matches, currentMatchIndex, onNavigate])

  const goToNext = useCallback(() => {
    if (matches.length === 0) return
    const newIndex = currentMatchIndex < matches.length - 1 ? currentMatchIndex + 1 : 0
    setCurrentMatchIndex(newIndex)
    onNavigate(matches[newIndex])
  }, [matches, currentMatchIndex, onNavigate])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter') {
        if (e.shiftKey) {
          goToPrevious()
        } else {
          goToNext()
        }
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevious, goToNext, onClose])

  return (
    <div className="h-[56px] px-4 border-b flex items-center gap-3 bg-white dark:bg-zinc-950 flex-shrink-0 shadow-sm">
      {/* Search icon */}
      <Search className="h-4 w-4 text-[#8696a0] flex-shrink-0" />

      {/* Input */}
      <Input
        autoFocus
        placeholder="Buscar na conversa..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 h-9 border-0 bg-transparent focus-visible:ring-0 text-sm placeholder:text-[#8696a0]"
      />

      {/* Match counter */}
      {query && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {matches.length > 0 ? (
            <span className="text-xs text-[#667781] tabular-nums whitespace-nowrap">
              {currentMatchIndex + 1} de {matches.length}
            </span>
          ) : (
            <span className="text-xs text-[#667781]">Nenhum resultado</span>
          )}

          {/* Navigation buttons */}
          {matches.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPrevious}
                className="h-7 w-7 p-0"
                title="Anterior (Shift+Enter)"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNext}
                className="h-7 w-7 p-0"
                title="Próximo (Enter)"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Close button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="h-7 w-7 p-0 flex-shrink-0"
        title="Fechar (Esc)"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
