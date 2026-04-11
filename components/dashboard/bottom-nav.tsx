'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Home,
  Users,
  MessageSquare,
  CalendarDays,
  MoreHorizontal,
  BarChart3,
  Mail,
  Zap,
  TrendingDown,
  TrendingUp,
  Settings,
  CreditCard,
  Package,
  CheckSquare,
  RotateCw,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

// Os 4 itens fixos que ocupam a bottom bar. O 5º slot é o "Mais".
const primaryItems: NavItem[] = [
  { title: 'Pipeline', href: '/dashboard', icon: Home },
  { title: 'Contatos', href: '/dashboard/contacts', icon: Users },
  { title: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { title: 'Agenda', href: '/dashboard/agenda', icon: CalendarDays },
]

// Grupos exibidos dentro do bottom sheet quando o usuário toca "Mais"
const moreGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'CRM',
    items: [
      { title: 'Tarefas', href: '/dashboard/tasks', icon: CheckSquare },
      { title: 'Produtos', href: '/dashboard/products', icon: Package },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { title: 'Dashboard', href: '/dashboard/analytics', icon: BarChart3 },
      { title: 'Neg. Perdidos', href: '/dashboard/analytics/lost-deals', icon: TrendingDown },
      { title: 'Campanhas & CAC', href: '/dashboard/marketing/campaigns', icon: TrendingUp },
    ],
  },
  {
    label: 'Automações',
    items: [
      { title: 'Emails', href: '/dashboard/email-automations', icon: Mail },
      { title: 'Deals', href: '/dashboard/automations', icon: Zap },
    ],
  },
  {
    label: 'Conta',
    items: [
      { title: 'Planos', href: '/dashboard/billing/plans', icon: CreditCard },
      { title: 'Configurações', href: '/dashboard/settings', icon: Settings },
      { title: 'Round-Robin', href: '/dashboard/settings/round-robin', icon: RotateCw },
    ],
  },
]

function isItemActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard' || pathname.endsWith('/dashboard')
  return pathname === href || pathname.startsWith(href + '/')
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick?: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'group relative flex h-full min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-2 text-[10px] font-medium transition-colors',
        active
          ? 'text-indigo-600 dark:text-indigo-400'
          : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200',
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 transition-transform duration-200',
          active && 'scale-110',
        )}
      />
      <span className="truncate">{item.title}</span>
      {active && (
        <span className="absolute top-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-indigo-500" />
      )}
    </Link>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  // Considera "Mais" ativo quando a rota atual não casa com nenhum primary item
  const moreActive =
    !primaryItems.some(item => isItemActive(pathname, item.href)) &&
    moreGroups.some(g => g.items.some(i => isItemActive(pathname, i.href)))

  return (
    <nav
      aria-label="Navegação principal mobile"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 flex h-14 border-t border-border/60 bg-background/95 backdrop-blur-md lg:hidden',
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      {primaryItems.map(item => (
        <NavButton
          key={item.href}
          item={item}
          active={isItemActive(pathname, item.href)}
        />
      ))}

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className={cn(
              'group relative flex h-full min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-2 text-[10px] font-medium transition-colors',
              moreActive
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200',
            )}
            aria-label="Mais opções"
          >
            <MoreHorizontal
              className={cn('h-5 w-5 transition-transform duration-200', moreActive && 'scale-110')}
            />
            <span>Mais</span>
            {moreActive && (
              <span className="absolute top-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-indigo-500" />
            )}
          </button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
        >
          <SheetHeader className="pb-4">
            <SheetTitle>Mais opções</SheetTitle>
          </SheetHeader>
          <div className="space-y-6">
            {moreGroups.map(group => (
              <div key={group.label}>
                <h3 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {group.items.map(item => {
                    const Icon = item.icon
                    const active = isItemActive(pathname, item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          'flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border border-border/50 bg-muted/30 px-2 py-3 text-center text-xs font-medium transition-all active:scale-[0.97]',
                          active
                            ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            : 'text-foreground hover:bg-muted/60',
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="leading-tight">{item.title}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
