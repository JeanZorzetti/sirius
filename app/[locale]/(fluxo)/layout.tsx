import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Footer } from '@/components/marketing/footer'
import { Wordmark } from '@/components/brand/wordmark'
import { DM_Mono, Schibsted_Grotesk } from 'next/font/google'
import './fluxo.css'

// The home's own instances, preloaded: its h1 is the LCP and is drawn in Schibsted. They live here and not in
// components/fluxo/fontes.ts because next/font preloads every font of an imported module, and the other public pages
// must not preload (spec 008).
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

// The home: the Fluxo skin (app/fluxo-pele.css, shared with (marketing) since spec 008) plus the gesture
// (fluxo.css: the combed field, lanes, plans, closing pulse), which stays on this page only.

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
      <Footer />
    </div>
  )
}
