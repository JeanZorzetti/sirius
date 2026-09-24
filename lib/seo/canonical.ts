const BASE_URL = 'https://siriuscrm.com.br'

/**
 * Next merges metadata per top-level key: a page that sets `openGraph` replaces the
 * root layout's object whole, image included. Every such page passes this, and
 * `__tests__/seo/og-image-guard.test.ts` fails the one that forgets.
 */
export const DEFAULT_OG_IMAGES = [
  { url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Sirius CRM' },
]

/**
 * Build the canonical URL for a static marketing page.
 *
 * `ptPath` should start with a leading slash (or be empty for root).
 *
 * The EN locale was retired (spec 004): there is no second language version, so
 * there is no hreflang to emit — a self-referencing `languages` map is dead bytes
 * in every `<head>`. This returns `{ canonical }` only.
 *
 * ponytail: `locale` and `enPath` stay in the signature on purpose. 25+ pages call
 * this; keeping the shape means this single edit fixes all of them without opening
 * 25 files. Drop the params when someone is already touching those call sites.
 */
export function buildLocaleAlternates(
  _locale: string,
  ptPath: string,
  _enPath: string = ptPath
) {
  return {
    canonical: `${BASE_URL}${ptPath}`,
  }
}
