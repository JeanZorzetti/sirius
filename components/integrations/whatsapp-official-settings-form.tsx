'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WhatsAppOfficialSettingsFormProps {
  organizationId: string
  initialData: {
    enabled: boolean
    phoneNumberId: string
    businessAccountId: string
    webhookVerifyToken: string
    hasAccessToken: boolean
  }
}

export function WhatsAppOfficialSettingsForm({
  organizationId,
  initialData
}: WhatsAppOfficialSettingsFormProps) {
  const tCommon = useTranslations('common')
  const router = useRouter()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [testInfo, setTestInfo] = useState<{ verified_name?: string; display_phone_number?: string } | null>(null)
  const [showToken, setShowToken] = useState(false)

  const [enabled, setEnabled] = useState(initialData.enabled)
  const [phoneNumberId, setPhoneNumberId] = useState(initialData.phoneNumberId)
  const [accessToken, setAccessToken] = useState('')
  const [businessAccountId, setBusinessAccountId] = useState(initialData.businessAccountId)
  const [webhookVerifyToken, setWebhookVerifyToken] = useState(initialData.webhookVerifyToken)

  const handleTestConnection = async () => {
    if (!phoneNumberId || !accessToken) {
      toast({
        title: 'Erro',
        description: 'Preencha o Phone Number ID e o Access Token antes de testar.',
        variant: 'destructive'
      })
      return
    }

    setIsTesting(true)
    setTestResult(null)
    setTestInfo(null)

    try {
      const response = await fetch('/api/integrations/whatsapp-official/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumberId, accessToken })
      })

      const data = await response.json()

      if (data.success) {
        setTestResult('success')
        setTestInfo(data.info)
        toast({ title: 'Sucesso!', description: 'Conexão com a API do WhatsApp estabelecida.' })
      } else {
        setTestResult('error')
        toast({
          title: 'Erro',
          description: data.error || 'Falha ao conectar com a API Meta.',
          variant: 'destructive'
        })
      }
    } catch {
      setTestResult('error')
      toast({
        title: 'Erro',
        description: 'Erro ao testar conexão. Verifique as credenciais.',
        variant: 'destructive'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (enabled && !initialData.hasAccessToken && !accessToken) {
      toast({
        title: 'Erro',
        description: 'Access Token é obrigatório ao ativar a integração pela primeira vez.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/integrations/whatsapp-official/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          enabled,
          phoneNumberId,
          accessToken: accessToken || undefined,
          businessAccountId,
          webhookVerifyToken
        })
      })

      if (response.ok) {
        toast({ title: 'Sucesso!', description: 'Configurações do WhatsApp Oficial salvas.' })
        router.refresh()
      } else {
        const data = await response.json()
        toast({
          title: 'Erro',
          description: data.error || 'Falha ao salvar configurações.',
          variant: 'destructive'
        })
      }
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="enabled" className="text-sm font-medium">
            Ativar WhatsApp Oficial
          </Label>
          <p className="text-xs text-zinc-500">
            Envie mensagens pela API Oficial do WhatsApp (Meta)
          </p>
        </div>
        <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {/* Phone Number ID */}
      <div className="space-y-2">
        <Label htmlFor="phoneNumberId" className="text-sm font-medium">
          Phone Number ID *
        </Label>
        <Input
          id="phoneNumberId"
          type="text"
          placeholder="123456789012345"
          value={phoneNumberId}
          onChange={(e) => setPhoneNumberId(e.target.value)}
          required
          className="bg-white dark:bg-zinc-900 font-mono text-sm"
        />
        <p className="text-xs text-zinc-500">
          ID do número de telefone no Meta Business Manager → WhatsApp → Configuração
        </p>
      </div>

      {/* Access Token */}
      <div className="space-y-2">
        <Label htmlFor="accessToken" className="text-sm font-medium">
          Access Token *{' '}
          {initialData.hasAccessToken && (
            <span className="text-xs font-normal text-green-600 dark:text-green-400 ml-1">
              ✓ Configurado
            </span>
          )}
        </Label>
        <div className="relative">
          <Input
            id="accessToken"
            type={showToken ? 'text' : 'password'}
            placeholder={
              initialData.hasAccessToken
                ? '••••••••••••••••'
                : 'EAAxxxxx... (token permanente ou de sistema)'
            }
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            required={!initialData.hasAccessToken}
            className="bg-white dark:bg-zinc-900 pr-10 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {initialData.hasAccessToken ? (
          <div className="flex items-start gap-2 text-xs">
            <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <p className="text-green-600 dark:text-green-400">
              Token já configurado e criptografado. Deixe em branco para manter o atual.
            </p>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">
            Token de acesso permanente gerado no Meta Business Manager
          </p>
        )}
      </div>

      {/* Business Account ID (optional) */}
      <div className="space-y-2">
        <Label htmlFor="businessAccountId" className="text-sm font-medium">
          WhatsApp Business Account ID{' '}
          <span className="text-xs font-normal text-zinc-400">(opcional)</span>
        </Label>
        <Input
          id="businessAccountId"
          type="text"
          placeholder="123456789012345"
          value={businessAccountId}
          onChange={(e) => setBusinessAccountId(e.target.value)}
          className="bg-white dark:bg-zinc-900 font-mono text-sm"
        />
        <p className="text-xs text-zinc-500">
          Necessário para identificar a conta nos webhooks recebidos
        </p>
      </div>

      {/* Webhook Verify Token */}
      <div className="space-y-2">
        <Label htmlFor="webhookVerifyToken" className="text-sm font-medium">
          Token de Verificação do Webhook{' '}
          <span className="text-xs font-normal text-zinc-400">(opcional)</span>
        </Label>
        <Input
          id="webhookVerifyToken"
          type="text"
          placeholder="meu-token-secreto-123"
          value={webhookVerifyToken}
          onChange={(e) => setWebhookVerifyToken(e.target.value)}
          className="bg-white dark:bg-zinc-900 font-mono text-sm"
        />
        <p className="text-xs text-zinc-500">
          Token personalizado para verificar o webhook no Meta Business Manager
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleTestConnection}
          disabled={isTesting || !phoneNumberId || !accessToken}
          className="gap-2"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Testando...
            </>
          ) : testResult === 'success' ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Testar Novamente
            </>
          ) : testResult === 'error' ? (
            <>
              <XCircle className="h-4 w-4 text-red-600" />
              Testar Novamente
            </>
          ) : (
            'Testar Conexão'
          )}
        </Button>

        <Button
          type="submit"
          disabled={isLoading || !phoneNumberId}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {tCommon('buttons.saving')}
            </>
          ) : (
            tCommon('buttons.save')
          )}
        </Button>
      </div>

      {/* Test result feedback */}
      {testResult === 'success' && (
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Conexão estabelecida!
              </p>
              {testInfo && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {testInfo.verified_name && <span className="font-medium">{testInfo.verified_name}</span>}
                  {testInfo.display_phone_number && (
                    <span className="ml-2">({testInfo.display_phone_number})</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {testResult === 'error' && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Falha na conexão
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Verifique se o Phone Number ID e o Access Token estão corretos.
              </p>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
