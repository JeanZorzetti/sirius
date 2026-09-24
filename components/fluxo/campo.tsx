'use client'

import { CampoVivo } from './campo-vivo'
import { poster } from './geometria'

const FONTES = ['whatsapp', 'ligação', 'google maps', 'indicação', 'planilha']

// The hero field. The SVG is rendered into the HTML, so the field has its composition before
// (or without) JS; the canvas takes over once it has drawn. A client component on purpose: the
// poster is recomputed at hydration instead of riding a second time in the RSC payload.
export function Campo() {
  const { linhas, onda } = poster()
  return (
    <div className="campo" data-estado="parado" aria-hidden="true">
      <svg className="campo__poster" viewBox="0 0 1000 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="campo-tinta" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0">
            <stop offset="0.6" style={{ stopColor: 'var(--campo-cinza)' }} />
            <stop offset="0.76" style={{ stopColor: 'var(--pulso)' }} />
          </linearGradient>
        </defs>
        {linhas.map((d, i) => (
          <path key={i} d={d} className="campo__poster-linha" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={onda} className="campo__poster-onda" vectorEffect="non-scaling-stroke" />
      </svg>
      <CampoVivo />
      <ul className="campo__fontes">
        {FONTES.map((f, i) => (
          <li key={f} style={{ top: `${12 + i * 18}%` }}>{f}</li>
        ))}
      </ul>
      <p className="campo__destino">receita, todo mês</p>
    </div>
  )
}
