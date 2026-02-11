import { Metadata } from "next"
import { Suspense } from "react"
import { OnboardingWrapper } from "@/components/onboarding/onboarding-wrapper"
import { DashboardTabsWrapper } from "@/components/dashboard/dashboard-tabs-wrapper"
import { DashboardTabsSkeleton } from "@/components/skeletons/dashboard-tabs-skeleton"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Pipelines - CRM",
}

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  try {
    const session = await getSession()

    if (!session || !session.user || !session.user.email) {
      return <div>Não autorizado. Faça login novamente.</div>
    }

    // Only fetch user data (required for auth + onboarding)
    // Heavy queries (pipelines/stages) deferred to DashboardTabsWrapper
    let user
    try {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          name: true,
          organizationId: true,
          orgRole: true,
          organization: {
            select: {
              plan: true,
            },
          },
          onboarding: {
            select: {
              status: true,
            },
          },
        },
      })
    } catch (err: any) {
      console.error("[DASHBOARD_PAGE] Falha ao buscar usuário:", err.message)
      return <div>Erro ao buscar usuário: {err.message}</div>
    }

    if (!user || !user.organizationId) {
      return <div>Usuário não pertence a uma organização.</div>
    }

    const isMember = user.orgRole === "MEMBER"
    const shouldShowOnboarding =
      !user.onboarding || user.onboarding.status === "IN_PROGRESS"

    return (
      <OnboardingWrapper
        userId={user.id}
        userName={user.name || undefined}
        shouldShowOnboarding={shouldShowOnboarding}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>

          <Suspense fallback={<DashboardTabsSkeleton />}>
            <DashboardTabsWrapper
              userId={user.id}
              userName={user.name || ""}
              organizationId={user.organizationId}
              isMember={isMember}
            />
          </Suspense>
        </div>
      </OnboardingWrapper>
    )
  } catch (error: any) {
    console.error("[DASHBOARD_PAGE] Erro crítico:", error.message)
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Erro ao carregar Dashboard
        </h1>
        <div className="bg-red-50 p-4 rounded text-red-800">
          <p className="font-mono text-sm">{error.message}</p>
        </div>
      </div>
    )
  }
}
