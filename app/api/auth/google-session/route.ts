/**
 * Google OAuth Session Bridge
 *
 * After Next-Auth completes Google auth, it redirects here.
 * This route decodes the Next-Auth JWT token from the cookie,
 * finds/creates the user in DB, creates the custom JWT session
 * cookie on the response, then redirects to /dashboard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/auth'

export async function GET(req: NextRequest) {
  console.log('[google-session] Bridge route hit')
  console.log('[google-session] Cookies:', req.cookies.getAll().map(c => c.name).join(', '))
  console.log('[google-session] NEXTAUTH_SECRET set:', !!process.env.NEXTAUTH_SECRET)
  try {
    // Read the Next-Auth JWT directly from the cookie
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || 'supersecret',
    })

    console.log('[google-session] Token result:', token ? { email: token.email, name: token.name } : null)

    if (!token?.email) {
      console.error('[google-session] No token or email found')
      return NextResponse.redirect(new URL('/login?error=oauth', req.url))
    }

    const { email, name } = token

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      // New user via Google — create org + user
      const slug =
        (String(name || email))
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .substring(0, 30) +
        '-' +
        Math.floor(Math.random() * 1000)

      const org = await prisma.organization.create({
        data: { name: String(name || email), slug },
      })

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

      const referralCode =
        Math.random().toString(36).substring(2, 6) +
        Math.random().toString(36).substring(2, 6)

      user = await prisma.user.create({
        data: {
          email,
          name: String(name || email),
          password: '',
          organizationId: org.id,
          orgRole: 'OWNER',
          referralCode,
        },
      })
    }

    // Create custom JWT session and set it on the redirect response
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const sessionToken = await encrypt({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organizationId,
      },
      expires,
    })

    console.log('[google-session] User found/created:', { id: user.id, email: user.email })
    console.log('[google-session] Session token length:', sessionToken.length)

    const redirectUrl = new URL('/dashboard', req.url)
    console.log('[google-session] Redirecting to:', redirectUrl.toString())

    const response = NextResponse.redirect(redirectUrl)
    response.cookies.set('session', sessionToken, {
      expires,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })

    console.log('[google-session] Response headers Set-Cookie:', response.headers.get('set-cookie')?.substring(0, 100))

    return response
  } catch (error) {
    console.error('[google-session] Error:', error)
    return NextResponse.redirect(new URL('/login?error=session', req.url))
  }
}
