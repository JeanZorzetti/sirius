import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession, decrypt } from '@/lib/auth'

export async function middleware(request: NextRequest) {
    // 1. Update session expiration if it exists
    const response = await updateSession(request)

    const sessionCookie = request.cookies.get('session')?.value

    // 2. Protected Routes Logic
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!sessionCookie) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Optional: Verify validity here if paranoid, but updateSession does basic decrypt
    }

    // 3. Auth Routes (redirect to dashboard if already logged in)
    if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')) {
        if (sessionCookie) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return response || NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/register'],
}
