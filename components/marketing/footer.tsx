import { Link } from '@/i18n/routing'
import { NICHES } from '@/config/niche-data'
import { CITIES, CITY_DISPLAY_NAMES } from '@/config/city-data'
import { useTranslations, useLocale } from 'next-intl'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const t = useTranslations('marketing.home.footer')
  const tNiches = useTranslations('marketing.home.niche_labels')
  const locale = useLocale()

  return (
    <footer className="border-t bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {/* Coluna 1: Sobre */}
          <div>
            <h3 className="font-bold text-sm mb-4">{t('about.title')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('about.description')}
            </p>
            <p className="text-xs text-muted-foreground">
              © {currentYear} ROI Labs
            </p>
          </div>

          {/* Coluna 2: Produto */}
          <div>
            <h3 className="font-bold text-sm mb-4">{t('product.title')}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('product.features')}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('product.pricing')}
                </Link>
              </li>
              <li>
                <Link href="/indique" className="text-muted-foreground hover:text-foreground transition-colors">
                  Indique e Ganhe
                </Link>
              </li>
              <li>
                <Link href="/followup" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('product.followup')}
                </Link>
              </li>
              <li>
                <Link href="/vendas-automaticas" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('product.autoSales')}
                </Link>
              </li>
              <li>
                <Link href="/proposta" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('product.proposal')}
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('product.changelog')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Soluções por Segmento (Dinâmica) */}
          <div>
            <h3 className="font-bold text-sm mb-4">{t('nichesTitle')}</h3>
            <ul className="space-y-3 text-sm">
              {NICHES.map((niche) => (
                <li key={niche.slug}>
                  <Link
                    href={{ pathname: '/solucoes/[slug]', params: { slug: niche.slug } }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tNiches(niche.slug as any)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 4: Ferramentas Grátis (Dinâmica) */}
          <div>
            <h3 className="font-bold text-sm mb-4">{t('toolsTitle')}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/ferramentas/calculadora-roi"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('tools.roi')}
                </Link>
              </li>
              <li>
                <Link
                  href="/ferramentas/calculadora-roi-corretores"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('tools.realtors')}
                </Link>
              </li>
              <li>
                <Link
                  href="/ferramentas/calculadora-roi-energia-solar"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('tools.solar')}
                </Link>
              </li>
              <li>
                <Link
                  href="/ferramentas/calculadora-roi-agencias"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('tools.agencies')}
                </Link>
              </li>
              <li>
                <Link
                  href="/ferramentas/calculadora-roi-consultores"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('tools.consultants')}
                </Link>
              </li>
              <li>
                <Link
                  href="/ferramentas/calculadora-roi-representantes"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('tools.reps')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 5: Principais Cidades */}
          {locale === 'pt-BR' && (
            <div>
              <h3 className="font-bold text-sm mb-4">{t('citiesTitle')}</h3>
              <ul className="space-y-3 text-sm">
                {CITIES.map((city) => (
                  <li key={city.slug}>
                    <Link
                      href={{ pathname: '/solucoes/cidade/[slug]', params: { slug: city.slug } }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {CITY_DISPLAY_NAMES[city.slug] ?? city.slug}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Coluna 6: Recursos */}
          <div>
            <h3 className="font-bold text-sm mb-4">{t('resources.title')}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('resources.blog')}
                </Link>
              </li>
              <li>
                <Link href="/anuario" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('resources.book')}
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('resources.help')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('resources.about')}
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('resources.community')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Linha inferior: Links legais */}
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              {t('legal.privacy')}
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              {t('legal.terms')}
            </Link>
            <a href="mailto:contato@roilabs.com.br" className="hover:text-foreground transition-colors">
              {t('legal.contact')}
            </a>
          </div>

          <div className="flex gap-4">
            <a
              href="https://www.linkedin.com/company/roi-labs-curadoria/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/roilabs.curadoria/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a
              href="https://github.com/JeanZorzetti"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>

        {/* Dados legais da empresa */}
        <div className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            57.493.675 MARIA EDUARDA ROCHA MENDES - ME &nbsp;·&nbsp; CNPJ: 57.493.675/0001-37
          </p>
        </div>
      </div>
    </footer>
  )
}

/**
 * Retorna uma versão curta do nome do nicho para o footer
 */
function getNicheShortLabel(slug: string): string {
  const labels: Record<string, string> = {
    'corretores-de-imoveis': 'Para Corretores',
    'energia-solar': 'Para Energia Solar',
    'agencias-de-marketing': 'Para Agências',
    'consultores-empresariais': 'Para Consultores',
    'representantes-comerciais': 'Para Representantes',
  }

  return labels[slug] || slug
}
