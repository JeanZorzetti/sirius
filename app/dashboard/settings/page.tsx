import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/settings/profile-form'
import { User, Users, Key, Webhook, Zap, Bell } from 'lucide-react'
import Link from 'next/link'
import { getSession } from '@/lib/auth'

export default async function SettingsPage() {
    // CRITICAL FIX: Get authenticated user from session
    const session = await getSession()
    if (!session || !session.user || !session.user.email) {
        return <div>Não autorizado. Faça login novamente.</div>
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { organization: true }
    })

    if (!user) return <div>Usuário não encontrado.</div>

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">CONFIGURAÇÕES</h2>
                    <p className="text-sm text-zinc-500">Gerencie suas preferências e dados da conta.</p>
                </div>
            </div>

            <div className="grid gap-6 max-w-2xl">
                <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
                        <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                            <User className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Perfil</CardTitle>
                            <CardDescription className="text-zinc-500 text-xs">Atualize suas informações pessoais</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ProfileForm initialData={{ name: user.name || '', email: user.email }} />
                    </CardContent>
                </Card>

                <Link href="/dashboard/settings/team">
                    <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                <Users className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Time</CardTitle>
                                <CardDescription className="text-zinc-500 text-xs">Gerencie membros e convites</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/dashboard/settings/notifications">
                    <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                <Bell className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Notificações</CardTitle>
                                <CardDescription className="text-zinc-500 text-xs">Configure suas preferências de notificação</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/dashboard/settings/api">
                    <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
                            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                                <Key className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">API Keys</CardTitle>
                                <CardDescription className="text-zinc-500 text-xs">Gerencie chaves de API para integrações</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/dashboard/settings/webhooks">
                    <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                <Webhook className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                    Webhooks
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20">PRO</span>
                                </CardTitle>
                                <CardDescription className="text-zinc-500 text-xs">Configure webhooks para receber eventos</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>

                <Link href="/dashboard/settings/integrations">
                    <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                                <Zap className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                    Integrações
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20">PRO</span>
                                </CardTitle>
                                <CardDescription className="text-zinc-500 text-xs">N8N, WhatsApp e Google Calendar</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
