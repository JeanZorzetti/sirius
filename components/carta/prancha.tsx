'use client'

// Prancha I — the demo pipeline plotted as an atlas plate.
// x = pipeline stage (meridians), y = days to due date (parallels, gently arced like an ecliptic),
// star area ∝ deal value, Greek letter = rank by value. Every coordinate comes from lib/pipeline-defaults.ts.
import { useState } from 'react'
import { DEFAULT_STAGES } from '@/lib/pipeline-defaults'
import { CATALOGO, brl, estrela, nomeCurto, prazo, raio } from './estrelas'

const W = 760, H = 540
const X0 = 96, X1 = 700, Y_TOP = 78, Y_BOT = 496
const D_MIN = -3, D_MAX = 11 // day window drawn on the plate
const SAG = 9 // arc of the parallels at the centre
const XC = (X0 + X1) / 2

const xEtapa = (s: number) => X0 + (s + 0.5) * ((X1 - X0) / DEFAULT_STAGES.length)
const yDia = (d: number, x: number) => {
  const y = Y_BOT - ((d - D_MIN) / (D_MAX - D_MIN)) * (Y_BOT - Y_TOP)
  const u = (x - XC) / ((X1 - X0) / 2)
  return y + SAG * (1 - u * u)
}
const arco = (d: number) => {
  const pts = Array.from({ length: 25 }, (_, i) => X0 + (i / 24) * (X1 - X0))
  return 'M' + pts.map((x) => `${x.toFixed(1)} ${yDia(d, x).toFixed(1)}`).join('L')
}

const CURTO: Record<string, string> = { Lead: 'Lead', Prospecção: 'Prosp.', Qualificação: 'Qualif.', Proposta: 'Prop.', Fechamento: 'Fech.' }
const PARALELOS = [-2, 5, 10]
const MAGNITUDES = [5000, 10000, 20000] // legend box, same formula as the stars
const LEGENDA = (() => {
  const rMax = raio(MAGNITUDES[MAGNITUDES.length - 1])
  let y = 34
  const linhas = MAGNITUDES.map((v) => { const r = raio(v); y += r + 6; const linha = { v, y }; y += r; return linha })
  return { linhas, rMax, cx: 8 + rMax, w: 8 + 2 * rMax + 8 + 64, h: y + 12 }
})()

// hatch of the past: everything under the "today" parallel
const HACHURA = (() => {
  let d = ''
  for (let x = X0 - (Y_BOT - Y_TOP); x < X1; x += 7) d += `M${x} ${Y_BOT}L${x + (Y_BOT - Y_TOP)} ${Y_TOP}`
  return d
})()
const PASSADO = `${arco(0)}L${X1} ${Y_BOT}L${X0} ${Y_BOT}Z`

export function Prancha() {
  const [ativa, setAtiva] = useState(0)
  const e = CATALOGO[ativa]

  return (
    <figure className="prancha">
      <svg className="prancha__svg" viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Prancha do pipeline de exemplo: cada estrela é um negócio">
        <defs>
          <clipPath id="prancha-passado"><path d={PASSADO} /></clipPath>
        </defs>

        {/* frame + degree scale: top ticks = stages, side ticks = days */}
        <rect className="prancha__moldura" x="6" y="6" width={W - 12} height={H - 12} />
        <rect className="prancha__moldura prancha__moldura--fina" x="20" y="20" width={W - 40} height={H - 40} />
        {DEFAULT_STAGES.map((_, s) => {
          const w = (X1 - X0) / DEFAULT_STAGES.length
          return s % 2 === 0 ? <rect key={s} className="prancha__escala" x={X0 + s * w} y="11" width={w} height="5" /> : null
        })}
        {Array.from({ length: D_MAX - D_MIN }, (_, i) => {
          const y0 = yDia(D_MIN + i + 1, X0), y1 = yDia(D_MIN + i, X0)
          return i % 2 === 0 ? <rect key={i} className="prancha__escala" x="11" y={y0} width="5" height={y1 - y0} /> : null
        })}

        {/* graticule */}
        <g className="prancha__fios">
          <path className="prancha__fio" pathLength={1} d={`M${X0} ${Y_TOP - 16}V${Y_BOT}H${X1}V${Y_TOP - 16}`} />
          {DEFAULT_STAGES.map((_, s) => (
            <path key={s} className="prancha__fio" pathLength={1} d={`M${xEtapa(s).toFixed(1)} ${Y_TOP - 16}V${Y_BOT}`} />
          ))}
          {PARALELOS.map((d) => <path key={d} className="prancha__fio" pathLength={1} d={arco(d)} />)}
          <path className="prancha__fio prancha__fio--hoje" pathLength={1} d={arco(0)} />
        </g>
        <path className="prancha__hachura" d={HACHURA} clipPath="url(#prancha-passado)" />

        {/* labels */}
        {DEFAULT_STAGES.map((st, s) => (
          <text key={st.name} className="prancha__rotulo" x={xEtapa(s)} y={Y_TOP - 26} textAnchor="middle">
            <tspan className="prancha__rotulo--longo">{st.name.toUpperCase()}</tspan>
            <tspan className="prancha__rotulo--curto">{CURTO[st.name].toUpperCase()}</tspan>
          </text>
        ))}
        {[10, 5, 0, -2].map((d) => (
          <text key={d} className={`prancha__dia${d === 0 ? ' prancha__dia--hoje' : ''}`} x={X0 - 10} y={yDia(d, X0) + 4} textAnchor="end">
            {d === 0 ? 'hoje' : `${d > 0 ? '+' : '−'}${Math.abs(d)} d`}
          </text>
        ))}

        {/* magnitude legend, like Bayer's plates — box sized from the same radius formula */}
        <g className="prancha__magnitudes" transform={`translate(${X1 - LEGENDA.w - 8} ${Y_TOP + 6})`}>
          <rect className="prancha__caixa" width={LEGENDA.w} height={LEGENDA.h} />
          <text className="prancha__rotulo" x={LEGENDA.w / 2} y="22" textAnchor="middle">MAGNITUDE</text>
          {LEGENDA.linhas.map(({ v, y }) => (
            <g key={v} transform={`translate(${LEGENDA.cx} ${y})`}>
              <path className="estrela__corpo estrela__corpo--legenda" d={estrela(0, 0, raio(v))} />
              <text className="prancha__dia" x={LEGENDA.rMax + 8} y="5">{`R$ ${v / 1000} mil`}</text>
            </g>
          ))}
        </g>

        {/* stars in order of brightness: tab order reads α → ζ, like the catalogue */}
        {CATALOGO.map((c, i) => {
          const cx = xEtapa(c.stageIndex), cy = yDia(c.dueInDays, cx), r = raio(c.value)
          // labels mirror to the left on the last meridian so they stay inside the frame
          const esquerda = c.stageIndex === DEFAULT_STAGES.length - 1
          const lx = esquerda ? cx - r * 0.75 - 4 : cx + r * 0.75 + 4
          const ancora = esquerda ? 'end' : 'start'
          return (
            <g
              key={c.title}
              className="estrela"
              style={{ ['--ordem' as string]: i }}
              data-alfa={i === 0 || undefined}
              data-ativa={i === ativa || undefined}
              tabIndex={0}
              role="button"
              aria-pressed={i === ativa}
              aria-label={`${c.letra}: ${c.title}, ${brl(c.value)}, ${c.etapa}, ${prazo(c)}`}
              onMouseEnter={() => setAtiva(i)}
              onFocus={() => setAtiva(i)}
              onClick={() => setAtiva(i)}
              onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setAtiva(i) } }}
            >
              <circle className="estrela__halo" cx={cx} cy={cy} r={r * 1.75} />
              <circle className="estrela__anel" pathLength={1} cx={cx} cy={cy} r={r * 1.3} />
              <path className="estrela__corpo" d={estrela(cx, cy, r)} />
              <text className="estrela__letra" x={lx} y={cy - r * 0.35} textAnchor={ancora}>{c.letra}</text>
              <text className="estrela__nome" x={lx} y={cy + r * 0.35 + 12} textAnchor={ancora}>{nomeCurto(c.title)}</text>
            </g>
          )
        })}
      </svg>

      <figcaption className="prancha__legenda">
        <div className="ficha" aria-live="polite">
          <p className="ficha__cabeca">
            <span className="ficha__letra" data-alfa={ativa === 0 || undefined}>{e.letra}</span>
            <span className="ficha__titulo">{e.title}</span>
          </p>
          <p className="ficha__dados">{brl(e.value)} · {e.etapa} · {prazo(e)}</p>
          <p className="ficha__nota">“{e.notes[e.notes.length - 1]}”</p>
        </div>
        <p className="prancha__explicacao">
          Pipeline de exemplo que toda conta nova recebe. A área da estrela é o valor do negócio, e a letra segue a ordem do brilho,
          como na <i>Uranometria</i> de Bayer (1603). Abaixo da linha do hoje, o prazo já passou.
        </p>
      </figcaption>
    </figure>
  )
}
