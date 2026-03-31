'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Download, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface IntegrationLog {
  id: string
  type: string
  action: string
  status: string
  errorMessage: string | null
  attemptCount: number
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function IntegrationLogsPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<IntegrationLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchLogs = async (page: number = 1) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      })

      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/integrations/logs?${params}`)
      const data = await response.json()

      if (response.ok) {
        setLogs(data.logs)
        setPagination(data.pagination)
      } else {
        toast({
          title: 'Erro',
          description: 'Falha ao carregar logs',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar logs',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const exportLogs = async () => {
    setIsExporting(true)
    try {
      const body: any = {}
      if (typeFilter !== 'all') body.type = typeFilter
      if (statusFilter !== 'all') body.status = statusFilter

      const response = await fetch('/api/integrations/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `integration-logs-${new Date().toISOString()}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast({
          title: 'Sucesso!',
          description: 'Logs exportados com sucesso'
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Falha ao exportar logs',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao exportar logs',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [typeFilter, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
      case 'FAILED':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
      case 'RETRYING':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
      case 'PENDING':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      default:
        return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings/integrations">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            LOGS DE INTEGRAÇÕES
          </h2>
          <p className="text-sm text-zinc-500">
            Histórico de atividades e eventos das integrações
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(pagination.page)}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportLogs}
            disabled={isExporting}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exportando...' : 'Exportar CSV'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-sm font-medium">Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-zinc-500 mb-2 block">Tipo de Integração</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="N8N">N8N</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="GOOGLE_CALENDAR">Google Calendar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-zinc-500 mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="SUCCESS">Sucesso</SelectItem>
                  <SelectItem value="FAILED">Falha</SelectItem>
                  <SelectItem value="RETRYING">Retrying</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Total de Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
              {pagination.total}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Página Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
              {pagination.page} de {pagination.totalPages}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Exibindo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
              {logs.length} logs
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <p className="text-sm">Nenhum log encontrado</p>
              <p className="text-xs mt-2">Ajuste os filtros para ver mais resultados</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-white/5">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {log.type}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(log.status)}`}>
                          {log.status}
                        </Badge>
                        {log.attemptCount > 1 && (
                          <span className="text-xs text-zinc-500">
                            {log.attemptCount} tentativas
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white mb-1">
                        {log.action}
                      </p>
                      {log.errorMessage && (
                        <p className="text-xs text-red-600 dark:text-red-400 font-mono">
                          {log.errorMessage}
                        </p>
                      )}
                      <p className="text-xs text-zinc-400 mt-2">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Mostrando {(pagination.page - 1) * pagination.limit + 1} até{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} logs
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={!pagination.hasPrev || isLoading}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={!pagination.hasNext || isLoading}
              className="gap-2"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
