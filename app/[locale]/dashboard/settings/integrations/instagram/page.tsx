import { Suspense } from 'react'
import InstagramSettingsClient from './InstagramSettingsClient'

export default function InstagramSettingsPage() {
  return (
    <Suspense fallback={null}>
      <InstagramSettingsClient />
    </Suspense>
  )
}
