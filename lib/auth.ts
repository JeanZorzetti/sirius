/**
 * SISTEMA DE AUTENTICAÇÃO CUSTOMIZADO
 * ====================================
 *
 * Sistema principal de gerenciamento de sessões do Sirius CRM.
 * Usa JWT (via biblioteca 'jose') armazenado em cookie httpOnly.
 *
 * FEATURES:
 * - JWT Session (24h expiration, auto-refresh no middleware)
 * - Cookie httpOnly (previne XSS)
 * - SameSite: lax (previne CSRF)
 * - Usado em middleware, API routes e páginas
 *
 * COMPLEMENTA:
 * - Next-Auth v4 (app/api/auth/[...nextauth]/route.ts) para OAuth social
 * - Este sistema gerencia TODAS as sessões após login inicial
 *
 * FUNÇÕES:
 * - encrypt/decrypt: Criptografia JWT
 * - getSession: Pegar sessão atual (usado em 90% das rotas)
 * - login: Criar sessão após autenticação
 * - logout: Destruir sessão
 * - updateSession: Refresh automático no middleware
 */

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Lazy getter — validated at runtime, not at import/build time
function getKey(): Uint8Array {
    const secret = process.env.SESSION_SECRET
    if (!secret) {
        throw new Error(
            'SESSION_SECRET environment variable is required. ' +
            'Generate a secure random string with: openssl rand -base64 32'
        )
    }
    return new TextEncoder().encode(secret)
}

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(getKey())
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, getKey(), {
        algorithms: ['HS256'],
    })
    return payload
}

export async function getSession() {
    const session = (await cookies()).get('session')?.value
    if (!session) return null
    try {
        return await decrypt(session)
    } catch (error) {
        return null
    }
}

/**
 * Auth guard for API routes. Returns session or 401 Response.
 * Usage:
 *   const auth = await requireAuth()
 *   if (auth instanceof Response) return auth
 *   // auth.user is available
 */
export async function requireAuth() {
    const session = await getSession()
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return session
}

export async function login(userData: any) {
    // Create the session
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    const session = await encrypt({ user: userData, expires })

    // Validate we can save cookies
    const cookieStore = await cookies()
    cookieStore.set('session', session, { expires, httpOnly: true, sameSite: 'lax', path: '/' })
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.set('session', '', { expires: new Date(0), path: '/' })
}

// 6h threshold: only refresh if token expires within 6h (avoids re-encrypting every request)
const REFRESH_THRESHOLD_MS = 6 * 60 * 60 * 1000

export type SessionRefreshResult =
  | { refreshed: false }
  | { refreshed: true; cookieValue: string; expires: Date }
  | { invalid: true }

export async function maybeRefreshSession(request: NextRequest): Promise<SessionRefreshResult> {
    const session = request.cookies.get('session')?.value
    if (!session) return { refreshed: false }

    // Skip refresh on OPTIONS and Next.js data requests
    if (
        request.method === 'OPTIONS' ||
        request.nextUrl.pathname.startsWith('/_next/data')
    ) {
        return { refreshed: false }
    }

    try {
        const parsed = await decrypt(session)
        const expiresAt = parsed.expires ? new Date(parsed.expires).getTime() : 0
        const now = Date.now()

        // Only re-encrypt when within the refresh window
        if (expiresAt - now > REFRESH_THRESHOLD_MS) {
            return { refreshed: false }
        }

        const newExpires = new Date(now + 24 * 60 * 60 * 1000)
        parsed.expires = newExpires
        const cookieValue = await encrypt(parsed)
        return { refreshed: true, cookieValue, expires: newExpires }
    } catch {
        // Invalid/expired/corrupted token
        return { invalid: true }
    }
}

// Kept for backwards compat — not used internally anymore
export async function updateSession(request: NextRequest) {
    const result = await maybeRefreshSession(request)
    if ('invalid' in result) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.set('session', '', { expires: new Date(0), path: '/' })
        return response
    }
    if ('cookieValue' in result) {
        const res = NextResponse.next()
        res.cookies.set({ name: 'session', value: result.cookieValue, httpOnly: true, expires: result.expires, sameSite: 'lax', path: '/' })
        return res
    }
}
