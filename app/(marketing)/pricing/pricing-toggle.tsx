'use client'

import { useState } from 'react'

interface PricingToggleProps {
  children: (isAnnual: boolean) => React.ReactNode
}

export function PricingToggle({ children }: PricingToggleProps) {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <>
      <div className="flex items-center justify-center gap-3 mt-10">
        <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
          Mensal
        </span>
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
            isAnnual ? 'bg-primary' : 'bg-muted'
          }`}
          aria-label="Alternar entre mensal e anual"
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
              isAnnual ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
          Anual
        </span>
        {isAnnual && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full">
            20% OFF
          </span>
        )}
      </div>
      {children(isAnnual)}
    </>
  )
}
