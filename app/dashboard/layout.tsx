import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { UserNav } from '@/components/dashboard/user-nav'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { SignUpTracker } from '@/components/analytics/signup-tracker'
import { LoginTracker } from '@/components/analytics/login-tracker'
import { PostHogUserIdentifier } from '@/components/analytics/posthog-user-identifier'
import { AgiChatSidebar } from '@/components/agi'
import { ResizableDrawer } from '@/components/chat/resizable-drawer'
import { NativeInitializer } from '@/components/mobile/native-initializer'
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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - hidden on mobile, visible on desktop */}
      <aside className="hidden lg:block">
        <Sidebar />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-15 lg:px-6">
          <MobileNav />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <ModeToggle />
            <UserNav user={user} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Analytics Trackers */}
      <SignUpTracker />
      <LoginTracker />
      <PostHogUserIdentifier user={user} />

      {/* AGI Chat Sidebar - Global AI Assistant */}
      <AgiChatSidebar />

      {/* WhatsApp Chat Drawer - Floating Button with Resize */}
      <ResizableDrawer
        userId={user.id || ''}
        userName={user.name || ''}
        organizationId={(user as any).organizationId || ''}
      />

      {/* Mobile/Native App Initializer - registers push notifications & offline sync */}
      <NativeInitializer />
    </div>
  )
}
