import { DM_Mono, Schibsted_Grotesk } from 'next/font/google'

// The home's type on /dashboard (spec 009), with display 'optional' instead of the public pages' 'swap'.
// Measured 2026-09-24 in production (4G lento, CPU 4×, 390, median of 5): with 'swap' the LCP went 5.97 → 10.2 s.
// The text first paints in the fallback, the font lands while hydration holds the main thread, and the swap
// repaint — which LCP counts — waits for the end of it. With 'optional' there is no swap: a first visit on a slow
// link keeps the metric-matched fallback, and every later visit (a screen opened daily) draws from the cache.
// No preload: on /pricing a preloaded font competed with the render-blocking CSS (+14% LCP, spec 008).
export const texto = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--fonte-texto-base',
  display: 'optional',
  preload: false,
})

export const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--fonte-mono-base',
  display: 'optional',
  preload: false,
})

// The same two families for the whole app (spec 010): the app layouts render this in a <style>, so the variables sit on
// :root and reach the portals (dialog, menu, select), which Radix mounts in <body>, outside any wrapper.
export const FONTES_NO_ROOT = `:root{--fonte-texto-base:${texto.style.fontFamily};--fonte-mono-base:${mono.style.fontFamily}}`
