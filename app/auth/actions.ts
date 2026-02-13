'use server'

import { PrismaClient } from '@prisma/client'
import { hash, compare } from 'bcryptjs'
import { login, logout } from '@/lib/auth'
import { redirect } from 'next/navigation'
import logger, { generateCorrelationId } from '@/lib/logger'
import { sendWelcomeEmail, sendEmailAsync } from '@/lib/email-automations'

const prisma = new PrismaClient()

export async function registerAction(prevState: any, formData: FormData) {
    const correlationId = generateCorrelationId()
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const companyName = formData.get('company') as string
    const inviteToken = formData.get('inviteToken') as string

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

            const org = await prisma.organization.create({
                data: {
                    name: companyName,
                    slug: slug
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

        // Create User
        // Note: We removed the transaction for simplicity in branching logic, 
        // but in prod we should wrap the create in transaction if strict consistency needed.
        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                organizationId: organizationId,
                orgRole: orgRole
            }
        })

        // If invite used, delete it
        if (inviteToken) {
            await prisma.invite.delete({
                where: { token: inviteToken }
            })
        }

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
