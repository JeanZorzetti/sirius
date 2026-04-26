'use client'
import { createContext, useContext, useState, useCallback } from 'react'

export interface AppBarConfig {
  title: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  showSearch?: boolean
  primaryAction?: {
    icon: React.ReactNode
    onClick: () => void
    label: string
  }
  filters?: React.ReactNode
}

interface AppBarContextValue {
  config: AppBarConfig | null
  setConfig: (config: AppBarConfig | null) => void
}

const AppBarContext = createContext<AppBarContextValue>({
  config: null,
  setConfig: () => {},
})

export function AppBarProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppBarConfig | null>(null)
  const set = useCallback((c: AppBarConfig | null) => setConfig(c), [])
  return (
    <AppBarContext.Provider value={{ config, setConfig: set }}>
      {children}
    </AppBarContext.Provider>
  )
}

export function useAppBar() {
  return useContext(AppBarContext)
}
