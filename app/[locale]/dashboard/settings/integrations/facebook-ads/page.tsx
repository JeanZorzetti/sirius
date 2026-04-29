'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Share2, CheckCircle2, ExternalLink,
  Loader2, AlertCircle, Zap, RefreshCw, ChevronRight,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

interface AdsSettings {
  facebookAdAccountId?: string
  facebookAccessToken?: string
  adsIntegrationEnabled: boolean
  adsLastSyncAt?: string
  facebookPageId?: string
  facebookPageAccessToken?: string
  facebookWebhookVerifyToken?: string
}

interface FacebookPage {
  id: string
  name: string
}

export default function FacebookAdsSettingsPage() {
  const searchParams = useSearchParams()

  const [settings, setSettings]         = useState<AdsSettings>({ adsIntegrationEnabled: false })
  const [adAccountId, setAdAccountId]   = useState('')
  const [accessToken, setAccessToken]   = useState('')
  const [isSaving, setIsSaving]         = useState(false)
  const [isSyncing, setIsSyncing]       = useState(false)
  const [isLoading, setIsLoading]       = useState(true)

  // OAuth Lead Ads state
  const [pages, setPages]               = useState<FacebookPage[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [selectedPageName, setSelectedPageName] = useState<string | null>(null)
  const [isSelectingPage, setIsSelectingPage] = useState(false)
  const [isConnected, setIsConnected]   = useState(false)

  const loadSettings = useCallback(async () => {
    try {
      const [adsRes, pagesRes] = await Promise.all([
        fetch('/api/settings/ads'),
        fetch('/api/auth/facebook-leads/pages'),
      ])
      const adsData   = await adsRes.json()
      const pagesData = await pagesRes.json()

      setSettings(adsData)
      setAdAccountId(adsData.facebookAdAccountId ?? '')
      setAccessToken(adsData.facebookAccessToken ? '••••••••' : '')

      setPages(pagesData.pages ?? [])
      setSelectedPageId(pagesData.selectedPageId ?? null)
      if (pagesData.selectedPageId && pagesData.pages?.length) {
        const p = pagesData.pages.find((x: FacebookPage) => x.id === pagesData.selectedPageId)
        setSelectedPageName(p?.name ?? null)
        setIsConnected(true)
      }
    } catch {
      //
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Trata retorno do OAuth
  useEffect(() => {
    const success = searchParams.get('success')
    const error   = searchParams.get('error')

    if (success === 'connected') {
      toast.success('Facebook conectado com sucesso!')
      loadSettings()
    } else if (success === 'select_page') {
      toast.success('Facebook conectado! Selecione a Página abaixo.')
      loadSettings()
    } else if (error === 'denied') {
      toast.error('Autorização negada pelo Facebook.')
    } else if (error) {
      toast.error(`Erro ao conectar: ${error}`)
    }
  }, [searchParams, loadSettings])

  const handleConnectFacebook = () => {
    window.location.href = '/api/auth/facebook-leads'
  }

  const handleSelectPage = async (page: FacebookPage) => {
    setIsSelectingPage(true)
    try {
      const res = await fetch('/api/auth/facebook-leads/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: page.id }),
      })
      if (!res.ok) throw new Error()
      setSelectedPageId(page.id)
      setSelectedPageName(page.name)
      setIsConnected(true)
      toast.success(`Página "${page.name}" conectada! Leads serão capturados automaticamente.`)
    } catch {
      toast.error('Erro ao selecionar página')
    } finally {
      setIsSelectingPage(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const body: Record<string, any> = { facebookAdAccountId: adAccountId }
      if (accessToken && !accessToken.startsWith('•')) {
        body.facebookAccessToken = accessToken
      }
      const res = await fetch('/api/settings/ads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success('Credenciais de Ads salvas!')
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/cron/sync-ads', { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Sincronização iniciada!')
    } catch {
      toast.error('Erro ao sincronizar')
    } finally {
      setIsSyncing(false)
    }
  }

  const isAdsConfigured = !!settings.facebookAdAccountId

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings/integrations">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Integrações
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-blue-600/10 flex items-center justify-center shadow-[0_0_10px_rgba(29,78,216,0.2)]">
          <Share2 className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Meta Ads (Facebook)</h2>
            <Badge variant="outline" className="text-amber-600 border-amber-200">BETA</Badge>
            {isConnected && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Lead Ads Ativo
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Métricas de campanha + captura automática de leads via formulário
          </p>
        </div>
      </div>

      {/* ── Seção 1: Lead Ads OAuth ── */}
      <Card className={isConnected ? 'border-green-200 dark:border-green-800' : ''}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className={`h-4 w-4 ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`} />
            <CardTitle className="text-base">Captura Automática de Leads</CardTitle>
          </div>
          <CardDescription>
            Leads de formulários do Facebook entram automaticamente no CRM em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : isConnected ? (
            /* Estado: conectado e página selecionada */
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Conectado à página: <strong>{selectedPageName}</strong>
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Leads de formulários serão capturados automaticamente
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleConnectFacebook} className="gap-2">
                  <RefreshCw className="h-3 w-3" />
                  Reconectar
                </Button>
                {pages.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => setIsConnected(false)} className="gap-2">
                    Trocar página
                  </Button>
                )}
              </div>
            </div>
          ) : pages.length > 0 ? (
            /* Estado: OAuth feito, mas precisa selecionar a página */
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Selecione qual Página do Facebook receberá os leads:
                </p>
              </div>
              <div className="space-y-2">
                {pages.map(page => (
                  <button
                    key={page.id}
                    onClick={() => handleSelectPage(page)}
                    disabled={isSelectingPage}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-600/10 flex items-center justify-center">
                        <Share2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{page.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {page.id}</p>
                      </div>
                    </div>
                    {isSelectingPage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={handleConnectFacebook} className="gap-2 text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                Reconectar com outra conta
              </Button>
            </div>
          ) : (
            /* Estado: não conectado */
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p className="font-medium">Como funciona:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Clique em "Conectar com Facebook" abaixo</li>
                    <li>Autorize o Sirius CRM a acessar sua Página</li>
                    <li>Selecione qual Página receberá os leads</li>
                    <li>Pronto — leads entram no CRM automaticamente</li>
                  </ol>
                </div>
              </div>
              <Button
                onClick={handleConnectFacebook}
                className="w-full sm:w-auto gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white"
              >
                <Share2 className="h-4 w-4" />
                Conectar com Facebook
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* ── Seção 2: Métricas de Ads ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Métricas de Campanhas</CardTitle>
          <CardDescription>
            Sincroniza spend, cliques e conversões para calcular CAC real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card className="bg-muted/40 border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Como obter as credenciais:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>
                      Acesse o{' '}
                      <a href="https://business.facebook.com" target="_blank" rel="noopener" className="underline">
                        Meta Business Manager
                      </a>
                    </li>
                    <li>
                      <strong>Ad Account ID</strong>: Configurações → Contas de Anúncio (ex: <code>act_123456789</code>)
                    </li>
                    <li>
                      Gere um <strong>Access Token</strong> com escopo <code>ads_read</code> via{' '}
                      <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener" className="underline">
                        Graph API Explorer
                      </a>
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="ad-account-id">Ad Account ID</Label>
                <Input
                  id="ad-account-id"
                  placeholder="act_123456789"
                  value={adAccountId}
                  onChange={e => setAdAccountId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="access-token">Access Token</Label>
                <Input
                  id="access-token"
                  type="password"
                  placeholder="Token com permissão ads_read"
                  value={accessToken}
                  onChange={e => setAccessToken(e.target.value)}
                  onFocus={e => { if (e.target.value.startsWith('•')) setAccessToken('') }}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={isSaving || !adAccountId}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
                {isAdsConfigured && (
                  <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
                    {isSyncing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Sincronizar Agora
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {settings.adsLastSyncAt && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>Última sincronização: {new Date(settings.adsLastSyncAt).toLocaleString('pt-BR')}</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ExternalLink className="h-3 w-3" />
        <a
          href="https://developers.facebook.com/docs/marketing-api/guides/lead-ads/"
          target="_blank"
          rel="noopener"
          className="underline"
        >
          Documentação oficial — Meta Lead Ads
        </a>
      </div>
    </div>
  )
}
