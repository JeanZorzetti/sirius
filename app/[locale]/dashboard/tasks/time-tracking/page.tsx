import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, Clock, TrendingUp, DollarSign, Calendar as CalendarIcon } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getOrganizationEntitlements } from '@/lib/feature-gates'

export const metadata: Metadata = {
  title: 'Time Tracking - CRM',
}

export const dynamic = 'force-dynamic'

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

function startOfWeek(d: Date): Date {
  const day = d.getDay()
  const diff = d.getDate() - day
  const w = new Date(d)
  w.setDate(diff)
  w.setHours(0, 0, 0, 0)
  return w
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export default async function TimeTrackingPage() {
  const session = await getSession()
  if (!session?.user?.email) {
    return <div>Não autorizado.</div>
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, organizationId: true },
  })

  if (!user?.organizationId) {
    return <div>Organização não encontrada.</div>
  }

  const entitlements = await getOrganizationEntitlements(user.organizationId)
  if (!entitlements.features.timeTracking) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold tracking-tighter text-foreground">
            Time Tracking indisponível
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            O controle de tempo requer o plano PRO ou superior.
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Fazer upgrade
          </Link>
        </div>
      </div>
    )
  }

  const now = new Date()
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)

  const [allEntries, weekEntries, monthEntries] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        task: { organizationId: user.organizationId },
        userId: user.id,
        endTime: { not: null },
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true, color: true } },
          },
        },
      },
      orderBy: { startTime: 'desc' },
      take: 50,
    }),
    prisma.timeEntry.aggregate({
      where: {
        task: { organizationId: user.organizationId },
        userId: user.id,
        startTime: { gte: weekStart },
        endTime: { not: null },
      },
      _sum: { durationMs: true },
    }),
    prisma.timeEntry.aggregate({
      where: {
        task: { organizationId: user.organizationId },
        userId: user.id,
        startTime: { gte: monthStart },
        endTime: { not: null },
      },
      _sum: { durationMs: true },
    }),
  ])

  const totalMs = allEntries.reduce((acc, e) => acc + (e.durationMs || 0), 0)
  const weekMs = Number(weekEntries._sum.durationMs || 0)
  const monthMs = Number(monthEntries._sum.durationMs || 0)

  // Group by project
  const byProject = new Map<
    string,
    { name: string; color: string; ms: number; count: number }
  >()
  allEntries.forEach((e) => {
    const p = e.task.project
    if (!p) return
    const existing = byProject.get(p.id) || {
      name: p.name,
      color: p.color,
      ms: 0,
      count: 0,
    }
    existing.ms += e.durationMs || 0
    existing.count += 1
    byProject.set(p.id, existing)
  })
  const projectTotals = Array.from(byProject.entries()).sort((a, b) => b[1].ms - a[1].ms)

  return (
    <div className="flex-1 space-y-6">
      <Link
        href="/dashboard/tasks"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-3 w-3" />
        Voltar para tarefas
      </Link>

      <div className="flex items-end gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <Clock className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold tracking-tighter text-foreground">
            Time Tracking
          </h1>
          <p className="text-sm text-muted-foreground">
            Seu tempo investido em tarefas
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CalendarIcon className="h-3 w-3" />
            Esta semana
          </div>
          <div className="mt-2 font-display text-3xl font-bold tracking-tighter text-foreground">
            {formatDuration(weekMs)}
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            Este mês
          </div>
          <div className="mt-2 font-display text-3xl font-bold tracking-tighter text-foreground">
            {formatDuration(monthMs)}
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/30 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            Total registrado
          </div>
          <div className="mt-2 font-display text-3xl font-bold tracking-tighter text-foreground">
            {formatDuration(totalMs)}
          </div>
        </div>
      </div>

      {/* Per project */}
      {projectTotals.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card/30 p-5">
          <h3 className="text-sm font-semibold">Por projeto</h3>
          <div className="mt-4 space-y-3">
            {projectTotals.map(([id, p]) => {
              const pct = totalMs > 0 ? (p.ms / totalMs) * 100 : 0
              return (
                <div key={id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <Link
                        href={`/dashboard/tasks/${id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {p.name}
                      </Link>
                      <span className="text-[10px] text-muted-foreground">
                        {p.count} entrada(s)
                      </span>
                    </div>
                    <span className="tabular-nums text-muted-foreground">
                      {formatDuration(p.ms)}
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: p.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent entries */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-5">
        <h3 className="text-sm font-semibold">Entradas recentes</h3>
        {allEntries.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border/30 py-6 text-center text-xs text-muted-foreground">
            Nenhuma entrada registrada ainda
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {allEntries.slice(0, 20).map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/30 bg-background/40 px-3 py-2"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.task.project?.color || '#94a3b8' }}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/tasks/task/${entry.task.id}`}
                      className="block truncate text-xs font-medium text-foreground hover:underline"
                    >
                      {entry.task.title}
                    </Link>
                    <div className="text-[10px] text-muted-foreground">
                      {entry.task.project?.name} ·{' '}
                      {new Date(entry.startTime).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold tabular-nums text-foreground">
                  {formatDuration(entry.durationMs || 0)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
