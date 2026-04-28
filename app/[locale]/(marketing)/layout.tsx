import Image from 'next/image'
import NextLink from 'next/link'
import { Button } from '@/components/ui/button'
import { MobileNav } from '@/components/marketing/mobile-nav'
import { NavDropdowns } from '@/components/marketing/nav-dropdowns'
import { FeaturesDropdown } from '@/components/marketing/features-dropdown'
import { Footer } from '@/components/marketing/footer'
import { LanguageSwitcher } from '@/components/marketing/language-switcher'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useTranslations('marketing.home.nav')

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/" className="text-xl font-bold flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Sirius Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
                unoptimized
              />
              <span className="font-bold tracking-tight">Sirius CRM</span>
            </Link>
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              <FeaturesDropdown />
              <NavDropdowns />
              <Link
                href="/pricing"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
              >
                {t('pricing')}
              </Link>
              <Link
                href="/blog"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground whitespace-nowrap"
              >
                {t('blog')}
              </Link>
              <Link
                href="/fundadores"
                className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <span>⭐</span>
                {t('founders')}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <MobileNav />
            <Button variant="ghost" asChild className="hidden md:inline-flex">
              <NextLink href="/login">{t('login')}</NextLink>
            </Button>
            <Button asChild className="hidden md:inline-flex">
              <NextLink href="/register">{t('startFree')}</NextLink>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pt-16">{children}</main>

      {/* Footer Dinâmico */}
      <Footer />
    </div>
  )
}
