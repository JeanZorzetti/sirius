'use client'

import dynamic from 'next/dynamic'

// These components are client-only and not needed before first paint.
// Loading them lazily removes them from the critical JS bundle.
const AgiChatSidebar = dynamic(
  () => import('@/components/agi').then(m => ({ default: m.AgiChatSidebar })),
  { ssr: false, loading: () => null }
)
const NativeInitializer = dynamic(
  () => import('@/components/mobile/native-initializer').then(m => ({ default: m.NativeInitializer })),
  { ssr: false, loading: () => null }
)
const NetworkStatusBanner = dynamic(
  () => import('@/components/mobile/network-status-banner').then(m => ({ default: m.NetworkStatusBanner })),
  { ssr: false, loading: () => null }
)
const PWAInstallPrompt = dynamic(
  () => import('@/components/pwa-install-prompt').then(m => ({ default: m.PWAInstallPrompt })),
  { ssr: false, loading: () => null }
)
const SignUpTracker = dynamic(
  () => import('@/components/analytics/signup-tracker').then(m => ({ default: m.SignUpTracker })),
  { ssr: false, loading: () => null }
)
const LoginTracker = dynamic(
  () => import('@/components/analytics/login-tracker').then(m => ({ default: m.LoginTracker })),
  { ssr: false, loading: () => null }
)
const AccessTracker = dynamic(
  () => import('@/components/analytics/access-tracker').then(m => ({ default: m.AccessTracker })),
  { ssr: false, loading: () => null }
)

export function DashboardShellClient() {
  return (
    <>
      <AgiChatSidebar />
      <NativeInitializer />
      <NetworkStatusBanner />
      <PWAInstallPrompt />
      <SignUpTracker />
      <LoginTracker />
      <AccessTracker />
    </>
  )
}
