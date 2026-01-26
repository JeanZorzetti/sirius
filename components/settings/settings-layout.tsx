'use client'

import { useState, useMemo } from 'react'
import { Search, Settings, User, Users, Bell, Key, Webhook, Zap, BookOpen, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SettingsTab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: string
  description: string
}

const tabs: SettingsTab[] = [
  {
    id: 'general',
    label: 'Geral',
    icon: Settings,
    href: '/dashboard/settings',
    description: 'Perfil e configurações da conta',
  },
  {
    id: 'onboarding',
    label: 'Primeiros Passos',
    icon: Sparkles,
    href: '/dashboard/settings#onboarding',
    description: 'Tour interativo e configuração inicial',
  },
  {
    id: 'team',
    label: 'Time',
    icon: Users,
    href: '/dashboard/settings/team',
    description: 'Gerencie membros e convites',
  },
  {
    id: 'notifications',
    label: 'Notificações',
    icon: Bell,
    href: '/dashboard/settings/notifications',
    description: 'Preferências de notificação',
  },
  {
    id: 'api',
    label: 'API Keys',
    icon: Key,
    href: '/dashboard/settings/api',
    description: 'Chaves de API para integrações',
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    icon: Webhook,
    href: '/dashboard/settings/webhooks',
    badge: 'PRO',
    description: 'Configure webhooks para eventos',
  },
  {
    id: 'integrations',
    label: 'Integrações',
    icon: Zap,
    href: '/dashboard/settings/integrations',
    badge: 'PRO',
    description: 'N8N, WhatsApp e Google Calendar',
  },
  {
    id: 'help',
    label: 'Ajuda',
    icon: BookOpen,
    href: '/help',
    description: 'Central de ajuda e suporte',
  },
]

interface SettingsLayoutProps {
  children: React.ReactNode
  organizationName?: string
}

export function SettingsLayout({ children, organizationName }: SettingsLayoutProps) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')

  // Filter tabs based on search query
  const filteredTabs = useMemo(() => {
    if (!searchQuery) return tabs
    const query = searchQuery.toLowerCase()
    return tabs.filter(
      (tab) =>
        tab.label.toLowerCase().includes(query) ||
        tab.description.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Determine active tab
  const activeTabId = useMemo(() => {
    const currentTab = tabs.find((tab) => {
      if (tab.href === '/dashboard/settings') {
        return pathname === '/dashboard/settings'
      }
      return pathname?.startsWith(tab.href)
    })
    return currentTab?.id || 'general'
  }, [pathname])

  return (
    <div className="flex-1 flex h-full">
      {/* Sidebar - Navegação Lateral */}
      <aside className="w-64 border-r border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-white/[0.01] backdrop-blur-xl p-6 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Configurações</h2>
          {organizationName && (
            <p className="text-xs text-zinc-500">{organizationName}</p>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Buscar configuração..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-500"
          />
        </div>

        {/* Navigation Tabs */}
        <nav className="space-y-1">
          {filteredTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTabId === tab.id
            const isExternal = tab.href.startsWith('/help')

            const content = (
              <div
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group cursor-pointer',
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{tab.label}</span>
                    {tab.badge && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate mt-0.5">
                    {tab.description}
                  </p>
                </div>
              </div>
            )

            if (isExternal) {
              return (
                <a
                  key={tab.id}
                  href={tab.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {content}
                </a>
              )
            }

            return (
              <Link key={tab.id} href={tab.href}>
                {content}
              </Link>
            )
          })}
        </nav>

        {/* Empty State for Search */}
        {searchQuery && filteredTabs.length === 0 && (
          <div className="text-center py-8">
            <Search className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Nenhuma configuração encontrada
            </p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
