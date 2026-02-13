import { Metadata } from "next"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PipelineManagementClient } from "./pipeline-management-client"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = { title: "Pipelines | Sirius CRM" }

export default async function PipelinesPage() {
  const session = await getSession()
  if (!session || !session.user || !session.user.email) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { organization: true }
  })

  if (!user || !user.organizationId) {
    return <div>Usuário não pertence a uma organização.</div>
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

  const isPro = ['PRO', 'BUSINESS'].includes(user.organization.plan)

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Pipelines</h1>
          <p className="text-muted-foreground mt-2">
            Crie e gerencie múltiplos pipelines para organizar seus negócios
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
