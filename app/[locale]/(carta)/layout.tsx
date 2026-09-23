import { Bricolage_Grotesque, EB_Garamond } from 'next/font/google'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Footer } from '@/components/marketing/footer'
import { Wordmark } from '@/components/brand/wordmark'
import './carta.css'

// Home-only layout: the Carta de Bayer direction stays scoped to this route group
// until it is approved; every other marketing page keeps app/[locale]/(marketing)/layout.tsx.
const marca = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz', 'wdth'],
  variable: '--fonte-marca',
  display: 'swap',
})

const gravura = EB_Garamond({
  subsets: ['latin', 'greek'],
  style: ['normal', 'italic'],
  variable: '--fonte-gravura',
  display: 'swap',
})

export default function CartaLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('marketing.home.nav')

  return (
    <div data-art="carta" className={`${marca.variable} ${gravura.variable}`}>
      <a href="#conteudo" className="carta-pular">Pular para o conteúdo</a>
      <header className="carta-nav">
        <Link href="/" className="carta-nav__marca" aria-label="Sirius CRM, página inicial">
          <Wordmark className="carta-nav__wordmark" />
        </Link>
        <nav aria-label="Principal" className="carta-nav__links">
          <Link href="/pricing" className="carta-nav__link">{t('pricing')}</Link>
          <Link href="/blog" className="carta-nav__link">{t('blog')}</Link>
          <Link href="/login" className="carta-nav__link">{t('login')}</Link>
          <Link href="/register" className="carta-botao carta-botao--nav">{t('startFree')}</Link>
        </nav>
      </header>
      <main id="conteudo">{children}</main>
      <div className="carta-rodape">
        <Footer />
      </div>
    </div>
  )
}
