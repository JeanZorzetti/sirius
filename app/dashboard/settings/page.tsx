import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { SettingsLayout } from '@/components/settings/settings-layout'
import { SettingsClient } from './client'
import { SettingsSkeleton } from '@/components/settings/settings-skeleton'

export const metadata = { title: "Configurações | Sirius CRM" }

export default async function SettingsPage() {
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
        <SettingsLayout organizationName={user.organization?.name}>
            <Suspense fallback={<SettingsSkeleton />}>
                <SettingsClient
                    user={{
                        name: user.name,
                        email: user.email,
                        organization: user.organization ? {
                            name: user.organization.name,
                            plan: user.organization.tier,
                        } : null,
                    }}
                />
            </Suspense>
        </SettingsLayout>
    )
}
