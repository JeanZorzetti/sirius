'use client'

import { useState, useRef, useCallback, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home, Users, Settings, BarChart3, CreditCard, Mail,
  MessageSquare, TrendingDown, Zap, TrendingUp, LogOut, Package, CalendarDays, Sparkles, CheckSquare, LifeBuoy, Gift, Instagram,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { logoutAction } from '@/app/auth/actions'
import { Separator } from '@/components/ui/separator'

type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const crmItems: NavItem[] = [
  { title: 'Pipelines',      href: '/dashboard',          icon: Home },
  { title: 'Contatos',       href: '/dashboard/contacts', icon: Users },
  { title: 'Tarefas',        href: '/dashboard/tasks',    icon: CheckSquare },
  { title: 'Agenda',         href: '/dashboard/agenda',   icon: CalendarDays },
  { title: 'Produtos',       href: '/dashboard/products', icon: Package },
  { title: 'Chat WhatsApp',  href: '/dashboard/chat',     icon: MessageSquare },
]

const analyticsItems: NavItem[] = [
  { title: 'Dashboard',       href: '/dashboard/analytics',              icon: BarChart3 },
  { title: 'Neg. Perdidos',   href: '/dashboard/analytics/lost-deals',   icon: TrendingDown },
  { title: 'Campanhas & CAC', href: '/dashboard/marketing/campaigns',    icon: TrendingUp },
]

const automationItems: NavItem[] = [
  { title: 'Automações Email', href: '/dashboard/email-automations', icon: Mail },
  { title: 'Automações Deals', href: '/dashboard/automations',       icon: Zap },
  { title: 'Instagram Bot',    href: '/dashboard/instagram',         icon: Instagram },
]

const accountItems: NavItem[] = [
  { title: 'Indique e Ganhe', href: '/indique',                 icon: Gift },
  { title: 'Suporte',         href: '/dashboard/support',       icon: LifeBuoy },
  { title: 'Assinatura',      href: '/dashboard/billing',       icon: CreditCard },
  { title: 'Configurações',   href: '/dashboard/settings',      icon: Settings },
]

// ── helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children, open }: { children: React.ReactNode; open: boolean }) {
  return (
    <span
      className={cn(
        'px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 whitespace-pre transition-opacity duration-150',
        open ? 'opacity-100' : 'opacity-0 pointer-events-none select-none'
      )}
    >
      {children}
    </span>
  )
}

const NavLink = memo(function NavLink({
  item,
  pathname,
  open,
}: {
  item: NavItem
  pathname: string
  open: boolean
}) {
  const Icon = item.icon
  const isActive =
    pathname === item.href ||
    (item.href !== '/dashboard' && pathname.startsWith(item.href))

  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden',
        !open ? 'justify-center px-2' : '',
        isActive
          ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-transparent'
          : 'text-zinc-600 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5'
      )}
    >
      {isActive && (
        <div className="absolute inset-0 bg-indigo-500/10 border-l-2 border-indigo-500" />
      )}
      <Icon
        className={cn(
          'h-4 w-4 z-10 flex-shrink-0 transition-colors',
          isActive
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'
        )}
      />
      <span
        className={cn(
          'z-10 whitespace-pre flex-1 transition-opacity duration-150',
          open ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
        )}
      >
        {item.title}
      </span>
      {isActive && open && (
        <div className="absolute right-0 top-0 h-full w-4 bg-gradient-to-l from-indigo-500/20 to-transparent" />
      )}
    </Link>
  )
})

function WhatsAppFounderButton({ open }: { open: boolean }) {
  return (
    <a
      href="https://wa.me/5562998015884?text=Olá! Preciso de ajuda com o Sirius CRM."
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 mb-2',
        'text-white bg-green-500 hover:bg-green-600 shadow-sm hover:shadow-green-500/30',
        !open ? 'justify-center px-2' : ''
      )}
    >
      <svg
        className="h-4 w-4 flex-shrink-0 fill-current"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      <span
        className={cn(
          'whitespace-pre transition-opacity duration-150',
          open ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
        )}
      >
        Suporte WhatsApp
      </span>
    </a>
  )
}

function SidebarUserNav({ user, open }: { user: any; open: boolean }) {
  const [expanded, setExpanded] = useState(false)

  const linkClass = 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200'

  return (
    <div>
      {open && expanded && (
        <div className="overflow-hidden mb-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <Link href="/dashboard/settings" className={linkClass}>
            <Settings className="h-4 w-4 flex-shrink-0 text-zinc-500" />
            <span>Perfil</span>
          </Link>
          {user.role === 'ADMIN' && (
            <a href="/admin" className={cn(linkClass, 'text-red-500 dark:text-red-400 font-bold')}>
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span>Admin Panel</span>
            </a>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className={cn(linkClass, 'w-full text-red-500 dark:text-red-400')}
              onClick={async () => {
                const sessionId = sessionStorage.getItem('sirius_access_session_id')
                if (sessionId) {
                  sessionStorage.removeItem('sirius_access_session_id')
                  try {
                    await fetch('/api/access/session', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'logout', sessionId }),
                    })
                  } catch { /* fire-and-forget */ }
                }
              }}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span>Sair</span>
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => open && setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          'text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5',
          !open ? 'justify-center px-2' : ''
        )}
      >
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarImage src="" alt={user.name} />
          <AvatarFallback className="text-xs">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
        </Avatar>
        <span
          className={cn(
            'whitespace-pre truncate flex-1 text-left transition-opacity duration-150',
            open ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
          )}
        >
          {user.name}
        </span>
      </button>
    </div>
  )
}

// ── inner sidebar ─────────────────────────────────────────────────────────────

function SidebarInner({ pathname, user, open, setOpen }: { pathname: string; user: any; open: boolean; setOpen: (v: boolean) => void }) {
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    openTimer.current = setTimeout(() => setOpen(true), 120)
  }, [setOpen])

  const handleMouseLeave = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 200)
  }, [setOpen])

  return (
    <div
      className={cn(
        'h-[calc(100vh-16px)] m-2 rounded-xl border border-border/40 shadow-md bg-sidebar/80 backdrop-blur-xl relative z-50 flex flex-col overflow-hidden',
        'transition-[width] duration-200 ease-in-out',
        open ? 'w-64' : 'w-[60px]'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Header / Logo */}
      <div className="flex h-16 items-center px-3 border-b border-white/5 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
            <Image src="/logo.png" alt="Sirius Logo" fill className="object-contain" priority sizes="32px" />
          </div>
          <div
            className={cn(
              'flex flex-col whitespace-pre transition-opacity duration-150',
              open ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
            )}
          >
            <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              SIRIUS
            </span>
            <span className="text-[10px] text-muted-foreground tracking-wider">CRM</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 relative z-10">
        <nav className="grid gap-0.5">
          {user.role === 'ADMIN' && (
            <Link
              href="/IA"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 mb-2',
                'bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20',
                'text-cyan-400 hover:from-cyan-500/20 hover:to-violet-500/20 hover:text-cyan-300',
                !open ? 'justify-center px-2' : ''
              )}
            >
              <Sparkles className="h-4 w-4 flex-shrink-0" />
              <span
                className={cn(
                  'whitespace-pre transition-opacity duration-150',
                  open ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                )}
              >
                Modo IA
              </span>
            </Link>
          )}

          <WhatsAppFounderButton open={open} />

          <SectionLabel open={open}>CRM</SectionLabel>
          {crmItems
            .filter((item) => {
              if (item.href === '/dashboard/tasks' && user?.features?.canAccessTasks === false) return false
              if (item.href === '/dashboard/agenda' && user?.features?.canAccessAgenda === false) return false
              return true
            })
            .map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} open={open} />
            ))}

          <Separator className="my-3" />

          <SectionLabel open={open}>Analytics</SectionLabel>
          {analyticsItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} open={open} />
          ))}

          <Separator className="my-3" />

          <SectionLabel open={open}>Automações</SectionLabel>
          {automationItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} open={open} />
          ))}
        </nav>
      </div>

      {/* Footer – Account */}
      <div className="border-t border-border px-2 py-3 grid gap-0.5 flex-shrink-0 relative z-10">
        {accountItems.map((item) => (
          <NavLink key={item.title} item={item} pathname={pathname} open={open} />
        ))}
        <SidebarUserNav user={user} open={open} />
      </div>
    </div>
  )
}

// ── public export ─────────────────────────────────────────────────────────────

export function Sidebar({ user }: { user: any }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <SidebarInner pathname={pathname} user={user} open={open} setOpen={setOpen} />
  )
}
