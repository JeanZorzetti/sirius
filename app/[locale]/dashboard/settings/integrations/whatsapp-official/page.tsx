import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WhatsAppOfficialSettingsForm } from '@/components/integrations/whatsapp-official-settings-form'
import { redirect } from 'next/navigation'

export const metadata = { title: "WhatsApp Oficial | Sirius CRM" }

export default async function WhatsAppOfficialPage() {
    const session = await getSession()
    if (!session?.user?.email) {
        return <div>Não autorizado. Faça login novamente.</div>
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            organization: {
                select: {
                    id: true,
                    tier: true,
                    wabaEnabled: true,
                    wabaPhoneNumberId: true,
                    wabaAccessToken: true,
                    wabaBusinessAccountId: true,
                    wabaWebhookVerifyToken: true
                    // wabaAccessToken is intentionally selected only to check existence, never returned to client
                }
            }
        }
    })

    if (!user?.organization) {
        return <div>Usuário não encontrado.</div>
    }

    if (!['PRO', 'BUSINESS'].includes(user.organization.tier)) {
        redirect('/dashboard/settings/integrations')
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seu-crm.com'

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
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            WHATSAPP OFICIAL
                        </h2>
                    </div>
                    <p className="text-sm text-zinc-500 ml-13">
                        API Oficial do WhatsApp Business (Meta Cloud API)
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
                            Configure as credenciais da sua conta WhatsApp Business no Meta
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <WhatsAppOfficialSettingsForm
                            organizationId={user.organization.id}
                            initialData={{
                                enabled: user.organization.wabaEnabled,
                                phoneNumberId: user.organization.wabaPhoneNumberId || '',
                                businessAccountId: user.organization.wabaBusinessAccountId || '',
                                webhookVerifyToken: user.organization.wabaWebhookVerifyToken || '',
                                hasAccessToken: !!user.organization.wabaAccessToken
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Webhook URL card */}
                <Card className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/5">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            URL do Webhook
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-zinc-500 mb-2">
                            Configure esta URL no Meta Business Manager → WhatsApp → Configuração → Webhooks:
                        </p>
                        <code className="block bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded text-xs text-zinc-800 dark:text-zinc-200 break-all">
                            {appUrl}/api/webhooks/whatsapp-official
                        </code>
                        <p className="text-xs text-zinc-400 mt-2">
                            Campos subscritos recomendados: <strong>messages</strong>
                        </p>
                    </CardContent>
                </Card>

                {/* Setup guide */}
                <Card className="bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                            📘 Como configurar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-green-600 dark:text-green-400 space-y-3">
                        <div>
                            <p className="font-medium mb-1">1. Pré-requisitos</p>
                            <p className="text-green-600/80 dark:text-green-400/80">
                                Conta Meta Business Manager, WhatsApp Business Account verificada e número aprovado.
                            </p>
                        </div>
                        <div>
                            <p className="font-medium mb-1">2. Phone Number ID</p>
                            <p className="text-green-600/80 dark:text-green-400/80">
                                No Meta Business Manager → WhatsApp → Configuração → selecione o número e copie o "Phone number ID".
                            </p>
                        </div>
                        <div>
                            <p className="font-medium mb-1">3. Access Token</p>
                            <p className="text-green-600/80 dark:text-green-400/80">
                                Gere um token de sistema permanente em: Meta Business Manager → Configurações → Usuários do sistema → Adicionar usuário de sistema → Gerar token.
                                Selecione o app e permissão <code className="bg-green-100 dark:bg-green-900/30 px-1 rounded">whatsapp_business_messaging</code>.
                            </p>
                        </div>
                        <div>
                            <p className="font-medium mb-1">4. Webhook</p>
                            <p className="text-green-600/80 dark:text-green-400/80">
                                No Meta Business Manager → WhatsApp → Configuração → Webhook, adicione a URL acima e o token de verificação configurado.
                                Subscreva o campo <strong>messages</strong>.
                            </p>
                        </div>
                        <div className="pt-2 border-t border-green-200 dark:border-green-500/20">
                            <p className="font-medium mb-1">Recursos disponíveis:</p>
                            <ul className="list-disc list-inside text-green-600/80 dark:text-green-400/80 space-y-1">
                                <li>Envio de mensagens de texto</li>
                                <li>Envio de templates aprovados pela Meta</li>
                                <li>Recebimento de mensagens via webhook</li>
                                <li>Status de entrega (enviado, entregue, lido)</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
