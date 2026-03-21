'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Users, Settings, BarChart3, CreditCard, Menu, X, Mail, RotateCw, MessageSquare, TrendingDown, Zap, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

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
    title: 'Chat WhatsApp',
    href: '/dashboard/chat',
    icon: MessageSquare,
  },
  {
    title: 'Dashboard',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Neg. Perdidos',
    href: '/dashboard/analytics/lost-deals',
    icon: TrendingDown,
  },
  {
    title: 'Campanhas & CAC',
    href: '/dashboard/marketing/campaigns',
    icon: TrendingUp,
  },
  {
    title: 'Automações Email',
    href: '/dashboard/email-automations',
    icon: Mail,
  },
  {
    title: 'Automações Deals',
    href: '/dashboard/automations',
    icon: Zap,
  },
  {
    title: 'Planos',
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

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-background border-r border-border z-50 transform transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Background Glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full" />
        </div>

        <div className="flex h-full flex-col gap-2 relative z-10">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
              <div className="relative w-8 h-8">
                <Image
                  src="/logo.png"
                  alt="Sirius Logo"
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">SIRIUS</span>
                <span className="text-[10px] text-muted-foreground tracking-wider">CRM</span>
              </div>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 py-4 overflow-y-auto">
            <nav className="grid items-start px-3 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
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

                    {isActive && (
                      <div className="absolute right-0 top-0 h-full w-4 bg-gradient-to-l from-indigo-500/20 to-transparent" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}
