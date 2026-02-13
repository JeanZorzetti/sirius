'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, X } from 'lucide-react'

export function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        if (window.scrollY > 500 && !isDismissed) {
          setIsVisible(true)
        } else if (window.scrollY <= 500) {
          setIsVisible(false)
        }
        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isDismissed])

  const handleDismiss = () => {
    setIsDismissed(true)
    setIsVisible(false)
  }

  if (!isVisible || isDismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden animate-slide-up">
      <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl">
        <div className="relative p-4">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4 text-zinc-400" />
          </button>

          {/* Content */}
          <div className="pr-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-400">Plano gratuito disponível</span>
            </div>
            <p className="text-sm font-semibold text-white mb-3">
              Comece a vender mais hoje
            </p>
            <Link
              href="/register"
              className="flex items-center justify-center h-11 w-full rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
            >
              Criar Conta Grátis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <p className="text-xs text-center text-zinc-500 mt-2">
              Sem cartão • Configure em 5min
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
