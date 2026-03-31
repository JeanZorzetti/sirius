import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Você foi convidado | Sirius CRM',
  robots: 'noindex, nofollow',
}

export default async function ReferralPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  // Validate referral code exists
  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true, name: true }
  })

  if (!referrer) {
    redirect('/register')
  }

  // Set referral cookie (30 days) and redirect to register
  const cookieStore = await cookies()
  cookieStore.set('referral_code', code, {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  })

  redirect('/register?ref=' + code)
}
