'use client'

import { analytics } from '@/lib/posthog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ComponentPropsWithoutRef } from 'react'

interface TrackedSignupButtonProps extends ComponentPropsWithoutRef<typeof Button> {
  href: string
  source?: string
  plan?: string
}

export function TrackedSignupButton({
  href,
  source,
  plan,
  children,
  onClick,
  ...props
}: TrackedSignupButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Rastrear clique no signup
    analytics.clickSignup({ source, plan })

    // Chamar onClick se existir
    onClick?.(e)
  }

  return (
    <Button asChild {...props}>
      <Link href={href} onClick={handleClick as any}>
        {children}
      </Link>
    </Button>
  )
}
