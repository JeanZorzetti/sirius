"use client"

import { useEffect, useState, useCallback } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, Clock, Globe, Users, BarChart2, Search } from "lucide-react"

const PLAN_STYLES: Record<string, string> = {
  FREE: "border-slate-600 text-slate-400 bg-slate-600/10",
  STARTER: "border-blue-500 text-blue-400 bg-blue-500/10",
  PRO: "border-purple-500 text-purple-400 bg-purple-500/10",
  BUSINESS: "border-amber-500 text-amber-400 bg-amber-500/10",
}

type OrgData = {
  id: string
  name: string
  slug: string
  tier: string
  createdAt: string
  userCount: number
  lastAccess: string | null
  avgSessionDurationS: number | null
  totalSessions: number
  topPages: { path: string; count: number }[]
  users: {
    id: string
    name: string | null
    email: string
    createdAt: string
    lastAccess: string | null
  }[]
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return `${m}m ${s}s`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return `${h}h ${rm}m`
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-red-500">{icon}</div>
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-sm font-semibold text-zinc-900">{value}</p>
      </div>
    </div>
  )
}

export default function AccessLogsClient() {
  const [data, setData] = useState<OrgData[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState("30")
  const [search, setSearch] = useState("")
  const [openOrgs, setOpenOrgs] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/access-logs?days=${days}`)
      const json = await res.json()
      setData(json.organizations ?? [])
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = data.filter(
    (org) =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase())
  )

  const toggleOrg = (id: string) =>
    setOpenOrgs((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const totalOrgs = filtered.length
  const totalUsers = filtered.reduce((a, o) => a + o.userCount, 0)
  const avgSession = filtered.filter((o) => o.avgSessionDurationS).reduce((a, o, _, arr) => {
    return a + (o.avgSessionDurationS ?? 0) / arr.filter((x) => x.avgSessionDurationS).length
  }, 0)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            className="pl-9"
            placeholder="Buscar organização..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Globe className="h-5 w-5" />} label="Organizações" value={String(totalOrgs)} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Usuários totais" value={String(totalUsers)} />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Tempo médio de sessão"
          value={avgSession > 0 ? formatDuration(Math.round(avgSession)) : "—"}
        />
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="text-zinc-400 text-sm py-8 text-center">Carregando dados...</div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-8"></TableHead>
                <TableHead>Organização</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Último acesso</TableHead>
                <TableHead>Tempo médio sessão</TableHead>
                <TableHead>Sessões</TableHead>
                <TableHead>Usuários</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-zinc-400 py-10">
                    Nenhuma organização encontrada.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((org) => (
                <>
                  <TableRow
                    key={org.id}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleOrg(org.id)}
                  >
                    <TableCell>
                      <ChevronDown
                        className={`h-4 w-4 text-zinc-400 transition-transform ${openOrgs.has(org.id) ? "rotate-180" : ""}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-zinc-900">
                      {org.name}
                      <span className="ml-2 text-xs text-zinc-400">/{org.slug}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${PLAN_STYLES[org.tier] ?? ""}`}>
                        {org.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      {format(new Date(org.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      {org.lastAccess
                        ? formatDistanceToNow(new Date(org.lastAccess), { addSuffix: true, locale: ptBR })
                        : <span className="text-zinc-300">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      {org.avgSessionDurationS != null
                        ? formatDuration(org.avgSessionDurationS)
                        : <span className="text-zinc-300">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">{org.totalSessions}</TableCell>
                    <TableCell className="text-sm text-zinc-600">{org.userCount}</TableCell>
                  </TableRow>

                  {/* Expanded detail row */}
                  {openOrgs.has(org.id) && (
                    <TableRow key={`${org.id}-detail`} className="bg-slate-50/70">
                      <TableCell colSpan={8} className="py-4 px-6">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Users list */}
                          <div>
                            <p className="text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" /> Usuários
                            </p>
                            <div className="space-y-2">
                              {org.users.map((u) => (
                                <div key={u.id} className="flex items-center justify-between text-sm">
                                  <div>
                                    <p className="font-medium text-zinc-800">{u.name ?? u.email}</p>
                                    {u.name && <p className="text-xs text-zinc-400">{u.email}</p>}
                                    <p className="text-xs text-zinc-400">
                                      Cadastro: {format(new Date(u.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-zinc-500">Último acesso</p>
                                    <p className="text-xs font-medium text-zinc-700">
                                      {u.lastAccess
                                        ? formatDistanceToNow(new Date(u.lastAccess), { addSuffix: true, locale: ptBR })
                                        : "—"}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Top pages */}
                          <div>
                            <p className="text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1">
                              <BarChart2 className="h-3.5 w-3.5" /> Top páginas ({days} dias)
                            </p>
                            {org.topPages.length === 0 ? (
                              <p className="text-xs text-zinc-400">Sem dados de navegação ainda.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {org.topPages.map((p, i) => {
                                  const max = org.topPages[0]?.count ?? 1
                                  const pct = Math.round((p.count / max) * 100)
                                  return (
                                    <div key={p.path} className="flex items-center gap-2">
                                      <span className="text-xs text-zinc-400 w-4 text-right">{i + 1}</span>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between mb-0.5">
                                          <span className="text-xs font-mono text-zinc-700 truncate max-w-[200px]">
                                            {p.path}
                                          </span>
                                          <span className="text-xs text-zinc-500 ml-2 shrink-0">{p.count}x</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                          <div
                                            className="h-full rounded-full bg-red-400"
                                            style={{ width: `${pct}%` }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
