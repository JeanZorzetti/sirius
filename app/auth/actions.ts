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

    if (!name || !email || !password || !companyName) {
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
        // 2. Create Org and User in transaction
        const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000)

        // We do this sequentially or ideally in a transaction
        // Prisma transaction
        const newUser = await prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: {
                    name: companyName,
                    slug: slug
                }
            })

            const hashedPassword = await hash(password, 10)

            const user = await tx.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword,
                    organizationId: org.id
                }
            })

            return user
        })

        // 3. Create Session
        // We only store essential info in session
        await login({ id: newUser.id, email: newUser.email, name: newUser.name, organizationId: newUser.organizationId })

    } catch (error: any) {
        console.error('SERVER REGISTRATION ERROR:', JSON.stringify(error, null, 2))

        // Check for Prisma specific errors
        if (error.code === 'P2002') {
            return { error: 'Este e-mail ou nome da empresa já está em uso.' }
        }

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
