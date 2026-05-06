import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRoleFeatures } from '@/lib/role-permissions'
import { FeatureBlocked } from '@/components/feature-blocked'

export default async function AgendaLayout({ children }: { children: React.ReactNode }) {
    const session = await getSession()
    if (!session?.user?.email) return <>{children}</>

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { organizationId: true, orgRole: true },
    })

    if (!user) return <>{children}</>

    const features = await getRoleFeatures(user.organizationId, user.orgRole)
    if (!features.canAccessAgenda) {
        return <FeatureBlocked feature="Agenda" />
    }

    return <>{children}</>
}
