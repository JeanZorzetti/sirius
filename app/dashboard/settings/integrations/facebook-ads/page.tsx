'use client'

/**
 * ✅ FASE 17: Settings — Facebook / Meta Ads Integration
 * /dashboard/settings/integrations/facebook-ads
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Share2, CheckCircle2, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface AdsSettings {
  facebookAdAccountId?: string
  facebookAccessToken?: string
  adsIntegrationEnabled: boolean
  adsLastSyncAt?: string
}

export default function FacebookAdsSettingsPage() {
  const [settings, setSettings] = useState<AdsSettings>({ adsIntegrationEnabled: false })
  const [adAccountId, setAdAccountId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings/ads')
      .then(r => r.json())
      .then(data => {
        setSettings(data)
        setAdAccountId(data.facebookAdAccountId ?? '')
        setAccessToken(data.facebookAccessToken ? '••••••••' : '')
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

  const isConfigured = !!settings.facebookAdAccountId

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

      {/* Instruções */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p className="font-medium">Como obter as credenciais:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Acesse o <a href="https://business.facebook.com" target="_blank" rel="noopener" className="underline">Meta Business Manager</a></li>
                <li>Seu <strong>Ad Account ID</strong> aparece em Configurações → Contas de Anúncio (ex: <code>act_123456789</code>)</li>
                <li>Gere um <strong>Access Token</strong> com permissão <code>ads_read</code> via <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener" className="underline">Graph API Explorer</a></li>
                <li>Para produção, use um System User Token (não expira)</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credenciais da Conta</CardTitle>
          <CardDescription>Dados necessários para acessar a API do Meta Ads</CardDescription>
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
                <Label htmlFor="ad-account-id">Ad Account ID</Label>
                <Input
                  id="ad-account-id"
                  placeholder="act_123456789"
                  value={adAccountId}
                  onChange={e => setAdAccountId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Formato: <code>act_</code> seguido do ID numérico da conta
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="access-token">Access Token</Label>
                <Input
                  id="access-token"
                  type="password"
                  placeholder="Token com permissão ads_read"
                  value={accessToken}
                  onChange={e => setAccessToken(e.target.value)}
                  onFocus={e => {
                    if (e.target.value.startsWith('•')) setAccessToken('')
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Gere via <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener" className="underline">Graph API Explorer</a> com escopo <code>ads_read</code>
                </p>
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
        <a href="https://developers.facebook.com/docs/marketing-api" target="_blank" rel="noopener" className="underline">
          Documentação oficial da Meta Marketing API
        </a>
      </div>
    </div>
  )
}
