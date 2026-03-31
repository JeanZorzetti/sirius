'use client'

/**
 * ✅ FASE 17: Settings — Google Ads Integration
 * /dashboard/settings/integrations/google-ads
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BarChart3, CheckCircle2, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface AdsSettings {
  googleAdsCustomerId?: string
  googleAdsRefreshToken?: string
  adsIntegrationEnabled: boolean
  adsLastSyncAt?: string
}

export default function GoogleAdsSettingsPage() {
  const [settings, setSettings] = useState<AdsSettings>({ adsIntegrationEnabled: false })
  const [customerId, setCustomerId] = useState('')
  const [refreshToken, setRefreshToken] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings/ads')
      .then(r => r.json())
      .then(data => {
        setSettings(data)
        setCustomerId(data.googleAdsCustomerId ?? '')
        setRefreshToken(data.googleAdsRefreshToken ? '••••••••' : '')
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const body: Record<string, any> = { googleAdsCustomerId: customerId }
      // Só enviar o token se o usuário digitou algo novo (não os bullet points)
      if (refreshToken && !refreshToken.startsWith('•')) {
        body.googleAdsRefreshToken = refreshToken
      }

      const res = await fetch('/api/settings/ads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Erro ao salvar')

      const updated = await res.json()
      setSettings(prev => ({ ...prev, ...updated }))
      toast.success('Configurações salvas!')
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/cron/sync-ads', { method: 'POST' })
      if (!res.ok) throw new Error('Erro ao sincronizar')
      toast.success('Sincronização iniciada!')
    } catch {
      toast.error('Erro ao sincronizar')
    } finally {
      setIsSyncing(false)
    }
  }

  const isConfigured = !!settings.googleAdsCustomerId

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
        <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.2)]">
          <BarChart3 className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Google Ads</h2>
            <Badge variant="outline" className="text-amber-600 border-amber-200">
              BETA
            </Badge>
            {isConfigured && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configurado
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Importe dados de campanhas para calcular seu CAC real
          </p>
        </div>
      </div>

      {/* Como funciona */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p className="font-medium">Como obter as credenciais:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Acesse o <a href="https://console.cloud.google.com" target="_blank" rel="noopener" className="underline">Google Cloud Console</a> e crie um projeto OAuth2</li>
                <li>No Google Ads, ative a API e obtenha seu <strong>Developer Token</strong></li>
                <li>Configure o OAuth consent screen e gere um <strong>Refresh Token</strong></li>
                <li>Seu <strong>Customer ID</strong> aparece no canto superior direito do Google Ads (ex: 123-456-7890)</li>
              </ol>
              <p className="mt-2 text-xs">
                Adicione no <code>.env</code>: <code>GOOGLE_ADS_DEVELOPER_TOKEN</code>, <code>GOOGLE_ADS_CLIENT_ID</code>, <code>GOOGLE_ADS_CLIENT_SECRET</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credenciais da Conta</CardTitle>
          <CardDescription>Dados necessários para acessar a API do Google Ads</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="customer-id">Customer ID</Label>
                <Input
                  id="customer-id"
                  placeholder="123-456-7890"
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Encontrado no canto superior direito da interface do Google Ads
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refresh-token">OAuth2 Refresh Token</Label>
                <Input
                  id="refresh-token"
                  type="password"
                  placeholder="Refresh token gerado no OAuth2 Playground"
                  value={refreshToken}
                  onChange={e => setRefreshToken(e.target.value)}
                  onFocus={e => {
                    if (e.target.value.startsWith('•')) setRefreshToken('')
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Gerado em <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noopener" className="underline">OAuth2 Playground</a> com escopo <code>https://www.googleapis.com/auth/adwords</code>
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={isSaving || !customerId}>
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

      {/* Status */}
      {settings.adsLastSyncAt && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>
                Última sincronização: {new Date(settings.adsLastSyncAt).toLocaleString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ExternalLink className="h-3 w-3" />
        <a href="https://developers.google.com/google-ads/api/docs/start" target="_blank" rel="noopener" className="underline">
          Documentação oficial da Google Ads API
        </a>
      </div>
    </div>
  )
}
