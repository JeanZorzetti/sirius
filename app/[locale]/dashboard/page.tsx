import { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { OnboardingWrapper } from "@/components/onboarding/onboarding-wrapper"
import { DashboardTabsWrapper } from "@/components/dashboard/dashboard-tabs-wrapper"
import { DashboardTabsSkeleton } from "@/components/skeletons/dashboard-tabs-skeleton"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ValueSearch } from "./analytics/value-search"
import { ContactSearch } from "./analytics/contact-search"
import { getTranslations } from "next-intl/server"

import { AnimatedPageContainer } from "@/components/dashboard/animated-page-container"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard.pages.pipeline' })
  return { title: `${t('title')} - CRM` }
}

export const dynamic = "force-dynamic"

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ vsearch?: string; csearch?: string }>
}) {
  const { vsearch, csearch } = await searchParams
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })

  try {
    const session = await getSession()

    if (!session || !session.user || !session.user.email) {
      return <div>{t('errors.unauthorized')}</div>
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
          phone: true,
          jobTitle: true,
          createdAt: true,
          organization: {
            select: {
              plan: true,
              segment: true,
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
      return <div>{t('errors.fetchUser')}</div>
    }

    if (!user || !user.organizationId) {
      return <div>{t('errors.userNoOrg')}</div>
    }

    // Block dashboard only for NEW users (account < 24h) who haven't completed their profile.
    // Existing users already in the system are let through regardless of missing fields.
    const isNewAccount = (Date.now() - new Date(user.createdAt).getTime()) < 24 * 60 * 60 * 1000
    if (isNewAccount && (!user.phone || !user.jobTitle || !user.organization?.segment)) {
      redirect('/complete-profile')
    }

    const shouldShowOnboarding =
      !user.onboarding || user.onboarding.status === "IN_PROGRESS"

    return (
      <OnboardingWrapper
        userId={user.id}
        userName={user.name || undefined}
        shouldShowOnboarding={shouldShowOnboarding}
      >
        <AnimatedPageContainer>
          {/* Desktop header — hidden on mobile (handled by MobileAppBar) */}
          <div className="hidden lg:flex flex-col sm:flex-row sm:items-center justify-between mb-6 flex-wrap gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground/90">{t('pages.pipeline.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('pages.pipeline.subtitle')}</p>
            </div>

            <div className="flex items-center gap-3 bg-muted/40 p-1.5 rounded-2xl border border-border/50 backdrop-blur-md">
              <Suspense>
                <ValueSearch />
              </Suspense>
              <div className="w-px h-8 bg-border/50" />
              <Suspense>
                <ContactSearch />
              </Suspense>
            </div>
          </div>

          <Suspense fallback={<DashboardTabsSkeleton />}>
            <DashboardTabsWrapper
              userId={user.id}
              userName={user.name || ""}
              organizationId={user.organizationId}
              vsearch={vsearch}
              csearch={csearch}
            />
          </Suspense>
        </AnimatedPageContainer>
      </OnboardingWrapper>
    )
  } catch (error: any) {
    // Next.js redirect() throws internally — must re-throw so it works correctly
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error
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
