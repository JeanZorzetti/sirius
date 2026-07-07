import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { maybeRefreshSession } from '@/lib/auth'

const intlMiddleware = createMiddleware(routing)

// NOTE: keep the `middleware` convention for now. Next 16.1.1 deprecates it in
// favor of `proxy`, but its Turbopack build silently DROPS a proxy.ts entry
// (empty middleware-manifest = unprotected routes). Revisit on the next Next upgrade.
export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // 1. Redirect malformed URLs (SEO fix)
    // /mês is handled by next.config redirects() (→ /pricing, 301) — kept out of
    // here to avoid a duplicate redirect to a different destination. See spec 001 C5.
    const malformedPatterns = ['/mes', '/month']
    if (malformedPatterns.some(pattern => pathname.includes(pattern))) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 2. Strip /en prefix for locale-agnostic auth checks
    const pathnameWithoutLocale = pathname.replace(/^\/en/, '') || '/'

    const sessionCookie = request.cookies.get('session')?.value

    // 3. Protected routes — redirect to login if no session
    if (
        pathnameWithoutLocale.startsWith('/dashboard') ||
        pathnameWithoutLocale.startsWith('/IA')
    ) {
        if (!sessionCookie) {
            const isEnglish = pathname.startsWith('/en')
            const loginPath = isEnglish ? '/en/login' : '/login'
            const loginUrl = new URL(loginPath, request.url)
            loginUrl.searchParams.set('callbackUrl', pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

    // 4. Auth routes — redirect to dashboard if already logged in
    if (
        pathnameWithoutLocale.startsWith('/login') ||
        pathnameWithoutLocale.startsWith('/register')
    ) {
        if (sessionCookie) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // 5. Run next-intl middleware (locale detection, hreflang cookies)
    const response = intlMiddleware(request)
    const res = response ?? NextResponse.next()

    // 6. Inject pathname header for server components
    res.headers.set('x-pathname', pathname)

    // 7. Sliding-window JWT refresh — only re-encrypt when token is within 6h of expiry.
    //    Fix: we apply the refreshed cookie onto the FINAL response (was previously lost
    //    because updateSession returned its own NextResponse that got discarded).
    const refreshResult = await maybeRefreshSession(request)
    if ('invalid' in refreshResult) {
        const loginUrl = new URL('/login', request.url)
        const redirect = NextResponse.redirect(loginUrl)
        redirect.cookies.set('session', '', { expires: new Date(0), path: '/' })
        return redirect
    }
    if ('cookieValue' in refreshResult) {
        res.cookies.set({
            name: 'session',
            value: refreshResult.cookieValue,
            httpOnly: true,
            expires: refreshResult.expires,
            sameSite: 'lax',
            path: '/',
        })
    }

    return res
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|icons|images|audio|avatars|downloads|manifest.json|sw.js|sw-push.js|llms.txt|openapi.json|google[\\w-]*\\.html|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico|.*\\.webp|.*\\.txt|.*\\.xml).*)',
    ],
}
