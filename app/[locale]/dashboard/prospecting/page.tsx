'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, Users, CreditCard, AlertTriangle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ScrapingJob {
  id: string
  query: string
  status: string
  resultsCount: number
  createdAt: string
}

interface ProviderStatus {
  name: string
  configured: boolean
}

export default function ProspectingPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [credits, setCredits] = useState({ balance: 0, monthlyQuota: 0 })
  const [jobs, setJobs] = useState<ScrapingJob[]>([])
  const [configStatus, setConfigStatus] = useState<{ configured: boolean; providers: ProviderStatus[] } | null>(null)

  // Fetch credits and config on mount
  useEffect(() => {
    fetchCredits()
    fetchJobs()
    fetchConfigStatus()
  }, [])

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/scraping/credits')
      if (res.ok) {
        const data = await res.json()
        setCredits(data)
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    }
  }

  const fetchConfigStatus = async () => {
    try {
      const res = await fetch('/api/scraping/config-status')
      if (res.ok) {
        const data = await res.json()
        setConfigStatus(data)
      }
    } catch {
      // silently fail
    }
  }

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/scraping/jobs')
      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Digite uma busca')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/scraping/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 50 }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 402) {
          toast.error(`Créditos insuficientes. Disponível: ${data.available}`, {
            description: 'Compre mais créditos em Configurações > Add-ons',
          })
        } else if (res.status === 503) {
          if (data.code === 'SCRAPER_NOT_CONFIGURED') {
            toast.error('Servidor de scraping não configurado', {
              description: 'Configure SIRIUS_SCRAPER_URL no Vercel apontando para seu servidor no EasyPanel.',
              duration: 10000,
            })
          } else if (data.code === 'SCRAPER_CONNECTION_ERROR') {
            toast.error('Não foi possível conectar ao scraper', {
              description: data.message || 'Verifique se o serviço está rodando no EasyPanel.',
              duration: 10000,
            })
          } else if (data.code === 'GOOGLE_PLACES_API_REQUIRED') {
            toast.error('Google bloqueou temporariamente as buscas', {
              description: 'Configure GOOGLE_PLACES_API_KEY para resultados ilimitados (gratuito até $200/mês). Entre em contato com o suporte.',
              duration: 10000,
            })
          } else {
            toast.error('Serviço de busca não configurado', {
              description: 'Entre em contato com o suporte para ativar',
            })
          }
        } else {
          toast.error(data.error || 'Erro na busca')
        }
        return
      }

      if (data.status === 'COMPLETED') {
        toast.success(`${data.leadsFound} leads encontrados!`)
        fetchCredits()
        fetchJobs()
      } else {
        toast.info('Busca iniciada. Aguarde...')
        // Poll for results
        pollJob(data.jobId)
      }
    } catch (error) {
      toast.error('Erro ao buscar leads')
    } finally {
      setLoading(false)
    }
  }

  const pollJob = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/scraping/jobs/${jobId}`)
        const data = await res.json()

        if (data.status === 'COMPLETED') {
          clearInterval(interval)
          toast.success(`${data.resultsCount} leads encontrados!`)
          fetchCredits()
          fetchJobs()
        } else if (data.status === 'FAILED') {
          clearInterval(interval)
          toast.error('Busca falhou')
        }
      } catch (error) {
        clearInterval(interval)
      }
    }, 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Prospecção Automática</h1>
        <Badge variant="secondary" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Créditos: {credits.balance}/{credits.monthlyQuota}
        </Badge>
      </div>

      {/* Config Warning */}
      {configStatus && !configStatus.configured && (
        <Alert variant="destructive" className="border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 [&>svg]:text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuração necessária</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              A prospecção requer pelo menos um provedor configurado para resultados confiáveis.
              Sem configuração, a busca usa fallbacks básicos que podem retornar poucos resultados.
            </p>
            <div className="text-sm space-y-1">
              <p className="font-medium">Opções de configuração (variáveis de ambiente no Vercel):</p>
              <ul className="list-disc list-inside ml-2 space-y-0.5">
                <li>
                  <code className="text-xs bg-amber-100 dark:bg-amber-900/50 px-1 rounded">SIRIUS_SCRAPER_URL</code>
                  {' '}&mdash; Servidor Puppeteer self-hosted (gratuito, deploy no EasyPanel)
                </li>
                <li>
                  <code className="text-xs bg-amber-100 dark:bg-amber-900/50 px-1 rounded">GOOGLE_PLACES_API_KEY</code>
                  {' '}&mdash; Google Places API (gratuito até $200/mês)
                </li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Leads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ex: restaurantes em São Paulo, advogados em Brasília..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Custa 1 crédito por lead encontrado. Os leads são adicionados automaticamente aos seus contatos.
          </p>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Buscas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma busca realizada ainda
            </p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{job.query}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.status === 'COMPLETED' ? (
                      <Badge className="bg-green-100 text-green-800">
                        {job.resultsCount} leads
                      </Badge>
                    ) : job.status === 'RUNNING' ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Processando...
                      </Badge>
                    ) : (
                      <Badge variant="secondary">{job.status}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
