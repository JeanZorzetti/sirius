import { Sidebar } from '@/components/dashboard/sidebar'
import { BottomNav } from '@/components/dashboard/bottom-nav'
import { PostHogUserIdentifier } from '@/components/analytics/posthog-user-identifier'
import { DashboardShellClient } from '@/components/dashboard/dashboard-shell-client'
import { AppBarProvider } from '@/components/mobile/app-bar-context'
import { MobileAppBar } from '@/components/mobile/app-bar'
import { TrialBanner } from '@/components/plan/trial-banner'
import { getSession } from '@/lib/auth'
import { getDashboardUser } from '@/lib/dashboard-user'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session?.user?.email) {
    redirect('/login')
  }

  // Cached per user — avoids DB hit on every navigation
  const dbUser = await getDashboardUser(session.user.email)
  if (!dbUser) {
    redirect('/login')
  }

  const orgTrialInfo = {
    tier: dbUser.organization.tier,
    trialEndsAt: dbUser.organization.trialEndsAt ? new Date(dbUser.organization.trialEndsAt) : null,
    trialStatus: dbUser.organization.trialStatus,
  }

  return (
    <AppBarProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar — hidden on mobile */}
        <aside className="hidden md:block">
          <Sidebar user={dbUser} />
        </aside>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Trial banner — shows for FREE orgs during/after trial */}
          <TrialBanner
            tier={orgTrialInfo.tier}
            trialEndsAt={orgTrialInfo.trialEndsAt}
            trialStatus={orgTrialInfo.trialStatus}
          />

          {/* Mobile app bar — contextual per route */}
          <MobileAppBar />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto pb-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] md:p-4 md:pb-4 lg:p-6 lg:pb-6">
            {children}
          </main>
        </div>

        {/* Bottom Navigation — mobile only */}
        <BottomNav />

        {/* PostHog needs user data — kept inline (ssr:false would lose user prop) */}
        <PostHogUserIdentifier user={dbUser} />

        {/* Heavy client-only components — lazily loaded after first paint */}
        <DashboardShellClient />
      </div>
    </AppBarProvider>
  )
}
