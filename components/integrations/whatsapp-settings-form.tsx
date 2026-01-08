'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WhatsAppSettingsFormProps {
    organizationId: string
    initialData: {
        enabled: boolean
        baseUrl: string
        instanceName: string
    }
}

export function WhatsAppSettingsForm({ organizationId, initialData }: WhatsAppSettingsFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
    const [showApiKey, setShowApiKey] = useState(false)

    const [enabled, setEnabled] = useState(initialData.enabled)
    const [baseUrl, setBaseUrl] = useState(initialData.baseUrl)
    const [apiKey, setApiKey] = useState('')
    const [instanceName, setInstanceName] = useState(initialData.instanceName)

    const handleTestConnection = async () => {
        if (!baseUrl || !apiKey || !instanceName) {
            toast({
                title: 'Erro',
                description: 'Preencha todos os campos obrigatórios antes de testar a conexão.',
                variant: 'destructive'
            })
            return
        }

        setIsTesting(true)
        setTestResult(null)

        try {
            const response = await fetch('/api/integrations/whatsapp/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId,
                    baseUrl,
                    apiKey,
                    instanceName
                })
            })

            const data = await response.json()

            if (data.success) {
                setTestResult('success')
                toast({
                    title: 'Sucesso!',
                    description: 'Conexão com Evolution API estabelecida com sucesso.',
                })
            } else {
                setTestResult('error')
                toast({
                    title: 'Erro',
                    description: data.error || 'Falha ao conectar com Evolution API.',
                    variant: 'destructive'
                })
            }
        } catch (error) {
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
        setIsLoading(true)

        try {
            const response = await fetch('/api/integrations/whatsapp/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId,
                    enabled,
                    baseUrl,
                    apiKey: apiKey || undefined, // Only send if provided
                    instanceName
                })
            })

            if (response.ok) {
                toast({
                    title: 'Sucesso!',
                    description: 'Configurações do WhatsApp salvas com sucesso.',
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
                        Ativar WhatsApp
                    </Label>
                    <p className="text-xs text-zinc-500">
                        Enviar e receber mensagens WhatsApp automaticamente
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
                    URL Base da Evolution API *
                </Label>
                <Input
                    id="baseUrl"
                    type="url"
                    placeholder="https://evolution.seudominio.com"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    required
                    className="bg-white dark:bg-zinc-900"
                />
                <p className="text-xs text-zinc-500">
                    URL da sua instância Evolution API (sem barra final)
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
                        placeholder="Digite sua API Key da Evolution API"
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
                        : 'API Key global da Evolution API (do arquivo .env)'}
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="instanceName" className="text-sm font-medium">
                    Nome da Instância *
                </Label>
                <Input
                    id="instanceName"
                    type="text"
                    placeholder="minha-instancia"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                    required
                    className="bg-white dark:bg-zinc-900"
                />
                <p className="text-xs text-zinc-500">
                    Nome da instância WhatsApp criada na Evolution API
                </p>
            </div>

            <div className="flex items-center gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTesting || !baseUrl || !apiKey || !instanceName}
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
                    disabled={isLoading || !baseUrl || !instanceName}
                    className="gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        'Salvar Configurações'
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
                                Sua instância Evolution API está acessível e configurada corretamente.
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
                                Verifique se a URL, API Key e nome da instância estão corretos.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </form>
    )
}
