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
  ChevronDown,
  Clock,
  Globe,
  Users,
  BarChart2,
  Search,
  Trophy,
  TrendingUp,
  Minus,
  Moon,
  CalendarDays,
  MousePointerClick,
} from "lucide-react"

const PLAN_STYLES: Record<string, string> = {
  FREE: "border-slate-300 text-slate-500 bg-slate-100",
  STARTER: "border-blue-400 text-blue-600 bg-blue-50",
  PRO: "border-purple-400 text-purple-600 bg-purple-50",
  BUSINESS: "border-amber-400 text-amber-600 bg-amber-50",
}

type AdoptionLevel = "champion" | "active" | "regular" | "dormant"

const LEVEL_CONFIG: Record<AdoptionLevel, { label: string; color: string; bg: string; bar: string; icon: React.ReactNode }> = {
  champion: {
    label: "Campeão",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    bar: "bg-emerald-500",
    icon: <Trophy className="h-3.5 w-3.5" />,
  },
  active: {
    label: "Ativo",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    bar: "bg-blue-500",
    icon: <TrendingUp className="h-3.5 w-3.5" />,
  },
  regular: {
    label: "Regular",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    bar: "bg-amber-400",
    icon: <Minus className="h-3.5 w-3.5" />,
  },
  dormant: {
    label: "Dormindo",
    color: "text-zinc-500",
    bg: "bg-zinc-50 border-zinc-200",
    bar: "bg-zinc-300",
    icon: <Moon className="h-3.5 w-3.5" />,
  },
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
  activeDays: number
  uniquePages: number
  topPages: { path: string; count: number }[]
  score: number
  level: AdoptionLevel
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
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`
}

function ScoreBar({ score, level }: { score: number; level: AdoptionLevel }) {
  const cfg = LEVEL_CONFIG[level]
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${cfg.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-bold text-zinc-700 w-7 text-right">{score}</span>
    </div>
  )
}

function LevelBadge({ level }: { level: AdoptionLevel }) {
  const cfg = LEVEL_CONFIG[level]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-red-500">{icon}</div>
      <div>
        <p className="text-xs text-zinc-400">{label}</p>
        <p className="text-sm font-bold text-zinc-900">{value}</p>
      </div>
    </div>
  )
}

// Rank medal for top 3
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-base">🥇</span>
  if (rank === 2) return <span className="text-base">🥈</span>
  if (rank === 3) return <span className="text-base">🥉</span>
  return <span className="text-xs text-zinc-400 font-medium w-5 text-center">{rank}</span>
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

  useEffect(() => { fetchData() }, [fetchData])

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

  const totalSessions = filtered.reduce((a, o) => a + o.totalSessions, 0)
  const avgScore = filtered.length
    ? Math.round(filtered.reduce((a, o) => a + o.score, 0) / filtered.length)
    : 0
  const champions = filtered.filter((o) => o.level === "champion").length

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
          <SelectTrigger className="w-44">
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
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={<Globe className="h-5 w-5" />} label="Organizações" value={String(filtered.length)} />
        <StatCard icon={<Trophy className="h-5 w-5" />} label="Campeões" value={String(champions)} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Score médio de adoção" value={`${avgScore} / 100`} />
        <StatCard icon={<MousePointerClick className="h-5 w-5" />} label={`Sessões (${days} dias)`} value={String(totalSessions)} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-zinc-500 px-1">
        <span className="font-medium text-zinc-600">Score de adoção:</span>
        {(Object.entries(LEVEL_CONFIG) as [AdoptionLevel, typeof LEVEL_CONFIG[AdoptionLevel]][]).map(([key, cfg]) => (
          <span key={key} className={`inline-flex items-center gap-1 font-medium ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </span>
        ))}
        <span className="ml-auto text-zinc-400">Score = sessões 35% · duração 25% · páginas únicas 20% · dias ativos 20%</span>
      </div>

      {/* Ranking Table */}
      {loading ? (
        <div className="text-zinc-400 text-sm py-12 text-center">Calculando ranking...</div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-200">
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead>Organização</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Sessões</TableHead>
                <TableHead>Dias ativos</TableHead>
                <TableHead>Duração média</TableHead>
                <TableHead>Páginas únicas</TableHead>
                <TableHead>Último acesso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-zinc-400 py-12">
                    Nenhuma organização encontrada.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((org, idx) => (
                <>
                  <TableRow
                    key={org.id}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                      idx === 0 ? "bg-emerald-50/30" : idx === 1 ? "bg-blue-50/20" : idx === 2 ? "bg-amber-50/20" : ""
                    }`}
                    onClick={() => toggleOrg(org.id)}
                  >
                    <TableCell className="text-center">
                      <RankBadge rank={idx + 1} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-zinc-300 transition-transform shrink-0 ${openOrgs.has(org.id) ? "rotate-180" : ""}`}
                        />
                        <div>
                          <p className="font-semibold text-zinc-900 text-sm">{org.name}</p>
                          <p className="text-xs text-zinc-400">/{org.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${PLAN_STYLES[org.tier] ?? ""}`}>
                        {org.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ScoreBar score={org.score} level={org.level} />
                    </TableCell>
                    <TableCell>
                      <LevelBadge level={org.level} />
                    </TableCell>
                    <TableCell className="text-sm font-medium text-zinc-700">{org.totalSessions}</TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 text-zinc-300" />
                        {org.activeDays}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      {org.avgSessionDurationS != null
                        ? formatDuration(org.avgSessionDurationS)
                        : <span className="text-zinc-300">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">{org.uniquePages || <span className="text-zinc-300">—</span>}</TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {org.lastAccess
                        ? formatDistanceToNow(new Date(org.lastAccess), { addSuffix: true, locale: ptBR })
                        : <span className="text-zinc-300">—</span>}
                    </TableCell>
                  </TableRow>

                  {/* Expanded detail */}
                  {openOrgs.has(org.id) && (
                    <TableRow key={`${org.id}-detail`}>
                      <TableCell colSpan={10} className="p-0">
                        <div className="bg-slate-50/80 border-t border-b border-slate-100 px-6 py-5">
                          <div className="grid grid-cols-2 gap-8">
                            {/* Users */}
                            <div>
                              <p className="text-xs font-semibold text-zinc-500 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                                <Users className="h-3.5 w-3.5" /> Usuários ({org.userCount})
                              </p>
                              <div className="space-y-3">
                                {org.users.map((u) => (
                                  <div key={u.id} className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-zinc-800">{u.name ?? u.email}</p>
                                      {u.name && <p className="text-xs text-zinc-400">{u.email}</p>}
                                      <p className="text-xs text-zinc-400">
                                        Desde {format(new Date(u.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-zinc-400">Último acesso</p>
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
                              <p className="text-xs font-semibold text-zinc-500 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                                <BarChart2 className="h-3.5 w-3.5" /> Top páginas — {days} dias
                              </p>
                              {org.topPages.length === 0 ? (
                                <p className="text-xs text-zinc-400">Sem dados de navegação ainda.</p>
                              ) : (
                                <div className="space-y-2.5">
                                  {org.topPages.map((p, i) => {
                                    const max = org.topPages[0]?.count ?? 1
                                    const pct = Math.round((p.count / max) * 100)
                                    return (
                                      <div key={p.path} className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-400 w-4 text-right font-medium">{i + 1}</span>
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-mono text-zinc-700 truncate max-w-[220px]">
                                              {p.path}
                                            </span>
                                            <span className="text-xs font-semibold text-zinc-500 ml-2 shrink-0">{p.count}x</span>
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

                              {/* Score breakdown */}
                              <div className="mt-5 pt-4 border-t border-slate-200">
                                <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wide">Breakdown do Score</p>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-zinc-600">
                                  <span>Sessões ({org.totalSessions})</span>
                                  <span className="text-right font-medium">{Math.round(Math.min(org.totalSessions / 60, 1) * 35)} / 35pts</span>
                                  <span>Duração média</span>
                                  <span className="text-right font-medium">
                                    {org.avgSessionDurationS != null
                                      ? `${Math.round(Math.min(org.avgSessionDurationS / 1800, 1) * 25)} / 25pts`
                                      : "0 / 25pts"}
                                  </span>
                                  <span>Páginas únicas ({org.uniquePages})</span>
                                  <span className="text-right font-medium">{Math.round(Math.min(org.uniquePages / 20, 1) * 20)} / 20pts</span>
                                  <span>Dias ativos ({org.activeDays})</span>
                                  <span className="text-right font-medium">
                                    {Math.round(Math.min(org.activeDays / parseInt(days), 1) * 20)} / 20pts
                                  </span>
                                </div>
                              </div>
                            </div>
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
