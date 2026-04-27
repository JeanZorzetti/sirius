import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WhatsAppOfficialSettingsForm } from '@/components/integrations/whatsapp-official-settings-form'
import { WhatsAppSetupCta } from '@/components/integrations/whatsapp-setup-cta'
import { redirect } from 'next/navigation'

export const metadata = { title: "WhatsApp Oficial | Sirius CRM" }

export default async function WhatsAppOfficialPage({ searchParams }: { searchParams: Promise<{ setup_paid?: string }> }) {
    const { setup_paid } = await searchParams
    const setupPaid = setup_paid === '1'

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
                    wabaWebhookVerifyToken: true,
                    wabaGrandfathered: true,
                }
            }
        }
    })

    if (!user?.organization) {
        return <div>Usuário não encontrado.</div>
    }

    const hasAccess = user.organization.tier === 'BUSINESS' || user.organization.wabaGrandfathered
    if (!hasAccess) {
        redirect('/dashboard/settings/integrations/whatsapp-official/upgrade')
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seu-crm.com'

    const whatsappMessage = encodeURIComponent(
        `*Implantação WhatsApp Oficial — Sirius CRM*\n\n✅ Serviço: Implantação WhatsApp Oficial\n💳 Valor: R$ 297 (pago)\n\n📋 Preencha as informações abaixo:\n\n[ ] Chip virgem nunca conectado ao WhatsApp: SIM / NÃO\n\n[ ] Facebook da empresa:\n    Login (e-mail): ___________\n    Senha: ___________\n\n[ ] Meta Business Manager verificada: SIM / NÃO\n\n[ ] CNPJ da empresa: ___________\n\n[ ] Nome da empresa: ___________`
    )
    const whatsappUrl = `https://wa.me/5562998015884?text=${whatsappMessage}`

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

            {/* CTA TOPO */}
            <WhatsAppSetupCta variant="top" whatsappUrl={whatsappUrl} setupPaid={setupPaid} />

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
                <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            📘 Como configurar
                        </CardTitle>
                        <CardDescription className="text-zinc-500 text-xs">
                            Siga os passos abaixo para conectar o WhatsApp Oficial via Meta Cloud API
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        {/* PRÉ-REQUISITO EM DESTAQUE */}
                        <div className="rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 p-4">
                            <div className="flex items-start gap-3">
                                <span className="text-xl shrink-0 mt-0.5">⚠️</span>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                                        Pré-requisito obrigatório: Meta Business Manager verificada
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                        Você precisa de uma conta <strong>Meta Business Manager verificada</strong> (com CNPJ ou verificação de negócio aprovada pela Meta) e uma <strong>WhatsApp Business Account (WABA)</strong> associada a ela. Sem isso, não é possível gerar tokens nem configurar webhooks.
                                    </p>
                                    <a
                                        href="https://business.facebook.com/settings"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 underline underline-offset-2 hover:text-amber-900 transition-colors mt-1"
                                    >
                                        Acessar Meta Business Manager →
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* PASSO 1 */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0">
                                    <span className="text-[11px] font-bold text-white dark:text-zinc-900">1</span>
                                </div>
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Criar um aplicativo no Facebook Developers</p>
                            </div>
                            <div className="ml-8 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                                <p>Acesse <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline underline-offset-2">developers.facebook.com/apps</a> e crie um novo app do tipo <strong>Business</strong>.</p>
                                <ol className="list-decimal list-inside space-y-1 text-zinc-500 dark:text-zinc-500">
                                    <li>Clique em <strong>Criar aplicativo</strong></li>
                                    <li>Selecione o tipo <strong>Business</strong></li>
                                    <li>Dê um nome e vincule ao seu Business Manager</li>
                                    <li>No painel do app, vá em <strong>Adicionar produto</strong> → selecione <strong>WhatsApp</strong></li>
                                </ol>
                                <div className="rounded-lg bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 px-3 py-2">
                                    <p className="text-blue-700 dark:text-blue-400">
                                        💡 O app precisa estar vinculado à mesma Business Manager que contém sua WABA.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-zinc-100 dark:border-white/5" />

                        {/* PASSO 2 */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0">
                                    <span className="text-[11px] font-bold text-white dark:text-zinc-900">2</span>
                                </div>
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Obter o Phone Number ID</p>
                            </div>
                            <div className="ml-8 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                                <p>No Facebook Developers → seu app → <strong>WhatsApp → Configuração de API</strong>:</p>
                                <ol className="list-decimal list-inside space-y-1 text-zinc-500 dark:text-zinc-500">
                                    <li>Selecione sua WABA na lista</li>
                                    <li>Copie o <strong>Phone number ID</strong> (formato: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">1234567890</code>)</li>
                                </ol>
                                <p className="text-zinc-400 dark:text-zinc-500">Também disponível em: Meta Business Manager → WhatsApp → Configuração → número de telefone.</p>
                            </div>
                        </div>

                        <div className="border-t border-zinc-100 dark:border-white/5" />

                        {/* PASSO 3 */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0">
                                    <span className="text-[11px] font-bold text-white dark:text-zinc-900">3</span>
                                </div>
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Gerar o Access Token permanente</p>
                            </div>
                            <div className="ml-8 text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
                                <p>Tokens temporários expiram em 24h. Use um <strong>token de sistema permanente</strong>:</p>
                                <ol className="list-decimal list-inside space-y-1 text-zinc-500 dark:text-zinc-500">
                                    <li>No Meta Business Manager → <strong>Configurações</strong> → <strong>Usuários</strong> → <strong>Usuários do sistema</strong></li>
                                    <li>Clique em <strong>Adicionar</strong> → escolha <em>Admin</em> ou <em>Funcionário</em></li>
                                    <li>Clique em <strong>Gerar novo token</strong> → selecione seu app</li>
                                    <li>Marque as permissões: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">whatsapp_business_messaging</code> e <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">whatsapp_business_management</code></li>
                                    <li>Copie o token gerado (ele não é exibido novamente)</li>
                                </ol>
                                <div className="rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 px-3 py-2">
                                    <p className="text-red-700 dark:text-red-400">
                                        🔐 Guarde o token em local seguro. Ele dá acesso completo ao envio de mensagens.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-zinc-100 dark:border-white/5" />

                        {/* PASSO 4 */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0">
                                    <span className="text-[11px] font-bold text-white dark:text-zinc-900">4</span>
                                </div>
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Configurar o Webhook</p>
                            </div>
                            <div className="ml-8 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                                <p>No Facebook Developers → seu app → <strong>WhatsApp → Configuração</strong>:</p>
                                <ol className="list-decimal list-inside space-y-1 text-zinc-500 dark:text-zinc-500">
                                    <li>Em <strong>Webhooks</strong>, clique em <strong>Configurar</strong></li>
                                    <li>Cole a <strong>URL do Webhook</strong> exibida acima</li>
                                    <li>Cole o <strong>Token de Verificação</strong> que você definiu no formulário</li>
                                    <li>Clique em <strong>Verificar e salvar</strong></li>
                                    <li>Ative o campo <strong>messages</strong> nas assinaturas</li>
                                </ol>
                            </div>
                        </div>

                        <div className="border-t border-zinc-100 dark:border-white/5" />

                        {/* RECURSOS */}
                        <div className="rounded-xl bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20 p-4">
                            <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">✅ Recursos disponíveis após configuração</p>
                            <ul className="space-y-1 text-xs text-green-600/80 dark:text-green-400/80">
                                <li>• Envio e recebimento de mensagens de texto</li>
                                <li>• Envio de templates aprovados pela Meta</li>
                                <li>• Status em tempo real: enviado, entregue, lido</li>
                                <li>• Recebimento de mensagens via webhook</li>
                                <li>• Chat center integrado ao CRM</li>
                            </ul>
                        </div>

                    </CardContent>
                </Card>
            </div>

            {/* CTA RODAPÉ */}
            <WhatsAppSetupCta variant="bottom" whatsappUrl={whatsappUrl} />
        </div>
    )
}
