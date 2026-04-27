'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Share2, CheckCircle2, ExternalLink,
  Loader2, AlertCircle, Zap, Copy, Check,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface AdsSettings {
  facebookAdAccountId?: string
  facebookAccessToken?: string
  adsIntegrationEnabled: boolean
  adsLastSyncAt?: string
  // Lead Ads webhook
  facebookPageId?: string
  facebookPageAccessToken?: string
  facebookWebhookVerifyToken?: string
}

export default function FacebookAdsSettingsPage() {
  const [settings, setSettings] = useState<AdsSettings>({ adsIntegrationEnabled: false })
  const [adAccountId, setAdAccountId]     = useState('')
  const [accessToken, setAccessToken]     = useState('')
  const [pageId, setPageId]               = useState('')
  const [pageToken, setPageToken]         = useState('')
  const [verifyToken, setVerifyToken]     = useState('')
  const [isSaving, setIsSaving]           = useState(false)
  const [isSavingLeads, setIsSavingLeads] = useState(false)
  const [isSyncing, setIsSyncing]         = useState(false)
  const [isLoading, setIsLoading]         = useState(true)
  const [copied, setCopied]               = useState(false)

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/facebook-leads`
    : 'https://siriuscrm.com.br/api/webhooks/facebook-leads'

  useEffect(() => {
    fetch('/api/settings/ads')
      .then(r => r.json())
      .then(data => {
        setSettings(data)
        setAdAccountId(data.facebookAdAccountId ?? '')
        setAccessToken(data.facebookAccessToken ? '••••••••' : '')
        setPageId(data.facebookPageId ?? '')
        setPageToken(data.facebookPageAccessToken ? '••••••••' : '')
        setVerifyToken(data.facebookWebhookVerifyToken ?? '')
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

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
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveLeads = async () => {
    setIsSavingLeads(true)
    try {
      const body: Record<string, any> = {
        facebookPageId: pageId,
        facebookWebhookVerifyToken: verifyToken,
      }
      if (pageToken && !pageToken.startsWith('•')) {
        body.facebookPageAccessToken = pageToken
      }
      const res = await fetch('/api/settings/ads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success('Configuração de Lead Ads salva!')
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setIsSavingLeads(false)
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

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isConfigured      = !!settings.facebookAdAccountId
  const isLeadsConfigured = !!(settings.facebookPageId && settings.facebookPageAccessToken)

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
            {isConfigured && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configurado
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Métricas de campanha + captura automática de leads via formulário
          </p>
        </div>
      </div>

      {/* ── Seção 1: Métricas de Ads ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Métricas de Campanhas</CardTitle>
          <CardDescription>
            Sincroniza spend, cliques e conversões para calcular CAC real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p className="font-medium">Como obter:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>
                      Acesse o{' '}
                      <a href="https://business.facebook.com" target="_blank" rel="noopener" className="underline">
                        Meta Business Manager
                      </a>
                    </li>
                    <li>
                      <strong>Ad Account ID</strong>: Configurações → Contas de Anúncio (ex:{' '}
                      <code>act_123456789</code>)
                    </li>
                    <li>
                      Gere um <strong>Access Token</strong> com escopo <code>ads_read</code> via{' '}
                      <a
                        href="https://developers.facebook.com/tools/explorer"
                        target="_blank"
                        rel="noopener"
                        className="underline"
                      >
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
                {isConfigured && (
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
          <span>
            Última sincronização: {new Date(settings.adsLastSyncAt).toLocaleString('pt-BR')}
          </span>
        </div>
      )}

      <Separator />

      {/* ── Seção 2: Lead Ads Webhook ── */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-md bg-green-600/10 flex items-center justify-center">
          <Zap className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">Captura Automática de Leads</p>
            {isLeadsConfigured && (
              <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Ativo
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Leads de formulários do Facebook entram automaticamente no CRM em tempo real
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuração do Webhook</CardTitle>
          <CardDescription>
            Configure no Meta for Developers para receber leads instantaneamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Instruções */}
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-green-700 shrink-0 mt-0.5" />
                <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <p className="font-medium">Como configurar (passo a passo):</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>
                      Acesse{' '}
                      <a
                        href="https://developers.facebook.com/apps"
                        target="_blank"
                        rel="noopener"
                        className="underline"
                      >
                        Meta for Developers
                      </a>{' '}
                      → seu App → <strong>Webhooks</strong>
                    </li>
                    <li>
                      Clique em <strong>Adicionar URL de Callback</strong>, cole a URL abaixo e defina
                      um Verify Token (qualquer string secreta)
                    </li>
                    <li>
                      Selecione o objeto <strong>Page</strong> e se inscreva no campo{' '}
                      <code>leadgen</code>
                    </li>
                    <li>
                      Instale o app na Página: vá em{' '}
                      <strong>Configurações da Página → Apps Integrados</strong>
                    </li>
                    <li>
                      Gere um <strong>Page Access Token</strong> com permissões{' '}
                      <code>leads_retrieval</code>, <code>pages_manage_metadata</code>,{' '}
                      <code>pages_show_list</code> via Graph API Explorer
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* URL do Webhook */}
          <div className="space-y-2">
            <Label>URL do Webhook</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-xs bg-muted" />
              <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cole esta URL no campo "Callback URL" no Meta for Developers
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="verify-token">Verify Token</Label>
                <Input
                  id="verify-token"
                  placeholder="Ex: meu_token_secreto_123"
                  value={verifyToken}
                  onChange={e => setVerifyToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  String secreta que você define. Use o mesmo valor no Meta for Developers ao registrar o webhook.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="page-id">ID da Página do Facebook</Label>
                <Input
                  id="page-id"
                  placeholder="Ex: 123456789012345"
                  value={pageId}
                  onChange={e => setPageId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Encontre em: Página → Sobre → ID da Página
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="page-token">Page Access Token</Label>
                <Input
                  id="page-token"
                  type="password"
                  placeholder="Token com permissão leads_retrieval"
                  value={pageToken}
                  onChange={e => setPageToken(e.target.value)}
                  onFocus={e => { if (e.target.value.startsWith('•')) setPageToken('') }}
                />
                <p className="text-xs text-muted-foreground">
                  Diferente do Access Token de Ads. Precisa ter{' '}
                  <code>leads_retrieval</code> e <code>pages_manage_metadata</code>.
                </p>
              </div>

              <Button
                onClick={handleSaveLeads}
                disabled={isSavingLeads || !pageId || !verifyToken}
                className="w-full sm:w-auto"
              >
                {isSavingLeads && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Configuração de Leads
              </Button>
            </>
          )}
        </CardContent>
      </Card>

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
