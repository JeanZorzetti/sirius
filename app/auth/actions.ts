'use server'

import { PrismaClient } from '@prisma/client'
import { hash, compare } from 'bcryptjs'
import { login, logout } from '@/lib/auth'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

export async function registerAction(prevState: any, formData: FormData) {
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const companyName = formData.get('company') as string
    const inviteToken = formData.get('inviteToken') as string

    if (!name || !email || !password) {
        return { error: 'Preencha todos os campos.' }
    }

    // 1. Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    })

    if (existingUser) {
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

            // Create default pipeline stages for new organization
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
                    organizationId: org.id
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

    } catch (error: any) {
        console.error('SERVER REGISTRATION ERROR:', JSON.stringify(error, null, 2))
        return { error: `Erro interno: ${error.message || 'Falha desconhecida'}` }
    }

    redirect('/dashboard')
}

export async function loginAction(prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Preencha todos os campos.' }
    }

    const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true }
    })

    if (!user) {
        return { error: 'Credenciais inválidas.' }
    }

    const isValid = await compare(password, user.password)

    if (!isValid) {
        return { error: 'Credenciais inválidas.' }
    }

    await login({ id: user.id, email: user.email, name: user.name, organizationId: user.organizationId })

    redirect('/dashboard')
}

export async function logoutAction() {
    await logout()
    redirect('/login')
}
