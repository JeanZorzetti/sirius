/**
 * Spec 007 guards for the two stylesheets.
 * - app/public.css only scans the folders listed in its @source lines. If a public route starts importing a file
 *   with classes from anywhere else, those classes would be missing from public pages: this test names the file.
 * - app/globals.css is imported by the app routes, not by the root layout. Every app page needs it on itself or on
 *   a layout above it.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const rel = (f: string) => path.relative(ROOT, f).split(path.sep).join('/')
const EXT = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.js']
const HAS_CLASSES = /className|\bcn\(|\bcva\(|\bclsx\(/

function* files(dir: string): Generator<string> {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name)
    if (d.isDirectory()) yield* files(p)
    else if (/\.(tsx?|jsx?)$/.test(d.name)) yield p
  }
}

function resolveImport(from: string, spec: string): string | null {
  let base: string
  if (spec.startsWith('@/')) base = path.join(ROOT, spec.slice(2))
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec)
  else return null // package
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base
  for (const e of EXT) if (fs.existsSync(base + e)) return base + e
  return null
}

// Static imports reachable from the entries. Server actions render nothing, so the walk stops there.
function importGraph(entries: string[]): string[] {
  const seen = new Set<string>()
  const queue = [...entries]
  while (queue.length) {
    const f = queue.pop()!
    if (seen.has(f) || !/\.(tsx?|jsx?)$/.test(f)) continue
    seen.add(f)
    const src = fs.readFileSync(f, 'utf8')
    if (/^\s*['"]use server['"]/.test(src)) continue
    const re = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g
    for (const m of src.matchAll(re)) {
      const r = resolveImport(f, m[1] || m[2] || m[3])
      if (r) queue.push(r)
    }
  }
  return [...seen]
}

function publicSources(): string[] {
  const css = fs.readFileSync(path.join(ROOT, 'app/public.css'), 'utf8')
  return [...css.matchAll(/^@source\s+"([^"]+)";/gm)].map(m => rel(path.resolve(ROOT, 'app', m[1])))
}

const covered = (file: string, sources: string[]) => sources.some(s => file === s || file.startsWith(s + '/'))

describe('app/public.css @source covers the public routes', () => {
  const entries = [
    ...files(path.join(ROOT, 'app/[locale]/(marketing)')),
    ...files(path.join(ROOT, 'app/[locale]/(fluxo)')),
    ...['app/[locale]/layout.tsx', 'app/[locale]/not-found.tsx', 'app/error.tsx', 'app/not-found.tsx'].map(f => path.join(ROOT, f)),
  ]

  it('every file with classes reached from a public route is inside a @source folder', () => {
    const sources = publicSources()
    const missing = importGraph(entries)
      .filter(f => HAS_CLASSES.test(fs.readFileSync(f, 'utf8')))
      .map(rel)
      .filter(f => !covered(f, sources))
    expect(missing, 'add the folder of these files to a @source line in app/public.css').toEqual([])
  })
})

describe('app/globals.css reaches every app page', () => {
  const localeDir = path.join(ROOT, 'app/[locale]')
  const isPublic = (f: string) => /app\/\[locale\]\/\((marketing|fluxo)\)\//.test(rel(f))
  const importsAppSheet = (f: string) => fs.existsSync(f) && /import\s+['"](@\/app\/|(\.\.\/)+)globals\.css['"]/.test(fs.readFileSync(f, 'utf8'))

  it('each page outside (marketing) and (fluxo) imports it on itself or on a layout above it', () => {
    const pages = [...files(localeDir)].filter(f => path.basename(f) === 'page.tsx' && !isPublic(f))
    expect(pages.length).toBeGreaterThan(0)
    const bare = pages.filter(page => {
      if (importsAppSheet(page)) return false
      for (let dir = path.dirname(page); dir.startsWith(localeDir) && dir !== localeDir; dir = path.dirname(dir)) {
        if (importsAppSheet(path.join(dir, 'layout.tsx'))) return false
      }
      return true
    })
    expect(bare.map(rel), 'import @/app/globals.css in these pages or in their group layout').toEqual([])
  })
})

// Spec 008: public pages wear the home's skin (app/fluxo-pele.css). The palette is semantic (text-foreground,
// bg-muted, bg-primary, text-destaque...); a fixed Tailwind hue, a gradient or a blurred blob brings back the look
// the skin replaced. components/ui is shared with the app and keeps its own classes.
const HUES = 'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const OFF_PALETTE = new RegExp(
  String.raw`\b(?:bg|text|border|from|via|to|ring|fill|stroke|outline|decoration|divide|placeholder|shadow|accent|caret)-(?:${HUES})-\d{2,3}\b` +
  String.raw`|\bbg-(?:gradient|linear|radial)-|\bbg-\[(?:linear|radial|conic)-gradient|\bblur-(?:2xl|3xl)\b`)

describe('public pages paint only the home palette', () => {
  const entries = [
    ...files(path.join(ROOT, 'app/[locale]/(marketing)')),
    ...files(path.join(ROOT, 'app/[locale]/(fluxo)')),
    ...['app/[locale]/layout.tsx', 'app/[locale]/not-found.tsx', 'app/error.tsx', 'app/not-found.tsx'].map(f => path.join(ROOT, f)),
  ]

  it('no fixed hue, gradient or blob in a file a public route reaches', () => {
    const offenders = importGraph(entries)
      .map(rel)
      .filter(f => !f.startsWith('components/ui/'))
      .flatMap(f => {
        const m = fs.readFileSync(path.join(ROOT, f), 'utf8').match(OFF_PALETTE)
        return m ? [`${f}: ${m[0]}`] : []
      })
    expect(offenders, 'use the semantic classes (research.md R3 of spec 008)').toEqual([])
  })

  it('blog posts style their HTML with the skin variables, not hex colours', () => {
    const dir = path.join(ROOT, 'lib/blog/posts')
    const offenders = fs.readdirSync(dir).flatMap(n => {
      const hex = [...fs.readFileSync(path.join(dir, n), 'utf8').matchAll(/(?<![&\w])#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)]
        .map(m => m[1].toLowerCase())
        .filter(h => !/^(fff|ffffff|fafafa)$/.test(h))     // white stays white
      return hex.length ? [`${n}: #${hex[0]}`] : []
    })
    expect(offenders, 'var(--foreground), var(--muted), var(--border), var(--primary), var(--pulso-escuro)').toEqual([])
  })
})
