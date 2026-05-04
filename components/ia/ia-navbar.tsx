'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  Activity, GitBranch, Bot,
  BarChart3, Settings, ExternalLink, BookOpen
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface IANavbarProps {
  user: { name?: string | null; email: string }
  organizationName: string
  enabledAgentCount?: number
}

const navItems = [
  { title: 'Feed', href: '/IA', icon: Activity },
  { title: 'Agentes', href: '/IA/agents', icon: Bot },
  { title: 'Conhecimento', href: '/IA/knowledge', icon: BookOpen },
  { title: 'Pipeline', href: '/IA/pipeline', icon: GitBranch },
  { title: 'Analytics', href: '/IA/analytics', icon: BarChart3 },
  { title: 'Config', href: '/IA/settings', icon: Settings },
]

export function IANavbar({ user, organizationName, enabledAgentCount = 0 }: IANavbarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/IA') return pathname === '/IA'
    return pathname.startsWith(href)
  }

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6">
        {/* Logo + brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white tracking-tight">S</span>
              <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-zinc-950 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-zinc-100">Sirius</span>
              <span className="text-[10px] font-medium tracking-widest uppercase text-cyan-400/80">IA</span>
            </div>
          </div>
          <span className="hidden sm:block text-[11px] text-zinc-600 ml-2 font-mono">
            {organizationName}
          </span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)
            const showBadge = item.href === '/IA/agents' && enabledAgentCount === 0
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  active
                    ? 'text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="ia-nav-active"
                    className="absolute inset-0 rounded-lg bg-zinc-800/60 border border-zinc-700/50"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span className="relative">
                    <Icon className="h-4 w-4" />
                    {showBadge && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </span>
                  <span className="hidden md:inline">{item.title}</span>
                </span>
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 transition-all duration-200"
          >
            <span className="hidden sm:inline">Dashboard</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <Avatar className="h-7 w-7 border border-zinc-700/50">
            <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  )
}
