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
import { mono, texto } from "./fontes-hoje"
import "./hoje.css" // the screen's direction, scoped to [data-tela="hoje"] (spec 009)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'dashboard' })
  return { title: `${t('pages.pipeline.title')} - CRM` }
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
              wabaEnabled: true,
              evolutionEnabled: true,
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
    const hasWhatsApp = Boolean(user.organization?.wabaEnabled || user.organization?.evolutionEnabled)

    return (
      <OnboardingWrapper
        userId={user.id}
        userName={user.name || undefined}
        shouldShowOnboarding={shouldShowOnboarding}
        hasWhatsApp={hasWhatsApp}
      >
        <AnimatedPageContainer>
          {/* The pipeline's name is the title and the searches join the top row (spec 009, direction "Hoje") */}
          <div data-tela="hoje" className={`${texto.variable} ${mono.variable} h-full`}>
            <Suspense fallback={<DashboardTabsSkeleton />}>
              <DashboardTabsWrapper
                userId={user.id}
                userName={user.name || ""}
                organizationId={user.organizationId}
                vsearch={vsearch}
                csearch={csearch}
                buscas={
                  // the inputs are borderless by design: the capsule is their field, and it shows the keyboard focus
                  // keys: these children cross the server→client boundary as a list
                  <div className="flex items-center rounded-[var(--radius)] border border-input bg-card focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
                    <Suspense key="valor">
                      <ValueSearch />
                    </Suspense>
                    <div key="divisor" className="h-6 w-px bg-border" />
                    <Suspense key="contato">
                      <ContactSearch />
                    </Suspense>
                  </div>
                }
              />
            </Suspense>
          </div>
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
