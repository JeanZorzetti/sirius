import { redirect } from 'next/navigation'

export default function AnalyticsProPage() {
  redirect('/dashboard/analytics?tab=pro')
}
