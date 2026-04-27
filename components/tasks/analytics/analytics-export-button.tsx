'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateBR } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AnalyticsData {
  rangeDays: number
  projectId: string | null
  kpis: {
    total: number
    completed: number
    inProgress: number
    overdue: number
    completionRate: number
    avgCompletionHours: number
    velocity: number
    created: number
  }
  tasksByStatus: Array<{ name: string; count: number; type: string }>
  tasksByPriority: Array<{ label: string; count: number }>
  trend: Array<{ date: string; created: number; completed: number }>
  topAssignees: Array<{ name: string; email: string; count: number }>
  overdueList: Array<{
    title: string
    dueDate: string | null
    priority: string
    assignee: { name: string | null } | null
    project: { name: string } | null
    status: { name: string } | null
  }>
}

interface Props {
  data: AnalyticsData
  projectId?: string
  rangeDays: number
}

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildCSV(rows: string[][], headers: string[]): string {
  const lines = [headers.map(escapeCSV).join(',')]
  for (const row of rows) {
    lines.push(row.map(escapeCSV).join(','))
  }
  return lines.join('\n')
}

function downloadCSV(content: string, filename: string) {
  const bom = '\uFEFF' // UTF-8 BOM para Excel
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatDateFilename(): string {
  return new Date().toISOString().slice(0, 10)
}

export function AnalyticsExportButton({ data, projectId, rangeDays }: Props) {
  const [loading, setLoading] = useState(false)

  function exportKPIs() {
    setLoading(true)
    try {
      const headers = ['Métrica', 'Valor']
      const rows: string[][] = [
        ['Total de Tarefas', String(data.kpis.total)],
        ['Concluídas', String(data.kpis.completed)],
        ['Em Progresso', String(data.kpis.inProgress)],
        ['Atrasadas', String(data.kpis.overdue)],
        ['Taxa de Conclusão (%)', String(data.kpis.completionRate)],
        ['Tempo Médio de Conclusão (horas)', String(data.kpis.avgCompletionHours)],
        ['Velocity (tasks/semana)', String(data.kpis.velocity)],
        ['Criadas no Período', String(data.kpis.created)],
        ['Período (dias)', String(rangeDays)],
      ]
      downloadCSV(buildCSV(rows, headers), `tarefas-kpis-${formatDateFilename()}.csv`)
    } finally {
      setLoading(false)
    }
  }

  function exportTrend() {
    setLoading(true)
    try {
      const headers = ['Data', 'Criadas', 'Concluídas']
      const rows = data.trend.map((t) => [t.date, String(t.created), String(t.completed)])
      downloadCSV(buildCSV(rows, headers), `tarefas-tendencia-${formatDateFilename()}.csv`)
    } finally {
      setLoading(false)
    }
  }

  function exportOverdue() {
    setLoading(true)
    try {
      const headers = ['Título', 'Projeto', 'Status', 'Prioridade', 'Vencimento', 'Responsável']
      const rows = data.overdueList.map((t) => [
        t.title,
        t.project?.name ?? '',
        t.status?.name ?? '',
        t.priority,
        t.dueDate ? formatDateBR(t.dueDate) : '',
        t.assignee?.name ?? '',
      ])
      downloadCSV(buildCSV(rows, headers), `tarefas-atrasadas-${formatDateFilename()}.csv`)
    } finally {
      setLoading(false)
    }
  }

  function exportAssignees() {
    setLoading(true)
    try {
      const headers = ['Responsável', 'E-mail', 'Tarefas']
      const rows = data.topAssignees.map((a) => [a.name, a.email, String(a.count)])
      downloadCSV(buildCSV(rows, headers), `tarefas-por-responsavel-${formatDateFilename()}.csv`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl border-border/60 bg-card/40 backdrop-blur-xl hover:bg-card/70"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={exportKPIs} className="gap-2 text-xs">
          <Download className="h-3.5 w-3.5" />
          KPIs resumidos
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportTrend} className="gap-2 text-xs">
          <Download className="h-3.5 w-3.5" />
          Tendência diária
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAssignees} className="gap-2 text-xs">
          <Download className="h-3.5 w-3.5" />
          Carga por responsável
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={exportOverdue}
          className="gap-2 text-xs"
          disabled={data.overdueList.length === 0}
        >
          <Download className="h-3.5 w-3.5" />
          Tarefas atrasadas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
