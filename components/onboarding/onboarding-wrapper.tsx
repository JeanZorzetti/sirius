'use client'

import { useEffect, useState } from 'react'
import { WelcomeModal } from './welcome-modal'
import { TourProvider } from './product-tour'

interface OnboardingWrapperProps {
  children: React.ReactNode
  userId: string
  userName?: string
  shouldShowOnboarding: boolean
}

export function OnboardingWrapper({
  children,
  userId,
  userName,
  shouldShowOnboarding
}: OnboardingWrapperProps) {
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    // Show welcome modal if user is new (no onboarding completed)
    if (shouldShowOnboarding) {
      // Small delay for better UX
      setTimeout(() => {
        setShowWelcome(true)
      }, 500)
    }
  }, [shouldShowOnboarding])

  return (
    <TourProvider>
      <WelcomeModal
        open={showWelcome}
        onClose={() => setShowWelcome(false)}
        userName={userName}
      />
      {children}
    </TourProvider>
  )
}
