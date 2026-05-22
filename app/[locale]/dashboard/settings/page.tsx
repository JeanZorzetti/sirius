import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { SettingsLayout } from '@/components/settings/settings-layout'
import { SettingsClient } from './client'
import { SettingsSkeleton } from '@/components/settings/settings-skeleton'
import { getTranslations } from 'next-intl/server'

export const metadata = { title: "Configurações | Sirius CRM" }

export default async function SettingsPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'dashboard' })
    const session = await getSession()
    if (!session || !session.user || !session.user.email) {
        return <div>{t('errors.unauthorized')}</div>
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            name: true,
            email: true,
            organization: { select: { name: true, tier: true } },
        }
    })

    if (!user) return <div>{t('errors.notFound')}</div>

    return (
        <SettingsLayout organizationName={user.organization?.name}>
            <Suspense fallback={<SettingsSkeleton />}>
                <SettingsClient
                    user={{
                        name: user.name,
                        email: user.email,
                        organization: user.organization ? {
                            name: user.organization.name,
                            tier: user.organization.tier,
                        } : null,
                    }}
                />
            </Suspense>
        </SettingsLayout>
    )
}
