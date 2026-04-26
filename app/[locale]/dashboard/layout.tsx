import { Sidebar } from '@/components/dashboard/sidebar'
import { BottomNav } from '@/components/dashboard/bottom-nav'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { SignUpTracker } from '@/components/analytics/signup-tracker'
import { LoginTracker } from '@/components/analytics/login-tracker'
import { PostHogUserIdentifier } from '@/components/analytics/posthog-user-identifier'
import { AgiChatSidebar } from '@/components/agi'
import { NativeInitializer } from '@/components/mobile/native-initializer'
import { NetworkStatusBanner } from '@/components/mobile/network-status-banner'
import { PageTransition } from '@/components/mobile/page-transition'
import { AppBarProvider } from '@/components/mobile/app-bar-context'
import { MobileAppBar } from '@/components/mobile/app-bar'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  let user = session?.user

  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (dbUser) {
      user = dbUser
    }
  }

  if (!user) {
    redirect('/login')
  }

  return (
    <AppBarProvider>
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - hidden on mobile, visible on desktop */}
      <aside className="hidden lg:block">
        <Sidebar user={user} />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile app bar — contextual per route, replaces static header */}
        <MobileAppBar />

        {/* Page content — padding-bottom mobile reserva espaço para BottomNav (h-14 + safe-area) */}
        <main className="flex-1 overflow-y-auto pb-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] lg:p-6 lg:pb-6">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* Bottom Navigation - mobile only, thumb-friendly */}
      <BottomNav />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Analytics Trackers */}
      <SignUpTracker />
      <LoginTracker />
      <PostHogUserIdentifier user={user} />

      {/* AGI Chat Sidebar - Global AI Assistant */}
      <AgiChatSidebar />

      {/* Mobile/Native App Initializer - registers push notifications & offline sync */}
      <NativeInitializer />

      {/* Network status banner — offline / pending sync */}
      <NetworkStatusBanner />
    </div>
    </AppBarProvider>
  )
}
