import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/auth'

// Cria o middleware do next-intl com nossas rotas configuradas
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // 1. Redirect invalid/malformed URLs to homepage (SEO fix)
    const malformedPatterns = ['/mês', '/mes', '/month']
    if (malformedPatterns.some(pattern => pathname.includes(pattern))) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    // 2. Strip /en prefix for locale-agnostic auth checks
    const pathnameWithoutLocale = pathname.replace(/^\/en/, '') || '/'

    const sessionCookie = request.cookies.get('session')?.value

    // 3. Protected routes — redirect to /login or /en/login depending on locale
    if (
        pathnameWithoutLocale.startsWith('/dashboard') ||
        pathnameWithoutLocale.startsWith('/IA')
    ) {
        if (!sessionCookie) {
            const isEnglish = pathname.startsWith('/en')
            const loginPath = isEnglish ? '/en/login' : '/login'
            return NextResponse.redirect(new URL(loginPath, request.url))
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

    // 5. Update session expiration
    await updateSession(request)

    // 6. Run next-intl middleware (locale detection, /en prefix, hreflang cookies)
    return intlMiddleware(request)
}

export const config = {
    matcher: [
        // Inclui todas as rotas exceto assets estáticos, API e arquivos na raiz do public
        '/((?!api|_next/static|_next/image|favicon.ico|icons|images|audio|avatars|downloads|manifest.json|sw.js|sw-push.js|llms.txt|openapi.json|google[\\w-]*\\.html|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico|.*\\.webp|.*\\.txt|.*\\.xml).*)',
    ],
}
