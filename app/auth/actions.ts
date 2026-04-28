'use server'

import { prisma } from '@/lib/prisma'
import { hash, compare } from 'bcryptjs'
import { login, logout } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import logger, { generateCorrelationId } from '@/lib/logger'
import { sendWelcomeEmail, sendEmailAsync } from '@/lib/email-automations'

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6)
}

async function enrollAsLead({ name, email, whatsapp, companyName, jobTitle, segment }: {
  name: string, email: string, whatsapp: string | null, companyName: string | null, jobTitle: string | null, segment: string | null
}) {
  const leadsOrgId = process.env.LEADS_PIPELINE_ORG_ID
  if (!leadsOrgId) {
    logger.warn({ email }, '[enrollAsLead] LEADS_PIPELINE_ORG_ID not set, skipping')
    return
  }
  logger.info({ email, leadsOrgId }, '[enrollAsLead] Starting enrollment')

  // Find the default pipeline for the leads org
  const pipeline = await prisma.pipeline.findFirst({
    where: { organizationId: leadsOrgId, isDefault: true },
    include: { stages: { orderBy: { order: 'asc' }, take: 1 } }
  })
  if (!pipeline || !pipeline.stages.length) return

  const firstStage = pipeline.stages[0]

  // Find owner/admin user of that org to assign the deal
  const owner = await prisma.user.findFirst({
    where: { organizationId: leadsOrgId, orgRole: 'OWNER' }
  })
  if (!owner) return

  // Upsert contact (avoid duplicates on email)
  let contact = email
    ? await prisma.contact.findFirst({ where: { organizationId: leadsOrgId, email } })
    : null

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        name,
        email: email || null,
        phone: whatsapp || null,
        company: companyName || null,
        organizationId: leadsOrgId,
      }
    })
  }

  // Create deal only if none exists for this contact in this pipeline
  const existingDeal = await prisma.deal.findFirst({
    where: { contactId: contact.id, pipelineId: pipeline.id }
  })
  if (existingDeal) return

  const observations = [
    jobTitle && `Cargo: ${jobTitle}`,
    segment && `Segmento: ${segment}`,
  ].filter(Boolean).join(' | ') || null

  await prisma.deal.create({
    data: {
      title: companyName ? `Lead: ${name} — ${companyName}` : `Lead: ${name}`,
      stageId: firstStage.id,
      pipelineId: pipeline.id,
      organizationId: leadsOrgId,
      userId: owner.id,
      contactId: contact.id,
      observations,
    }
  })
}

export async function registerAction(prevState: any, formData: FormData) {
    const correlationId = generateCorrelationId()
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const companyName = formData.get('company') as string
    const inviteToken = formData.get('inviteToken') as string
    const phone = (formData.get('phone') as string)?.trim() || null
    const jobTitle = (formData.get('jobTitle') as string)?.trim() || null
    const companyDescription = (formData.get('companyDescription') as string)?.trim() || null
    const segment = (formData.get('segment') as string)?.trim() || null
    // Legacy field: keep whatsapp as alias for phone
    const whatsapp = phone || (formData.get('whatsapp') as string)?.trim() || null

    logger.info({ correlationId, email, hasInvite: !!inviteToken }, 'Registration attempt')

    if (!name || !email || !password) {
        logger.warn({ correlationId, email }, 'Registration failed: missing fields')
        return { error: 'Preencha todos os campos.' }
    }

    // 1. Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (existingUser) {
        logger.warn({ correlationId, email }, 'Registration failed: email already exists')
        return { error: 'Email já cadastrado.' }
    }

    try {
        let organizationId = ""
        let orgRole: "OWNER" | "MEMBER" = "OWNER" // Default new org = OWNER

        // A. JOINING EXISTING ORG via INVITE
        if (inviteToken) {
            const invite = await prisma.invite.findUnique({
                where: { token: inviteToken },
                include: { organization: true }
            })

            if (!invite) {
                return { error: 'Convite inválido ou expirado.' }
            }

            if (invite.expiresAt < new Date()) {
                return { error: 'Convite expirado.' }
            }

            // Verify email matches (optional safety, sometimes user uses diff email)
            // Let's allow different email, but user should know.

            organizationId = invite.organizationId
            orgRole = "MEMBER"
        }
        // B. CREATING NEW ORG
        else {
            if (!companyName) return { error: 'Nome da empresa é obrigatório.' }

            const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000)

            const trialStartedAt = new Date()
            const trialEndsAt = new Date(trialStartedAt.getTime() + 7 * 24 * 60 * 60 * 1000)

            const org = await prisma.organization.create({
                data: {
                    name: companyName,
                    slug: slug,
                    description: companyDescription || null,
                    segment: segment || null,
                    trialStartedAt,
                    trialEndsAt,
                    trialStatus: 'ACTIVE',
                }
            })
            organizationId = org.id

            // Create default pipeline for new organization
            const defaultPipeline = await prisma.pipeline.create({
                data: {
                    name: 'Pipeline Principal',
                    isDefault: true,
                    organizationId: org.id
                }
            })

            // Create default pipeline stages
            const defaultStages = [
                { name: 'Lead', order: 0 },
                { name: 'Prospecção', order: 1 },
                { name: 'Qualificação', order: 2 },
                { name: 'Proposta', order: 3 },
                { name: 'Fechamento', order: 4 }
            ]

            await prisma.pipelineStage.createMany({
                data: defaultStages.map(stage => ({
                    ...stage,
                    organizationId: org.id,
                    pipelineId: defaultPipeline.id
                }))
            })

            // Create default email automation settings (all enabled by default)
            await prisma.emailAutomationSetting.createMany({
                data: [
                    'WELCOME_EMAIL',
                    'DEAL_CREATED',
                    'DEAL_STAGE_CHANGED',
                    'UPGRADE_NUDGE',
                ].map(type => ({
                    type: type as any,
                    organizationId: org.id,
                    enabled: true,
                    sendDelayMinutes: 0,
                }))
            })
        }

        const hashedPassword = await hash(password, 10)

        // Generate unique referral code
        let referralCode = generateReferralCode()
        // Ensure uniqueness (very unlikely collision but safe)
        const existing = await prisma.user.findUnique({ where: { referralCode } })
        if (existing) referralCode = generateReferralCode() + Math.floor(Math.random() * 99)

        // Create User
        // Note: We removed the transaction for simplicity in branching logic,
        // but in prod we should wrap the create in transaction if strict consistency needed.
        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                organizationId: organizationId,
                orgRole: orgRole,
                referralCode,
                jobTitle: jobTitle || null,
                phone: phone || null,
            }
        })

        // If invite used, delete it
        if (inviteToken) {
            await prisma.invite.delete({
                where: { token: inviteToken }
            })
        }

        // Check for referral cookie (set when visiting /r/[code])
        try {
            const cookieStore = await cookies()
            const referredByCode = cookieStore.get('referral_code')?.value
            if (referredByCode) {
                const referrer = await prisma.user.findUnique({ where: { referralCode: referredByCode } })
                if (referrer && referrer.id !== newUser.id) {
                    await prisma.referral.create({
                        data: {
                            referrerId: referrer.id,
                            referredUserId: newUser.id,
                            referredOrgId: organizationId,
                            referredEmail: email,
                            status: 'PENDING'
                        }
                    })
                }
                // Clear cookie
                cookieStore.delete('referral_code')
            }
        } catch {
            // Referral tracking is non-critical, don't fail registration
        }

        // Enroll new registrant as a lead in the owner's pipeline (async, non-blocking)
        enrollAsLead({ name, email, whatsapp, companyName: companyName || null, jobTitle: jobTitle || null, segment: segment || null }).catch((err) => {
            logger.error({ err, email }, '[enrollAsLead] Failed to enroll lead')
        })

        // 3. Create Session
        await login({ id: newUser.id, email: newUser.email, name: newUser.name, organizationId: newUser.organizationId })

        logger.info({ correlationId, email, organizationId, userId: newUser.id }, 'Registration successful')

        // 4. Send welcome email (async, non-blocking)
        // Only send for new organizations (OWNER role)
        if (orgRole === 'OWNER') {
            const org = await prisma.organization.findUnique({
                where: { id: organizationId }
            })

            if (org) {
                sendEmailAsync(
                    sendWelcomeEmail({
                        to: email,
                        userName: name,
                        organizationName: org.name,
                        organizationId: organizationId,
                        userId: newUser.id
                    })
                )
            }
        }

    } catch (error: any) {
        logger.error({ correlationId, email, err: error }, 'Registration error')
        return { error: `Erro interno: ${error.message || 'Falha desconhecida'}` }
    }

    // Return null on success (client will handle redirect)
    return null
}

export async function loginAction(prevState: any, formData: FormData) {
    const correlationId = generateCorrelationId()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    logger.info({ correlationId, email }, 'Login attempt')

    if (!email || !password) {
        logger.warn({ correlationId, email }, 'Login failed: missing fields')
        return { error: 'Preencha todos os campos.' }
    }

    const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true }
    })

    if (!user) {
        logger.warn({ correlationId, email }, 'Login failed: user not found')
        return { error: 'Credenciais inválidas.' }
    }

    const isValid = await compare(password, user.password)

    if (!isValid) {
        logger.warn({ correlationId, email, userId: user.id }, 'Login failed: invalid password')
        return { error: 'Credenciais inválidas.' }
    }

    await login({ id: user.id, email: user.email, name: user.name, organizationId: user.organizationId })

    logger.info({ correlationId, email, userId: user.id, organizationId: user.organizationId }, 'Login successful')

    // Return null on success (client will handle redirect)
    return null
}

export async function logoutAction() {
    await logout()
    redirect('/login')
}
