/**
 * SISTEMA DE AUTENTICAÇÃO HÍBRIDO
 * ================================
 *
 * Este projeto usa dois sistemas de auth em paralelo:
 *
 * 1. **Next-Auth v4** (ESTE ARQUIVO):
 *    - OAuth Providers (Google)
 *    - Credentials Provider (email/senha para compatibilidade)
 *    - Apenas usado para autenticação inicial
 *
 * 2. **Sistema Customizado JWT** (lib/auth.ts):
 *    - Gerenciamento de sessões (cookie 'session')
 *    - Middleware de proteção de rotas
 *    - Usado em 99% das páginas e API routes
 *
 * FLUXO:
 * - User faz login via Google → Next-Auth autentica → Redireciona para /dashboard
 * - Sistema customizado cria sessão JWT → Gerencia acesso dali em diante
 *
 * NOTA: Next-Auth usado minimamente. Considerar migração futura para Clerk
 * ou consolidação completa no sistema customizado.
 */

import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { login } from "@/lib/auth"
import bcrypt from "bcryptjs"

async function findOrCreateGoogleUser(email: string, name: string) {
    let user = await prisma.user.findUnique({ where: { email } })
    if (user) return user

    const slug =
        (name || email).toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30) +
        '-' + Math.floor(Math.random() * 1000)

    const org = await prisma.organization.create({
        data: { name: name || email, slug },
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
            (type) => ({ type: type as any, organizationId: org.id, enabled: true, sendDelayMinutes: 0 })
        ),
    })

    const referralCode =
        Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6)

    return prisma.user.create({
        data: {
            email,
            name: name || email,
            password: '',
            organizationId: org.id,
            orgRole: 'OWNER',
            referralCode,
        },
    })
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user) return null

                const isValid = await bcrypt.compare(credentials.password, user.password)

                if (!isValid) return null

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                }
            }
        })
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async signIn({ user, account }) {
            // Only run for Google OAuth
            if (account?.provider !== 'google') return true

            try {
                const email = user.email!
                const name = user.name || email
                const dbUser = await findOrCreateGoogleUser(email, name)
                await login({
                    id: dbUser.id,
                    email: dbUser.email,
                    name: dbUser.name,
                    organizationId: dbUser.organizationId,
                })
                return true
            } catch (err) {
                console.error('[nextauth] signIn callback error:', err)
                return false
            }
        },
        async session({ session, token }) {
            if (token && session.user) {
                // @ts-ignore
                session.user.id = token.id
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async redirect({ url, baseUrl }) {
            if (url.startsWith('/')) return `${baseUrl}${url}`
            if (new URL(url).origin === baseUrl) return url
            return `${baseUrl}/dashboard`
        },
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "supersecret"
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
