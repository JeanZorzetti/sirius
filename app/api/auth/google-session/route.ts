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

function getBaseUrl(req: NextRequest): string {
  // NEXTAUTH_URL is the canonical external URL
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
  // Fallback: use x-forwarded-host from reverse proxy
  const host = req.headers.get('x-forwarded-host')
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  if (host) return `${proto}://${host}`
  // Last resort (should never happen in production behind proxy)
  return req.url
}

export async function GET(req: NextRequest) {
  const baseUrl = getBaseUrl(req)
  console.log('[google-session] Bridge route hit, baseUrl:', baseUrl)

  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || 'supersecret',
    })

    console.log('[google-session] Token:', token ? { email: token.email, name: token.name } : null)

    if (!token?.email) {
      return NextResponse.redirect(new URL('/login?error=oauth', baseUrl))
    }

    const { email, name } = token

    let user = await prisma.user.findUnique({ where: { email } })
    let isNewUser = false

    if (!user) {
      isNewUser = true
      const slug =
        String(name || email).toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30) +
        '-' + Math.floor(Math.random() * 1000)

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

      // Enroll as lead immediately (even with partial data)
      // complete-profile will enrich later if user completes it
      try {
        const leadsOrgId = process.env.LEADS_PIPELINE_ORG_ID
        if (leadsOrgId) {
          const leadsPipeline = await prisma.pipeline.findFirst({
            where: { organizationId: leadsOrgId, isDefault: true },
            include: { stages: { orderBy: { order: 'asc' }, take: 1 } }
          })
          const leadsOwner = await prisma.user.findFirst({
            where: { organizationId: leadsOrgId, orgRole: 'OWNER' }
          })
          if (leadsPipeline?.stages.length && leadsOwner) {
            const contact = await prisma.contact.create({
              data: {
                name: String(name || email),
                email,
                organizationId: leadsOrgId,
              }
            })
            await prisma.deal.create({
              data: {
                title: `Lead: ${name || email}`,
                stageId: leadsPipeline.stages[0].id,
                pipelineId: leadsPipeline.id,
                organizationId: leadsOrgId,
                userId: leadsOwner.id,
                contactId: contact.id,
                observations: 'Origem: Google OAuth — perfil pendente de conclusão',
              }
            })
          }
        }
      } catch (e) {
        console.error('[google-session] enrollAsLead error:', e)
      }
    }

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

    // New users or users without profile completion go to /complete-profile
    const needsCompletion = isNewUser || !user.phone || !user.jobTitle

    const redirectPath = needsCompletion ? '/complete-profile' : '/dashboard'
    console.log('[google-session] OK — user:', user.email, '→', redirectPath)

    const response = NextResponse.redirect(new URL(redirectPath, baseUrl))
    response.cookies.set('session', sessionToken, {
      expires,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[google-session] Error:', error)
    return NextResponse.redirect(new URL('/login?error=session', baseUrl))
  }
}
