import { DM_Mono, Schibsted_Grotesk } from 'next/font/google'

// The Fluxo type for the public pages other than the home (spec 008). The layouts put both .variable classes on the
// element that carries data-art="fluxo".
//
// No preload, and it has to stay in a module the home does not share: next/font preloads every font declared in an
// imported module. Measured 2026-09-24 (4G lento, CPU 4×, medians of 5, interleaved with the old build): a preloaded
// Schibsted cost /pricing +14% and /blog +38% LCP, because the font shared the slow link with the render-blocking
// CSS. Without a preload these pages paint first in the system fallback and swap. The home keeps its own preloaded
// instance in app/[locale]/(fluxo)/layout.tsx: its h1 is the LCP and is drawn in this face.
export const texto = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--fonte-texto-base',
  display: 'swap',
  preload: false,
})

// Labels only, all small: never worth a preload.
export const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--fonte-mono-base',
  display: 'swap',
  preload: false,
})
