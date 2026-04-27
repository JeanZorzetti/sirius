import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WhatsmeowConnectCard } from '@/components/integrations/whatsmeow-connect-card'
import { redirect } from 'next/navigation'

export const metadata = { title: "WhatsApp Oficial | Sirius CRM" }

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
                    tier: true,
                }
            }
        }
    })

    if (!user || !user.organization) {
        return <div>Usuário não encontrado.</div>
    }

    // Apenas BUSINESS pode usar WhatsApp via API Oficial Meta
    if (user.organization.tier !== 'BUSINESS') {
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

                <div className="max-w-lg space-y-5">
                    {/* Aviso Meta */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                        <div className="flex gap-3">
                            <span className="text-2xl flex-shrink-0">⚠️</span>
                            <div className="space-y-2">
                                <p className="font-semibold text-amber-900 text-sm">
                                    Por que o WhatsApp mudou de plano?
                                </p>
                                <p className="text-amber-800 text-sm leading-relaxed">
                                    A Meta está banindo números que utilizam APIs não oficiais do WhatsApp (Evolution API, Baileys e similares). Para proteger seu negócio, o Sirius CRM migrou para a <strong>API Oficial do WhatsApp Business (Meta Cloud API)</strong> — a única integração permitida pelos Termos de Uso da Meta.
                                </p>
                                <a
                                    href="https://faq.whatsapp.com/5957850900902049"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-amber-700 underline underline-offset-2 hover:text-amber-900 transition-colors"
                                >
                                    Fonte oficial: WhatsApp Help Center →
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="rounded-xl border bg-card p-6 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                            <MessageCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="font-semibold text-foreground">WhatsApp Oficial disponível no plano Business</h2>
                            <p className="text-sm text-muted-foreground">
                                Conecte via API Oficial Meta. Sem risco de banimento, com suporte a templates, mídia e status em tempo real.
                            </p>
                        </div>
                        <Link href="/dashboard/billing/plans">
                            <Button className="w-full">Fazer Upgrade para Business</Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
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
                            WHATSAPP OFICIAL
                        </h2>
                    </div>
                    <p className="text-sm text-zinc-500 ml-13">
                        API Oficial do WhatsApp Business (Meta Cloud API)
                    </p>
                </div>
            </div>

            <div className="grid gap-6 max-w-2xl">
                <WhatsmeowConnectCard />
            </div>
        </div>
    )
}
