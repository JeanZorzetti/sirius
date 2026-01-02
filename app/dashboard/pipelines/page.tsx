import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PipelineManagementClient } from "./pipeline-management-client"

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Pipelines</h1>
        <p className="text-muted-foreground mt-2">
          Crie e gerencie múltiplos pipelines para organizar seus negócios
        </p>
      </div>

      <PipelineManagementClient pipelines={pipelines} />
    </div>
  )
}
