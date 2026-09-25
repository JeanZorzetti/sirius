// Spec 010 (R7): hex colours in the app's TSX become the skin's variables. Walks the TypeScript AST, so only string
// literals and template parts are touched, never the code around them (a regex over the text broke JSX in spec 008).
// A class token with an arbitrary hex value becomes the semantic class (bg-[#00a884] → bg-primary); a bare hex in a
// style object or a chart prop becomes var(--…). Chart series take --chart-1, 5, 4, 3 in order of first appearance.
// Hex not in the table is left alone and reported.
// usage: node scripts/codemod-hex-pele.mjs [--write]   (without --write it only simulates)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'
const ts = createRequire(import.meta.url)('typescript')

const ROOTS = ['components', 'app/[locale]/dashboard', 'app/[locale]/(admin)', 'app/[locale]/(ia)', 'app/[locale]/admin', 'app/[locale]/checkout']
const PUBLIC_ONLY = /^components[\\/](marketing|blog|fluxo|brand|seo)[\\/]|calculadora-roi/
// Colours the user chooses (project, status, label palettes), a graph that appends alpha to its hex, console styling
const SKIP_FILES = /(tasks[\\/](create-project-dialog|project-settings-form|project-card)|admin[\\/]graph-visualization|contacts[\\/]perf-monitor)\.tsx$/
// Files where a bare-hex array is the user's tag palette (data), but the rest of the file is interface
const SKIP_ARRAYS = /chat[\\/]conversation-tags\.tsx$/

const SERIE = new Set(['#3b82f6', '#6366f1', '#4f46e5', '#2563eb', '#8b5cf6', '#a855f7', '#06b6d4', '#14b8a6', '#ec4899', '#c4b5fd', '#a78bfa', '#db2777',
  '#d946ef', '#60a5fa', '#8884d8', '#7c3aed', '#818cf8', '#0891b2'])
const ORDEM_SERIE = ['chart-1', 'chart-5', 'chart-4', 'chart-3']
const TABELA = {
  '#111b21': 'foreground', '#334155': 'foreground', '#1e293b': 'foreground', '#0f172a': 'foreground', '#3730a3': 'foreground',
  '#5b21b6': 'foreground', '#53bdeb': 'foreground' /* read ticks: darker than the delivered grey */,
  '#6b7280': 'muted-foreground', '#d1d7db': 'muted', '#f5f6f6': 'muted', '#ddd6fe': 'muted', '#202c33': 'card', '#e2f7cb': 'secondary',
  '#84cc16': 'green-500', '#059669': 'green-600', '#4acd8d': 'green-400', '#d97706': 'amber-600', '#fef3c7': 'amber-100',
  '#667781': 'muted-foreground', '#8696a0': 'muted-foreground', '#54656f': 'muted-foreground', '#3b4a54': 'muted-foreground',
  '#64748b': 'muted-foreground', '#71717a': 'muted-foreground', '#94a3b8': 'muted-foreground',
  '#f0f2f5': 'muted', '#e9edef': 'muted', '#efeae2': 'muted', '#e2e8f0': 'muted',
  '#d9fdd3': 'secondary', '#c4edc0': 'secondary', '#b8e6b4': 'secondary',
  '#00a884': 'primary', '#008f72': 'primary', '#25d366': 'primary' /* unread: the chat's action colour, not the logo */,
  '#22c55e': 'green-500', '#10b981': 'green-500', '#16a34a': 'green-600',
  '#f59e0b': 'amber-500', '#fbbf24': 'amber-400', '#eab308': 'amber-500', '#f97316': 'amber-500',
  '#ef4444': 'red-500', '#f43f5e': 'red-500', '#f87171': 'red-400',
}
const VAR = n => (/^(green|amber|red)-/.test(n) ? `var(--color-${n})` : `var(--${n})`)

const escrever = process.argv.includes('--write')
const arquivos = []
const andar = d => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? andar(p) : /\.tsx?$/.test(n) && arquivos.push(p) } }
ROOTS.forEach(andar)

let totalTrocas = 0
const sobras = {}
for (const f of arquivos) {
  if (PUBLIC_ONLY.test(f) || SKIP_FILES.test(f)) continue
  const src = readFileSync(f, 'utf8')
  if (!/#[0-9a-fA-F]{6}\b/.test(src)) continue
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const serie = new Map()
  const nomeDe = hex => {
    if (TABELA[hex]) return TABELA[hex]
    if (SERIE.has(hex)) { if (!serie.has(hex)) serie.set(hex, ORDEM_SERIE[serie.size % ORDEM_SERIE.length]); return serie.get(hex) }
    return null
  }
  const edicoes = []
  const visitar = node => {
    const literal = ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)
    if (literal && !(SKIP_ARRAYS.test(f) && ts.isArrayLiteralExpression(node.parent))) {
      const bruto = node.getText(sf)
      let novo = bruto
        // class token with an arbitrary hex: bg-[#00a884]/10 → bg-primary/10
        .replace(/\b([a-z]+(?:-[a-z]+)*)-\[(#[0-9a-fA-F]{6})\]/g, (m, pre, hex) => {
          const n = nomeDe(hex.toLowerCase()); if (!n) return m
          if (pre === 'border' || pre === 'divide') return `${pre}-${n === 'muted' ? 'border' : n}`
          return `${pre}-${n}`
        })
        // bare hex (style objects, chart props, gradient stops)
        .replace(/#[0-9a-fA-F]{6}\b/g, m => { const n = nomeDe(m.toLowerCase()); return n ? VAR(n) : m })
      // white text on what used to be the chat green: the primary's own foreground (amber in the dark theme)
      if (novo !== bruto && /\bbg-primary\b/.test(novo)) novo = novo.replace(/\btext-white\b/g, 'text-primary-foreground')
      if (novo !== bruto) edicoes.push([node.getStart(sf), node.getEnd(), novo])
    }
    ts.forEachChild(node, visitar)
  }
  visitar(sf)
  let saida = src
  for (const [a, b, t] of edicoes.sort((x, y) => y[0] - x[0])) saida = saida.slice(0, a) + t + saida.slice(b)
  const antes = (src.match(/#[0-9a-fA-F]{6}\b/g) || []).length, depois = (saida.match(/#[0-9a-fA-F]{6}\b/g) || []).length
  if (antes !== depois) { totalTrocas += antes - depois; console.log(`${String(antes - depois).padStart(3)}  ${f}${depois ? `  (sobram ${depois})` : ''}`) }
  for (const h of saida.match(/#[0-9a-fA-F]{6}\b/g) || []) sobras[h.toLowerCase()] = (sobras[h.toLowerCase()] || 0) + 1
  if (escrever && saida !== src) writeFileSync(f, saida)
}
console.log(`\n${totalTrocas} trocas ${escrever ? 'escritas' : '(simulação)'}; hex que sobraram:`, JSON.stringify(sobras))
