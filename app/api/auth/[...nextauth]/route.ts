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
import bcrypt from "bcryptjs"

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
            console.log('[nextauth] redirect callback:', { url, baseUrl })
            // After Google OAuth, always go to bridge that creates custom JWT
            if (url.includes('/api/auth/google-session')) return url
            if (url.startsWith('/')) return `${baseUrl}/api/auth/google-session`
            if (new URL(url).origin === baseUrl) return `${baseUrl}/api/auth/google-session`
            return `${baseUrl}/api/auth/google-session`
        },
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "supersecret"
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
