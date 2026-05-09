import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PipelineManagementClient } from "./pipeline-management-client"
import { Badge } from "@/components/ui/badge"
import { getTranslations } from "next-intl/server"

export const metadata = { title: "Pipelines | Sirius CRM" }

export default async function PipelinesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })
  const session = await getSession()
  if (!session || !session.user || !session.user.email) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { organization: true }
  })

  if (!user || !user.organizationId) {
    return <div>{t('errors.userNoOrg')}</div>
  }

  const pipelines = await prisma.pipeline.findMany({
    where: { organizationId: user.organizationId },
    include: {
      _count: {
        select: {
          stages: true,
          deals: true
        }
      }
    },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'asc' }
    ]
  })

  const isPro = ['PRO', 'BUSINESS'].includes(user.organization.tier)

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('pages.pipelines.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('pages.pipelines.subtitle')}
          </p>
        </div>
        {!isPro && pipelines.length >= 1 && (
          <Badge variant="outline" className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
            <span className="mr-1">⭐</span> Múltiplos Pipelines é PRO
          </Badge>
        )}
      </div>

      <PipelineManagementClient pipelines={pipelines} isPro={isPro} />
    </div>
  )
}
