import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WhatsAppSettingsForm } from '@/components/integrations/whatsapp-settings-form'
import { redirect } from 'next/navigation'

export const metadata = { title: "WhatsApp | Sirius CRM" }

export default async function WhatsAppIntegrationPage() {
    const session = await getSession()
    if (!session || !session.user || !session.user.email) {
        return <div>Não autorizado. Faça login novamente.</div>
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            organization: {
                select: {
                    id: true,
                    plan: true,
                    evolutionEnabled: true,
                    evolutionBaseUrl: true,
                    evolutionInstance: true
                    // Note: We don't select evolutionApiKey for security (it's encrypted)
                }
            }
        }
    })

    if (!user || !user.organization) {
        return <div>Usuário não encontrado.</div>
    }

    // Require PRO or BUSINESS plan
    if (!['PRO', 'BUSINESS'].includes(user.organization.tier)) {
        redirect('/dashboard/settings/integrations')
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

            <div className="flex items-center justify-between space-y-2">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                            <MessageCircle className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            INTEGRAÇÃO WHATSAPP
                        </h2>
                    </div>
                    <p className="text-sm text-zinc-500 ml-13">
                        Configure a integração com Evolution API para mensagens WhatsApp
                    </p>
                </div>
            </div>

            <div className="grid gap-6 max-w-2xl">
                <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            Configuração
                        </CardTitle>
                        <CardDescription className="text-zinc-500 text-xs">
                            Configure as credenciais da sua instância Evolution API
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <WhatsAppSettingsForm
                            organizationId={user.organization.id}
                            initialData={{
                                enabled: user.organization.evolutionEnabled,
                                baseUrl: user.organization.evolutionBaseUrl || '',
                                instanceName: user.organization.evolutionInstance || ''
                            }}
                        />
                    </CardContent>
                </Card>

                <Card className="bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                            📘 Como configurar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-green-600 dark:text-green-400 space-y-3">
                        <div>
                            <p className="font-medium mb-1">1. Evolution API</p>
                            <p className="text-green-600/80 dark:text-green-400/80">
                                Você precisa ter uma instância Evolution API rodando.
                                Repositório: https://github.com/EvolutionAPI/evolution-api
                            </p>
                        </div>
                        <div>
                            <p className="font-medium mb-1">2. URL Base</p>
                            <p className="text-green-600/80 dark:text-green-400/80">
                                URL da sua instância Evolution API (ex: https://evolution.seudominio.com)
                            </p>
                        </div>
                        <div>
                            <p className="font-medium mb-1">3. API Key</p>
                            <p className="text-green-600/80 dark:text-green-400/80">
                                A API Key global da sua instância Evolution API (configurada no .env)
                            </p>
                        </div>
                        <div>
                            <p className="font-medium mb-1">4. Nome da Instância</p>
                            <p className="text-green-600/80 dark:text-green-400/80">
                                O nome da instância WhatsApp que você criou na Evolution API
                            </p>
                        </div>
                        <div className="pt-2 border-t border-green-200 dark:border-green-500/20">
                            <p className="font-medium mb-1">Recursos disponíveis:</p>
                            <ul className="list-disc list-inside text-green-600/80 dark:text-green-400/80 space-y-1">
                                <li>Enviar mensagens manuais a partir de deals</li>
                                <li>Enviar mensagens automáticas (mudança de stage, etc.)</li>
                                <li>Receber mensagens e criar deals automaticamente</li>
                                <li>Rastrear status de entrega (enviado, entregue, lido)</li>
                            </ul>
                        </div>
                        <div className="pt-2 border-t border-green-200 dark:border-green-500/20">
                            <p className="font-medium mb-1">⚠️ Configurar Webhook:</p>
                            <p className="text-green-600/80 dark:text-green-400/80">
                                Após salvar, configure o webhook da Evolution API para:
                                <br />
                                <code className="bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded text-[11px] mt-1 inline-block">
                                    {process.env.NEXT_PUBLIC_APP_URL || 'https://seu-crm.com'}/api/webhooks/evolution
                                </code>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
