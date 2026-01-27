'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ReturnToTourButton() {
  const router = useRouter()
  const pathname = usePathname()
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Only show if we're NOT on dashboard and have onboarding param
    const urlParams = new URLSearchParams(window.location.search)
    const isOnboarding = urlParams.get('onboarding') === 'true'
    const isOnDashboard = pathname === '/dashboard'

    setShow(isOnboarding && !isOnDashboard)
  }, [pathname])

  const handleReturn = () => {
    router.push('/dashboard?onboarding=true')
  }

  if (!show) return null

  return (
    <div className="fixed bottom-6 left-6 z-40 animate-in slide-in-from-left-4 fade-in">
      <Button
        onClick={handleReturn}
        size="lg"
        className={cn(
          "bg-gradient-to-r from-indigo-500 to-purple-600",
          "hover:from-indigo-600 hover:to-purple-700",
          "text-white shadow-2xl shadow-indigo-500/30",
          "border-0 gap-2 pr-6"
        )}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-semibold">Voltar para o Tour</span>
        <Sparkles className="w-4 h-4 ml-1 animate-pulse" />
      </Button>
    </div>
  )
}
