import { DM_Mono, Schibsted_Grotesk } from 'next/font/google'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Footer } from '@/components/marketing/footer'
import { Wordmark } from '@/components/brand/wordmark'
import './fluxo.css'

// Home-only layout: the Fluxo direction stays scoped to this route group until it is approved;
// every other marketing page keeps app/[locale]/(marketing)/layout.tsx.
const texto = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--fonte-texto-base',
  display: 'swap',
})

// Labels only, all small: not worth a preload that competes with the h1's font.
const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--fonte-mono-base',
  display: 'swap',
  preload: false,
})

export default function FluxoLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('marketing.home.nav')
  const h = useTranslations('marketing.home.hero')

  return (
    <div data-art="fluxo" className={`${texto.variable} ${mono.variable}`}>
      <a href="#conteudo" className="fluxo-pular">Pular para o conteúdo</a>
      <header className="fluxo-nav">
        <Link href="/" className="fluxo-nav__marca" aria-label="Sirius CRM, página inicial">
          <Wordmark className="fluxo-nav__wordmark" />
        </Link>
        <nav aria-label="Principal" className="fluxo-nav__links">
          <Link href="/pricing" className="fluxo-nav__link">{t('pricing')}</Link>
          <Link href="/blog" className="fluxo-nav__link">{t('blog')}</Link>
          <Link href="/login" className="fluxo-nav__link">{t('login')}</Link>
          <Link href="/register" className="fluxo-botao fluxo-botao--nav">{h('ctaNav')}</Link>
        </nav>
      </header>
      <main id="conteudo">{children}</main>
      <div className="fluxo-rodape">
        <Footer />
      </div>
    </div>
  )
}
