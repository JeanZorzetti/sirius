/**
 * Spec 010 guards for the app's skin (app/app-pele.css).
 * - Fixed Tailwind colour classes are harmless: app-pele.css remaps the palette variables they read. The one door left
 *   open is a literal colour written in a file (hex, rgb, hsl, oklch), which no token reaches. This names the file.
 * - Every Tailwind hue must be remapped in app-pele.css, or its classes would draw the generator's colour again.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const rel = (f: string) => path.relative(ROOT, f).split(path.sep).join('/')
const ROOTS = ['components', 'app/[locale]/dashboard', 'app/[locale]/(admin)', 'app/[locale]/(ia)', 'app/[locale]/admin', 'app/[locale]/checkout']
const PUBLIC_ONLY = /^components\/(marketing|blog|fluxo|brand|seo)\/|calculadora-roi/

// Colours that are data or someone else's mark, not the app's interface
const EXCECOES: Record<string, string> = {
  'components/tasks/create-project-dialog.tsx': 'palette the user picks a project colour from',
  'components/tasks/project-settings-form.tsx': 'palette for the user\'s status and label colours',
  'components/tasks/project-card.tsx': 'palette for the user\'s project colours',
  'components/chat/conversation-tags.tsx': 'palette for the user\'s tag colours',
  'components/admin/graph-visualization.tsx': 'internal admin graph that appends alpha to its hex',
  'components/contacts/perf-monitor.tsx': 'console.log styling',
  'app/[locale]/dashboard/settings/integrations/facebook-ads/page.tsx': 'Facebook\'s own button blue',
}
const LITERAL = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|\b(?:rgba?|hsla?)\([^)]*\)|\boklch\(\s*[0-9.]/g
// literals inside an arbitrary shadow never draw: app-pele.css zeroes every shadow outside floating layers
const SOMBRA = /\b(?:drop-)?shadow-\[[^\]]*\]/g
const IGNORAR_LINHA = /^\s*(\/\/|\*|\/\*)|&#\d|\bhref=|#[0-9a-fA-F]{3,8}-/

function* files(dir: string): Generator<string> {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name)
    if (d.isDirectory()) yield* files(p)
    else if (/\.tsx?$/.test(d.name)) yield p
  }
}

export function literaisDeCor(src: string): string[] {
  const achados: string[] = []
  src.split('\n').forEach((linha, i) => {
    if (IGNORAR_LINHA.test(linha)) return
    for (const m of linha.replace(SOMBRA, '').match(LITERAL) ?? []) achados.push(`${i + 1}: ${m}`)
  })
  return achados
}

describe('app colour guard (spec 010)', () => {
  it('no literal colour in an app file outside the exceptions', () => {
    const erros: string[] = []
    for (const r of ROOTS) {
      for (const f of files(path.join(ROOT, r))) {
        const nome = rel(f)
        if (PUBLIC_ONLY.test(nome) || EXCECOES[nome]) continue
        for (const a of literaisDeCor(fs.readFileSync(f, 'utf8'))) erros.push(`${nome}:${a}`)
      }
    }
    expect(erros, 'use a token (bg-primary, text-muted-foreground, var(--chart-1)…) instead of a literal colour').toEqual([])
  })

  it('catches a planted literal and skips shadows', () => {
    expect(literaisDeCor(`<div className="bg-[#6366f1] shadow-[0_0_10px_rgba(99,102,241,0.2)]" />`)).toEqual(['1: #6366f1'])
    expect(literaisDeCor(`const c = { stroke: 'rgb(59 130 246)' }`)).toEqual(['1: rgb(59 130 246)'])
    expect(literaisDeCor(`<div className="bg-primary text-primary-foreground" style={{ color: 'var(--chart-1)' }} />`)).toEqual([])
  })

  it('app-pele.css remaps every Tailwind hue', () => {
    const css = fs.readFileSync(path.join(ROOT, 'app/app-pele.css'), 'utf8')
    const matizes = ['slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald',
      'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
    const faltam = matizes.flatMap(h => ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
      .filter(s => !css.includes(`--color-${h}-${s}:`)).map(s => `${h}-${s}`))
    expect(faltam).toEqual([])
  })
})
