// Geometry of the Fluxo field: every lead is a line that enters tangled on the left and leaves
// combed into one periodic pulse on the right. Everything is a fraction of the width and height,
// so the server poster (a stretched SVG) and the client canvas draw the same field at any size.

export type Linha = {
  y0: number; ay: number; ax: number; faixa: number
  f1: number; f2: number; f3: number
  p1: number; p2: number; p3: number
}

type Ponto = { x: number; y: number }

/** Deterministic, so the poster's lines are the first lines of the canvas. */
export function semear(n: number, semente = 11): Linha[] {
  let s = semente
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296
  return Array.from({ length: n }, () => ({
    y0: 0.06 + 0.88 * rnd(),
    f1: 2 + rnd() * 5, f2: 1.5 + rnd() * 4, f3: 3 + rnd() * 6,
    p1: rnd() * 6.283, p2: rnd() * 6.283, p3: rnd() * 6.283,
    ay: 0.12 + rnd() * 0.22, ax: 0.02 + rnd() * 0.05,
    faixa: (rnd() - 0.5) * 0.18,
  }))
}

const liso = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Where the tangle ends: 60% of the width at rest, 18% once the comb has passed. */
export const fimDoCaos = (pente: number) => 0.6 - 0.42 * pente

/** One beat per period: flat, then a sharp peak. The period is a fraction of the width. */
export function pulso(x: number, largura: number, altura: number, periodo = 0.15 * largura) {
  const u = (((x % periodo) + periodo) % periodo) / periodo
  return -Math.pow(Math.sin(Math.PI * u), 8) * 0.2 * altura
}

/** Line `l` at fraction `t` of the width. Writes into `p` so the draw loop allocates nothing. */
export function ponto(l: Linha, t: number, w: number, h: number, pente: number, p: Ponto) {
  const fim = fimDoCaos(pente)
  const caos = Math.pow(1 - liso(0.02, fim, t), 1.4)
  const x = t * w + caos * l.ax * w * Math.sin(l.f1 * t * 9 + l.p1)
  const yCaos = l.y0 * h + caos * l.ay * h * (Math.sin(l.f2 * t * 7 + l.p2) + 0.45 * Math.sin(l.f3 * t * 13 + l.p3))
  const yOrdem = 0.46 * h
    + l.faixa * h * (1 - liso(fim - 0.02, fim + 0.2, t))
    + pulso(x, w, h) * liso(fim + 0.08, fim + 0.26, t)
  p.x = x
  p.y = yCaos * caos + yOrdem * (1 - caos)
}

const P: Ponto = { x: 0, y: 0 }

export function desenharCampo(
  ctx: CanvasRenderingContext2D,
  linhas: Linha[],
  w: number,
  h: number,
  pente: number,
  cores: { linha: string; pulso: string },
  passos: number,
) {
  ctx.clearRect(0, 0, w, h)
  const fim = fimDoCaos(pente)
  const tinta = ctx.createLinearGradient(0, 0, w, 0)
  tinta.addColorStop(0, cores.linha)
  tinta.addColorStop(fim, cores.linha)
  tinta.addColorStop(Math.min(1, fim + 0.16), cores.pulso)
  tinta.addColorStop(1, cores.pulso)
  ctx.strokeStyle = tinta
  ctx.lineWidth = 1
  // One stroke per line: overlaps accumulate alpha, which is what turns the bundle solid red.
  for (const l of linhas) {
    ctx.beginPath()
    for (let k = 0; k <= passos; k++) {
      ponto(l, k / passos, w, h, pente, P)
      if (k) ctx.lineTo(P.x, P.y)
      else ctx.moveTo(P.x, P.y)
    }
    ctx.stroke()
  }
}

const caminho = (pontos: number[][]) =>
  pontos.map(([x, y], k) => `${k ? 'L' : 'M'}${x} ${y}`).join('')

/**
 * The field at rest, coarse enough to ship in the HTML: the fallback, and what paints before the
 * canvas hydrates. Lines stop where they have all converged (t = 0.82); from 0.8 on every line
 * is the same curve, so the pulse is drawn once.
 */
export function poster(largura = 1000, altura = 400, n = 24) {
  const amostras = [
    ...Array.from({ length: 81 }, (_, i) => (i / 80) * 0.66),
    ...Array.from({ length: 24 }, (_, i) => 0.66 + ((i + 1) / 24) * 0.16),
  ]
  const p: Ponto = { x: 0, y: 0 }
  const linhas = semear(n).map((l) =>
    caminho(amostras.map((t) => (ponto(l, t, largura, altura, 0, p), [Math.round(p.x), Math.round(p.y)]))),
  )
  const primeira = semear(1)[0]
  const onda = caminho(
    Array.from({ length: 81 }, (_, k) => {
      ponto(primeira, 0.8 + (k / 80) * 0.2, largura, altura, 0, p)
      return [+p.x.toFixed(1), +p.y.toFixed(1)]
    }),
  )
  return { linhas, onda }
}

/** The closing line: a whole number of beats, so it starts and ends flat. */
export function linhaDePulso(largura = 1000, altura = 100, batidas = 7) {
  const periodo = largura / batidas
  return caminho(
    Array.from({ length: batidas * 36 + 1 }, (_, k) => {
      const x = (k / (batidas * 36)) * largura
      return [+x.toFixed(1), +(altura * 0.9 + pulso(x, largura, altura * 4, periodo)).toFixed(1)]
    }),
  )
}
