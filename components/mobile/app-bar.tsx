'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search } from 'lucide-react'
import { useAppBar } from './app-bar-context'
import { GlobalSearch } from './global-search'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function MobileAppBar() {
  const { config } = useAppBar()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)

  if (!config) return null

  const { title, subtitle, showBack, onBack, showSearch, primaryAction, filters } = config

  function handleBack() {
    if (onBack) onBack()
    else router.back()
  }

  return (
    <>
      <header className="glass-header sticky top-0 z-30 lg:hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex h-14 [@media(max-height:500px)]:h-10 items-center gap-2 px-3">
          {showBack && (
            <button
              onClick={handleBack}
              className="touch-target flex shrink-0 items-center justify-center rounded-xl text-foreground/70 transition-colors active:bg-muted/50"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <div className="min-w-0 flex-1">
            <h1 className={cn('text-mobile-h1 truncate', showBack && 'text-[1.125rem]')}>{title}</h1>
            {subtitle && (
              <p className="text-mobile-meta truncate">{subtitle}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {showSearch && (
              <button
                onClick={() => setSearchOpen(true)}
                className="touch-target flex items-center justify-center rounded-xl text-foreground/70 transition-colors active:bg-muted/50"
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                className="touch-target flex items-center justify-center rounded-xl text-foreground/70 transition-colors active:bg-muted/50"
                aria-label={primaryAction.label}
              >
                {primaryAction.icon}
              </button>
            )}
          </div>
        </div>

        {filters && (
          <div className="overflow-x-auto px-3 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-2 snap-x snap-mandatory">
              {filters}
            </div>
          </div>
        )}
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
