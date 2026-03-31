import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { N8NSettingsForm } from '@/components/integrations/n8n-settings-form'
import { redirect } from 'next/navigation'

export const metadata = { title: "N8N | Sirius CRM" }

export default async function N8NIntegrationPage() {
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
                    tier: true,
                    n8nEnabled: true,
                    n8nBaseUrl: true,
                    n8nWebhookUrl: true
                    // Note: We don't select n8nApiKey for security (it's encrypted)
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
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                            <Workflow className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            INTEGRAÇÃO N8N
                        </h2>
                    </div>
                    <p className="text-sm text-zinc-500 ml-13">
                        Configure a integração com N8N para automação de workflows
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
                            Configure as credenciais e URLs da sua instância N8N
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <N8NSettingsForm
                            organizationId={user.organization.id}
                            initialData={{
                                enabled: user.organization.n8nEnabled,
                                baseUrl: user.organization.n8nBaseUrl || '',
                                webhookUrl: user.organization.n8nWebhookUrl || ''
                            }}
                        />
                    </CardContent>
                </Card>

                <Card className="bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            📘 Como configurar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-blue-600 dark:text-blue-400 space-y-3">
                        <div>
                            <p className="font-medium mb-1">1. URL Base do N8N</p>
                            <p className="text-blue-600/80 dark:text-blue-400/80">
                                URL da sua instância N8N (ex: https://n8n.seudominio.com)
                            </p>
                        </div>
                        <div>
                            <p className="font-medium mb-1">2. API Key</p>
                            <p className="text-blue-600/80 dark:text-blue-400/80">
                                Obtenha em: N8N → Settings → API → Generate API Key
                            </p>
                        </div>
                        <div>
                            <p className="font-medium mb-1">3. Webhook URL (opcional)</p>
                            <p className="text-blue-600/80 dark:text-blue-400/80">
                                URL do webhook no N8N que receberá eventos do CRM.
                                Crie um workflow com trigger "Webhook" e cole a URL aqui.
                            </p>
                        </div>
                        <div className="pt-2 border-t border-blue-200 dark:border-blue-500/20">
                            <p className="font-medium mb-1">Eventos enviados:</p>
                            <ul className="list-disc list-inside text-blue-600/80 dark:text-blue-400/80 space-y-1">
                                <li>deal.created</li>
                                <li>deal.updated</li>
                                <li>deal.stage_changed</li>
                                <li>contact.created</li>
                                <li>contact.updated</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
