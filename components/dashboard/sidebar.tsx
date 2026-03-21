'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Users, Settings, BarChart3, CreditCard, Mail, Search, RotateCw, MessageSquare, TrendingDown, Zap, TrendingUp, MapPin } from 'lucide-react'

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
    title: 'Visitas & GPS',
    href: '/dashboard/visits',
    icon: MapPin,
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
        <div className="flex-1 py-4 overflow-y-auto">
          <nav className="grid items-start px-3 gap-1">
            {/* WhatsApp Founder Button */}
            <a
              href="https://wa.me/5562983443919?text=Olá! Gostaria de falar com o fundador."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 mb-1 text-white bg-green-500 hover:bg-green-600 shadow-sm hover:shadow-green-500/30"
            >
              <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="flex-1">Falar com o Fundador</span>
            </a>

            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

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
