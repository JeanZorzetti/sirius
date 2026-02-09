'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Users, Settings, BarChart3, CreditCard, Mail, LineChart, Search, RotateCw } from 'lucide-react'

const navItems = [
  {
    title: 'Pipelines',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Contatos',
    href: '/dashboard/contacts',
    icon: Users,
  },
  {
    title: 'Prospecção',
    href: '/dashboard/prospecting',
    icon: Search,
  },
  {
    title: 'Dashboard',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Analytics PRO',
    href: '/dashboard/analytics-pro',
    icon: LineChart,
    badge: 'PRO',
  },
  {
    title: 'Automações Email',
    href: '/dashboard/email-automations',
    icon: Mail,
  },
  {
    title: 'Planos e Preços',
    href: '/dashboard/billing/plans',
    icon: CreditCard,
  },
  {
    title: 'Configurações',
    href: '/dashboard/settings',
    icon: Settings,
  },
  {
    title: 'Round-Robin',
    href: '/dashboard/settings/round-robin',
    icon: RotateCw,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 h-screen border-r border-border bg-sidebar/80 backdrop-blur-xl relative z-50">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="flex h-full flex-col gap-2 relative z-10">
        {/* Header / Logo */}
        <div className="flex h-16 items-center px-6 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            {/* Logo Icon */}
            <div className="relative w-8 h-8 group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/logo.png"
                alt="Sirius Logo"
                fill
                className="object-contain"
                priority
                sizes="32px"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">SIRIUS</span>
              <span className="text-[10px] text-muted-foreground tracking-wider">CRM</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4">
          <nav className="grid items-start px-3 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 relative overflow-hidden',
                    isActive
                      ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-transparent'
                      : 'text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5'
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-indigo-500/10 border-l-2 border-indigo-500" />
                  )}

                  <Icon className={cn("h-4 w-4 z-10 transition-colors", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300")} />
                  <span className="z-10 flex-1">{item.title}</span>

                  {item.badge && (
                    <span className="z-10 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                      {item.badge}
                    </span>
                  )}

                  {isActive && (
                    <div className="absolute right-0 top-0 h-full w-4 bg-gradient-to-l from-indigo-500/20 to-transparent" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User / Footer Area could go here */}
      </div>
    </div>
  )
}
