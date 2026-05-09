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

interface N8NSettingsFormProps {
    organizationId: string
    initialData: {
        enabled: boolean
        baseUrl: string
        webhookUrl: string
    }
}

export function N8NSettingsForm({ organizationId, initialData }: N8NSettingsFormProps) {
    const tCommon = useTranslations('common')
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
    const [showApiKey, setShowApiKey] = useState(false)

    const [enabled, setEnabled] = useState(initialData.enabled)
    const [baseUrl, setBaseUrl] = useState(initialData.baseUrl)
    const [apiKey, setApiKey] = useState('')
    const [webhookUrl, setWebhookUrl] = useState(initialData.webhookUrl)

    const handleTestConnection = async () => {
        if (!baseUrl || !apiKey) {
            toast({
                title: 'Erro',
                description: 'Preencha a URL Base e a API Key antes de testar a conexão.',
                variant: 'destructive'
            })
            return
        }

        setIsTesting(true)
        setTestResult(null)

        try {
            const response = await fetch('/api/integrations/n8n/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId,
                    baseUrl,
                    apiKey
                })
            })

            const data = await response.json()

            if (data.success) {
                setTestResult('success')
                toast({
                    title: 'Sucesso!',
                    description: 'Conexão com N8N estabelecida com sucesso.',
                })
            } else {
                setTestResult('error')
                toast({
                    title: 'Erro',
                    description: data.error || 'Falha ao conectar com N8N.',
                    variant: 'destructive'
                })
            }
        } catch (error) {
            setTestResult('error')
            toast({
                title: 'Erro',
                description: 'Erro ao testar conexão. Verifique a URL e a API Key.',
                variant: 'destructive'
            })
        } finally {
            setIsTesting(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch('/api/integrations/n8n/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId,
                    enabled,
                    baseUrl,
                    apiKey: apiKey || undefined, // Only send if provided
                    webhookUrl: webhookUrl || undefined
                })
            })

            if (response.ok) {
                toast({
                    title: 'Sucesso!',
                    description: 'Configurações do N8N salvas com sucesso.',
                })
                router.refresh()
            } else {
                const data = await response.json()
                toast({
                    title: 'Erro',
                    description: data.error || 'Falha ao salvar configurações.',
                    variant: 'destructive'
                })
            }
        } catch (error) {
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
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label htmlFor="enabled" className="text-sm font-medium">
                        Ativar N8N
                    </Label>
                    <p className="text-xs text-zinc-500">
                        Enviar eventos do CRM para N8N automaticamente
                    </p>
                </div>
                <Switch
                    id="enabled"
                    checked={enabled}
                    onCheckedChange={setEnabled}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="baseUrl" className="text-sm font-medium">
                    URL Base do N8N *
                </Label>
                <Input
                    id="baseUrl"
                    type="url"
                    placeholder="https://n8n.seudominio.com"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    required
                    className="bg-white dark:bg-zinc-900"
                />
                <p className="text-xs text-zinc-500">
                    URL da sua instância N8N (sem barra final)
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-sm font-medium">
                    API Key *
                </Label>
                <div className="relative">
                    <Input
                        id="apiKey"
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="Digite sua API Key do N8N"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        required={!initialData.baseUrl} // Required only if not previously configured
                        className="bg-white dark:bg-zinc-900 pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                <p className="text-xs text-zinc-500">
                    {initialData.baseUrl
                        ? 'Deixe em branco para manter a API Key atual'
                        : 'Obtenha em N8N → Settings → API'}
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="webhookUrl" className="text-sm font-medium">
                    Webhook URL (opcional)
                </Label>
                <Input
                    id="webhookUrl"
                    type="url"
                    placeholder="https://n8n.seudominio.com/webhook/..."
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="bg-white dark:bg-zinc-900"
                />
                <p className="text-xs text-zinc-500">
                    URL do webhook no N8N que receberá eventos do CRM
                </p>
            </div>

            <div className="flex items-center gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTesting || !baseUrl || !apiKey}
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
                    disabled={isLoading || !baseUrl}
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

            {testResult === 'success' && (
                <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                Conexão estabelecida!
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                Sua instância N8N está acessível e configurada corretamente.
                            </p>
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
                                Verifique se a URL está correta e a API Key é válida.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </form>
    )
}
