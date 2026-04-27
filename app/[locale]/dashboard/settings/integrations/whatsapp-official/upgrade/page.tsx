import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Zap, BarChart3, Clock, Users, CheckCircle2, ArrowRight, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export const metadata = { title: "WhatsApp Oficial — Upgrade | Sirius CRM" }

export default async function WhatsAppUpgradePage() {
    const session = await getSession()
    if (!session?.user?.email) redirect('/login')

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { organization: { select: { tier: true, wabaGrandfathered: true } } }
    })

    // Already has access — redirect to config page
    if (user?.organization?.tier === 'BUSINESS' || user?.organization?.wabaGrandfathered) {
        redirect('/dashboard/settings/integrations/whatsapp-official')
    }

    return (
        <div className="flex-1 p-8 pt-6 max-w-3xl">

            {/* Back */}
            <div className="mb-6">
                <Link href="/dashboard/settings/integrations">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Button>
                </Link>
            </div>

            {/* Hero */}
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center ring-1 ring-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                        <MessageSquare className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-widest">WhatsApp Oficial</p>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                            API Oficial Meta — plano Business
                        </h1>
                    </div>
                </div>

                {/* Main hook */}
                <div className="rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-700/50 p-7 mt-6">
                    <p className="text-3xl font-bold text-white leading-tight tracking-tight">
                        Nunca mais tenha o<br />
                        <span className="text-green-400">WhatsApp bloqueado.</span>
                    </p>
                    <p className="text-sm text-zinc-400 mt-3 leading-relaxed max-w-lg">
                        A Meta está banindo números que usam integrações não oficiais. Com a API Oficial, sua empresa opera dentro das regras — sem risco de perder o número que seus clientes já conhecem.
                    </p>
                    <div className="mt-5 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs text-green-400 font-medium">Única integração permitida pelos Termos de Uso do WhatsApp</span>
                    </div>
                </div>
            </div>

            {/* Arguments */}
            <div className="space-y-3 mb-10">
                {[
                    {
                        icon: ShieldCheck,
                        color: 'text-green-500',
                        bg: 'bg-green-500/8',
                        title: 'Zero risco de banimento',
                        description: 'A API Oficial é homologada diretamente pela Meta. Sem brechas, sem gambiarras — seu número está seguro.',
                    },
                    {
                        icon: Zap,
                        color: 'text-yellow-500',
                        bg: 'bg-yellow-500/8',
                        title: 'Status em tempo real',
                        description: 'Veja exatamente quando a mensagem foi entregue, lida e respondida — direto no CRM.',
                    },
                    {
                        icon: BarChart3,
                        color: 'text-blue-500',
                        bg: 'bg-blue-500/8',
                        title: 'Templates aprovados pela Meta',
                        description: 'Dispare mensagens proativas (cobrança, follow-up, confirmação de reunião) usando templates oficiais.',
                    },
                    {
                        icon: Clock,
                        color: 'text-purple-500',
                        bg: 'bg-purple-500/8',
                        title: 'Uptime de operadora, não de app',
                        description: 'Diferente do WhatsApp Web, a API não depende de celular conectado. Fica online 24/7.',
                    },
                    {
                        icon: Users,
                        color: 'text-orange-500',
                        bg: 'bg-orange-500/8',
                        title: 'Multiagente nativo',
                        description: 'Toda a equipe atende pelo mesmo número. Sem revisar histórico de celular pessoal.',
                    },
                ].map(({ icon: Icon, color, bg, title, description }) => (
                    <div key={title} className="flex items-start gap-4 rounded-xl border border-zinc-100 dark:border-white/5 bg-white dark:bg-white/[0.02] p-4">
                        <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`h-4 w-4 ${color}`} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pricing CTA */}
            <div className="rounded-2xl border-2 border-green-500/30 bg-green-50 dark:bg-green-500/5 p-6">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                    <div>
                        <p className="text-xs text-green-700 dark:text-green-400 font-semibold uppercase tracking-widest mb-1">Plano Business</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">R$ 397</span>
                            <span className="text-sm text-zinc-500">/mês</span>
                        </div>
                        <div className="mt-3 space-y-1.5">
                            {[
                                '5 instâncias WhatsApp Oficial',
                                'Contatos e negócios ilimitados',
                                'Até 50 usuários',
                                'Chat center com multiagente',
                                'Suporte dedicado',
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 justify-center">
                        <Link href="/dashboard/billing/plans">
                            <Button className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm px-6">
                                Fazer upgrade para Business
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <p className="text-[11px] text-zinc-400 text-center">Cancele quando quiser. Sem fidelidade.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
