import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession, decrypt } from '@/lib/auth'

export async function middleware(request: NextRequest) {
    // 1. Redirect invalid/malformed URLs to homepage (SEO fix)
    const pathname = request.nextUrl.pathname
    const malformedPatterns = ['/mês', '/mes', '/month']

    if (malformedPatterns.some(pattern => pathname.includes(pattern))) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 2. Update session expiration if it exists
    const response = await updateSession(request)

    const sessionCookie = request.cookies.get('session')?.value

    // 3. Protected Routes Logic
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!sessionCookie) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Optional: Verify validity here if paranoid, but updateSession does basic decrypt
    }

    // 4. Auth Routes (redirect to dashboard if already logged in)
    if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')) {
        if (sessionCookie) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return response || NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/register', '/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
