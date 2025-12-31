'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show prompt only if user hasn't dismissed it before
      const dismissed = localStorage.getItem('pwa-prompt-dismissed')
      if (!dismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA installed')
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  if (!showPrompt || !deferredPrompt) return null

  return (
    <div className={cn(
      "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50",
      "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-2xl",
      "border border-white/20 backdrop-blur-xl p-4",
      "animate-in slide-in-from-bottom-5 duration-500"
    )}>
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <Download className="h-6 w-6" />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-bold text-lg">Instalar Sirius CRM</h3>
            <p className="text-sm text-white/90 mt-1">
              Adicione à tela inicial para acesso rápido e experiência offline
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              size="sm"
              className="bg-white text-indigo-600 hover:bg-white/90 font-medium"
            >
              Instalar
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              Agora não
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
