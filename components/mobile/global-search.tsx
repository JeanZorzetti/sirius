'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, User, Briefcase, MessageCircle, CheckSquare, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface SearchResult {
  contacts: Array<{ id: string; name: string; company?: string }>
  deals: Array<{ id: string; title: string; value?: number; stageName?: string }>
  conversations: Array<{ id: string; contactName: string; lastMessage?: string }>
  tasks: Array<{ id: string; title: string; dueDate?: string }>
}

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setResults(null)
    }
  }, [open])

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null)
      return
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await fetch(`/api/search/global?q=${encodeURIComponent(query)}`)
          if (res.ok) setResults(await res.json())
        } catch {}
      })
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  function navigate(href: string) {
    onClose()
    router.push(href)
  }

  const total = results
    ? results.contacts.length + results.deals.length + results.conversations.length + results.tasks.length
    : 0

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="top-[20%] translate-y-0 gap-0 overflow-hidden rounded-2xl p-0"
      >
        <DialogTitle className="sr-only">Busca global</DialogTitle>
      <div className="flex max-h-[60vh] flex-col">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
          {isPending ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar contatos, deals, conversas..."
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/60"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {!query && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Digite para buscar</p>
            </div>
          )}

          {query && !isPending && results && total === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="text-sm text-muted-foreground">Nenhum resultado para &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {results && results.contacts.length > 0 && (
            <section>
              <div className="px-4 pb-1 pt-4">
                <span className="text-mobile-section">Contatos</span>
              </div>
              {results.contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/dashboard/contacts/${c.id}`)}
                  className="list-item-card w-full text-left"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/10">
                    <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    {c.company && <p className="text-mobile-meta truncate">{c.company}</p>}
                  </div>
                </button>
              ))}
            </section>
          )}

          {results && results.deals.length > 0 && (
            <section>
              <div className="px-4 pb-1 pt-4">
                <span className="text-mobile-section">Deals</span>
              </div>
              {results.deals.map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate(`/dashboard/deals/${d.id}`)}
                  className="list-item-card w-full text-left"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                    <Briefcase className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <p className="text-mobile-meta truncate">
                      {d.stageName}
                      {d.value ? ` · R$ ${Number(d.value).toLocaleString('pt-BR')}` : ''}
                    </p>
                  </div>
                </button>
              ))}
            </section>
          )}

          {results && results.conversations.length > 0 && (
            <section>
              <div className="px-4 pb-1 pt-4">
                <span className="text-mobile-section">Conversas</span>
              </div>
              {results.conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/dashboard/chat?conv=${c.id}`)}
                  className="list-item-card w-full text-left"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                    <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.contactName}</p>
                    {c.lastMessage && <p className="text-mobile-meta truncate">{c.lastMessage}</p>}
                  </div>
                </button>
              ))}
            </section>
          )}

          {results && results.tasks.length > 0 && (
            <section>
              <div className="px-4 pb-1 pt-4">
                <span className="text-mobile-section">Tarefas</span>
              </div>
              {results.tasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/dashboard/tasks`)}
                  className="list-item-card w-full text-left"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                    <CheckSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    {t.dueDate && <p className="text-mobile-meta">{new Date(t.dueDate).toLocaleDateString('pt-BR')}</p>}
                  </div>
                </button>
              ))}
            </section>
          )}

          <div className="h-8" />
        </div>
      </div>
      </DialogContent>
    </Dialog>
  )
}
