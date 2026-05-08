const BASE_URL = 'https://siriuscrm.com.br'

/**
 * Build locale-aware canonical + hreflang alternates for static pages.
 *
 * Both `ptPath` and `enPath` should start with a leading slash (or be empty for root).
 * When the page is rendered under /en, the EN URL becomes the canonical.
 * Always emits pt-BR, en, and x-default hreflang entries.
 */
export function buildLocaleAlternates(
  locale: string,
  ptPath: string,
  enPath: string = ptPath
) {
  const ptUrl = `${BASE_URL}${ptPath}`
  const enUrl = `${BASE_URL}/en${enPath}`
  const canonical = locale === 'en' ? enUrl : ptUrl

  return {
    canonical,
    languages: {
      'pt-BR': ptUrl,
      en: enUrl,
      'x-default': ptUrl,
    },
  }
}
