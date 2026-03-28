'use client'

import { useEffect, useState, useCallback } from 'react'
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

  const handleClose = useCallback(() => {
    setShowWelcome(false)
    // Persist dismissal so modal doesn't reappear on refresh
    fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SKIPPED' })
    }).catch(() => {})
  }, [])

  return (
    <TourProvider>
      <WelcomeModal
        open={showWelcome}
        onClose={handleClose}
        userName={userName}
      />
      {children}
    </TourProvider>
  )
}

