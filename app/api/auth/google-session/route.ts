/**
 * Google OAuth Session Bridge
 *
 * After Next-Auth completes Google auth, it redirects here.
 * This route reads the Next-Auth session, finds/creates the user in DB,
 * creates the custom JWT session cookie, then redirects to /dashboard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { login } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const nextAuthSession = await getServerSession(authOptions)

    if (!nextAuthSession?.user?.email) {
      return NextResponse.redirect(new URL('/login?error=oauth', req.url))
    }

    const { email, name } = nextAuthSession.user

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      // New user via Google — create org + user
      const slug =
        (name || email)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .substring(0, 30) +
        '-' +
        Math.floor(Math.random() * 1000)

      const org = await prisma.organization.create({
        data: { name: name || email, slug },
      })

      // Default pipeline
      const pipeline = await prisma.pipeline.create({
        data: { name: 'Pipeline Principal', isDefault: true, organizationId: org.id },
      })

      await prisma.pipelineStage.createMany({
        data: [
          { name: 'Lead', order: 0, organizationId: org.id, pipelineId: pipeline.id },
          { name: 'Prospecção', order: 1, organizationId: org.id, pipelineId: pipeline.id },
          { name: 'Qualificação', order: 2, organizationId: org.id, pipelineId: pipeline.id },
          { name: 'Proposta', order: 3, organizationId: org.id, pipelineId: pipeline.id },
          { name: 'Fechamento', order: 4, organizationId: org.id, pipelineId: pipeline.id },
        ],
      })

      await prisma.emailAutomationSetting.createMany({
        data: ['WELCOME_EMAIL', 'DEAL_CREATED', 'DEAL_STAGE_CHANGED', 'UPGRADE_NUDGE'].map(
          (type) => ({
            type: type as any,
            organizationId: org.id,
            enabled: true,
            sendDelayMinutes: 0,
          })
        ),
      })

      // Generate referral code
      const referralCode =
        Math.random().toString(36).substring(2, 6) +
        Math.random().toString(36).substring(2, 6)

      user = await prisma.user.create({
        data: {
          email,
          name: name || email,
          password: '', // No password for OAuth users
          organizationId: org.id,
          orgRole: 'OWNER',
          referralCode,
        },
      })
    }

    // Create custom JWT session
    await login({
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
    })

    return NextResponse.redirect(new URL('/dashboard', req.url))
  } catch (error) {
    console.error('[google-session] Error:', error)
    return NextResponse.redirect(new URL('/login?error=session', req.url))
  }
}
