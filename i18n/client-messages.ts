// Message paths the browser actually reads (spec 005). Everything else — emails, api,
// lib, server-rendered marketing copy — stays on the server instead of being serialized
// into every page. __tests__/i18n/client-messages.test.ts fails when client code asks
// for a namespace outside this list.
// ponytail: one global list; `components` (9 kb) also ships to marketing pages.
// Per-route-group providers if that ever measures.
export const CLIENT_MESSAGE_PATHS = [
  'common',
  'components',
  'marketing.home.nav',
  'marketing.home.niche_labels',
  'marketing.home.agiPreview',
  'marketing.blog',
  'marketing.pricing', // pricing/page.tsx is a client page
  'marketing.contact', // contact/page.tsx is a client page
  'marketing.features.nav',
  // The nav menus read only `<section>.<feature>.name`; the descriptions are ~20 kb.
  'marketing.features.sections.*.*.name',
] as const

type Tree = Record<string, unknown>

function pick(src: Tree, keys: string[], dst: Tree) {
  const [key, ...rest] = keys
  for (const k of key === '*' ? Object.keys(src) : [key]) {
    const v = src[k]
    if (v === undefined) continue
    if (!rest.length) {
      dst[k] = v
    } else if (v && typeof v === 'object' && dst[k] !== v) {
      // dst[k] === v means a broader path already shipped the whole subtree
      dst[k] ??= {}
      pick(v as Tree, rest, dst[k] as Tree)
    }
  }
}

export function pickMessages<T extends Tree>(messages: T, paths: readonly string[]): Partial<T> {
  const out: Tree = {}
  for (const p of paths) pick(messages, p.split('.'), out)
  return out as Partial<T>
}

// A namespace is covered when the list ships it whole, or when it is the static prefix
// of a wildcard projection (the projection is a deliberate, declared partial).
export function isCoveredByClientMessages(namespace: string): boolean {
  return CLIENT_MESSAGE_PATHS.some((p) => {
    const base = p.split('.*')[0]
    return namespace === base || namespace.startsWith(base + '.')
  })
}
