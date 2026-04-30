'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle, RefreshCw, Database, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface OmieSettings {
  omieAppKey:  string
  omieAppSecret: string
  omieEnabled: boolean
  configured:  boolean
}

export default function OmieSettingsPage() {
  const [settings, setSettings]     = useState<OmieSettings>({ omieAppKey: '', omieAppSecret: '', omieEnabled: false, configured: false })
  const [appKey, setAppKey]         = useState('')
  const [appSecret, setAppSecret]   = useState('')
  const [isSaving, setIsSaving]     = useState(false)
  const [isSyncing, setIsSyncing]   = useState<string | null>(null)
  const [isLoading, setIsLoading]   = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/omie/settings')
      const data = await res.json()
      setSettings(data)
      setAppKey(data.omieAppKey ?? '')
      setAppSecret(data.omieAppSecret ?? '')
    } catch {
      //
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const body: Record<string, string> = {}
      if (appKey    && !appKey.startsWith('•'))    body.omieAppKey    = appKey
      if (appSecret && !appSecret.startsWith('•')) body.omieAppSecret = appSecret

      const res = await fetch('/api/integrations/omie/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Omie conectado com sucesso!')
      load()
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao salvar credenciais')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSync = async (type: 'contacts' | 'financial') => {
    setIsSyncing(type)
    try {
      const res = await fetch('/api/integrations/omie/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (type === 'contacts') {
        toast.success(`${data.totalImported} contatos importados, ${data.totalUpdated} atualizados`)
      } else {
        toast.success(`${data.totalSynced} títulos financeiros sincronizados`)
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro na sincronização')
    } finally {
      setIsSyncing(null)
    }
  }

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
        <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.15)]">
          <Database className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Omie ERP</h2>
            {settings.configured && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Sincronize clientes, pedidos e financeiro entre o Omie e o Sirius CRM
          </p>
        </div>
      </div>

      {/* ── Credenciais ── */}
      <Card className={settings.configured ? 'border-green-200 dark:border-green-800' : ''}>
        <CardHeader>
          <CardTitle className="text-base">Credenciais de API</CardTitle>
          <CardDescription>
            Obtenha as chaves em{' '}
            <a href="https://developer.omie.com.br" target="_blank" rel="noopener" className="underline">
              developer.omie.com.br
            </a>{' '}
            → seu aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : (
            <>
              {settings.configured && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Integração ativa — dados sincronizando com o Omie
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="app-key">App Key</Label>
                <Input
                  id="app-key"
                  placeholder="Ex: 1234567890"
                  value={appKey}
                  onChange={e => setAppKey(e.target.value)}
                  onFocus={e => { if (e.target.value.startsWith('•')) setAppKey('') }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-secret">App Secret</Label>
                <Input
                  id="app-secret"
                  type="password"
                  placeholder="Chave secreta do aplicativo"
                  value={appSecret}
                  onChange={e => setAppSecret(e.target.value)}
                  onFocus={e => { if (e.target.value.startsWith('•')) setAppSecret('') }}
                />
              </div>
              <Button onClick={handleSave} disabled={isSaving || (!appKey && !appSecret)}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {settings.configured ? 'Atualizar credenciais' : 'Conectar Omie'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {settings.configured && (
        <>
          <Separator />

          {/* ── Sincronização ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sincronização</CardTitle>
              <CardDescription>
                Importe dados do Omie para o CRM manualmente. O webhook mantém tudo atualizado em tempo real.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Contatos */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-border/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Clientes → Contatos</p>
                    <p className="text-xs text-muted-foreground">Importa todos os clientes cadastrados no Omie</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync('contacts')}
                  disabled={isSyncing !== null}
                  className="gap-2 shrink-0"
                >
                  {isSyncing === 'contacts'
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <RefreshCw className="h-3 w-3" />}
                  Sincronizar
                </Button>
              </div>

              {/* Financeiro */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-border/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Contas a Receber</p>
                    <p className="text-xs text-muted-foreground">Sincroniza títulos e status de pagamento por cliente</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync('financial')}
                  disabled={isSyncing !== null}
                  className="gap-2 shrink-0"
                >
                  {isSyncing === 'financial'
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <RefreshCw className="h-3 w-3" />}
                  Sincronizar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* ── Webhook ── */}
          <Card className="bg-muted/40 border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Webhook para atualizações em tempo real</p>
                  <p className="text-xs">
                    Configure em{' '}
                    <a href="https://developer.omie.com.br" target="_blank" rel="noopener" className="underline">
                      developer.omie.com.br
                    </a>{' '}
                    → seu app → Adicionar webhook:
                  </p>
                  <code className="block text-xs bg-background border border-border rounded px-2 py-1 mt-1 select-all">
                    https://siriuscrm.com.br/api/webhooks/omie
                  </code>
                  <p className="text-xs mt-1">Eventos: <code>cliente.criado</code>, <code>cliente.alterado</code>, <code>conta_receber.alterada</code></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
