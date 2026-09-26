'use client'

import { useReportWebVitals } from 'next/web-vitals'

// Field vitals for the roihub SEO map (roihub spec 056). The CrUX publishes no sample for this
// origin yet, so each public page load reports its own LCP, INP, CLS and TTFB to the hub. Nothing
// identifies the visitor: no cookie, no id, only the path.
const DESTINO = 'https://hub.roilabs.com.br/api/vitais'
const MEDIDAS = new Set(['LCP', 'INP', 'CLS', 'TTFB'])
// Account pages share this layout, but Google does not rank them and customers open /login every
// day: on a site this small they would dominate the sample.
const CONTA = /\/(login|register|forgot-password|reset-password|complete-profile)(\/|$)/

// One report per metric per page load. The layout can remount (locale switch) and a back/forward
// cache restore re-reports, and both would count the same load twice.
// ponytail: a CLS/INP that grows after the tab is shown again is not re-sent; a load id on the hub
// side would be needed to replace it.
const enviadas = new Set<string>()
let montadoEm: string | null = null

function enviar(metrica: { name: string; value: number }) {
  if (!MEDIDAS.has(metrica.name) || enviadas.has(metrica.name) || typeof navigator.sendBeacon !== 'function') return
  // CLS and INP arrive when the tab hides, maybe after client-side navigation: the metric belongs to
  // the loaded document, as in the CrUX, not to the route on screen now.
  const doc = performance.getEntriesByType('navigation')[0]
  if (!doc) return
  const caminho = new URL(doc.name).pathname
  // Mounted by a client navigation from a page outside this layout (e.g. /dashboard): the metrics are
  // that page's, so none is sent.
  if (caminho !== montadoEm || CONTA.test(caminho)) return
  enviadas.add(metrica.name)
  // A string body goes as text/plain: a simple CORS request, no preflight, and the CSP already
  // allows *.roilabs.com.br in connect-src.
  navigator.sendBeacon(DESTINO, JSON.stringify({ m: metrica.name, v: metrica.value, p: caminho }))
}

export function VitaisDeCampo() {
  if (montadoEm === null && typeof window !== 'undefined') montadoEm = window.location.pathname
  useReportWebVitals(enviar)
  return null
}
