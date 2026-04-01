import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WhatsmeowConnectCard } from '@/components/integrations/whatsmeow-connect-card'
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
                    tier: true,
                }
            }
        }
    })

    if (!user || !user.organization) {
        return <div>Usuário não encontrado.</div>
    }

    // Require STARTER, PRO or BUSINESS plan
    if (!['STARTER', 'PRO', 'BUSINESS'].includes(user.organization.tier)) {
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
                        Conecte seu WhatsApp via Whatsmeow Gateway
                    </p>
                </div>
            </div>

            <div className="grid gap-6 max-w-2xl">
                <WhatsmeowConnectCard />
            </div>
        </div>
    )
}
