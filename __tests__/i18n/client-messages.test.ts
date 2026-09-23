/**
 * The browser only gets CLIENT_MESSAGE_PATHS (spec 005). A client component asking
 * for a namespace outside that list renders the raw key in production instead of
 * failing, so this suite is the only thing that catches it.
 *
 * Client code = every 'use client' file plus everything it imports, transitively.
 * Server components (no directive, not imported by a client) read the full server
 * config and are not charged against the list.
 */

import fs from 'fs'
import path from 'path'
import { CLIENT_MESSAGE_PATHS, isCoveredByClientMessages, pickMessages } from '@/i18n/client-messages'

const ROOT = path.resolve(__dirname, '../..')
const SCAN_DIRS = ['app', 'components', 'hooks', 'lib']
const EXTS = ['.tsx', '.ts', '/index.tsx', '/index.ts']

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__' && entry.name !== 'node_modules') walk(full, out)
    } else if (/\.tsx?$/.test(entry.name)) out.push(full)
  }
  return out
}

function resolveImport(from: string, spec: string): string | null {
  let base: string
  if (spec.startsWith('@/')) base = path.join(ROOT, spec.slice(2))
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec)
  else return null // package
  if (/\.tsx?$/.test(base) && fs.existsSync(base)) return base
  for (const ext of EXTS) if (fs.existsSync(base + ext)) return base + ext
  return null
}

function clientFiles(): string[] {
  const roots = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d))).filter((f) =>
    /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*['"]use client['"]/.test(fs.readFileSync(f, 'utf8').replace(/^﻿/, '')),
  )
  const seen = new Set(roots)
  const queue = [...roots]
  while (queue.length) {
    const file = queue.pop()!
    const src = fs.readFileSync(file, 'utf8')
    // `import type` is erased at build time and never reaches the browser
    for (const m of src.matchAll(/(?:import(?!\s+type\b)[^'"]*?from\s*|import\s*\(\s*|export[^'"]*?from\s*)['"]([^'"]+)['"]/g)) {
      const dep = resolveImport(file, m[1])
      if (dep && !seen.has(dep)) {
        seen.add(dep)
        queue.push(dep)
      }
    }
  }
  return [...seen]
}

const rel = (f: string) => path.relative(ROOT, f).replace(/\\/g, '/')

describe('client messages (spec 005)', () => {
  const files = clientFiles()
  const calls = files.flatMap((file) =>
    [...fs.readFileSync(file, 'utf8').matchAll(/\buseTranslations\(([^)]*)\)/g)].map((m) => ({
      file: rel(file),
      arg: m[1].trim(),
    })),
  )

  it('finds client code, including files without the directive', () => {
    expect(files.length).toBeGreaterThan(50)
    expect(files.map(rel)).toContain('components/contacts/edit-contact-dialog.tsx')
    expect(files.map(rel)).toContain('app/[locale]/(marketing)/pricing/page.tsx') // BOM before 'use client'
    expect(files.map(rel)).not.toContain('app/[locale]/(marketing)/layout.tsx')
  })

  it('every client useTranslations uses a literal namespace', () => {
    const dynamic = calls.filter((c) => !/^(['"])[\w.]+\1$/.test(c.arg)).map((c) => `${c.file}: useTranslations(${c.arg})`)
    expect(dynamic).toEqual([])
  })

  it('every client namespace is covered by CLIENT_MESSAGE_PATHS', () => {
    const missing = calls
      .filter((c) => /^(['"])[\w.]+\1$/.test(c.arg)) // dynamic args fail the test above
      .map((c) => ({ ...c, ns: c.arg.slice(1, -1) }))
      .filter((c) => !isCoveredByClientMessages(c.ns))
      .map((c) => `${c.file}: '${c.ns}'`)
    expect(missing).toEqual([])
  })

  it('every listed path exists in the real messages', () => {
    const dir = path.join(ROOT, 'messages/pt-BR')
    const messages = Object.fromEntries(
      ['common', 'components', 'marketing'].map((ns) => [ns, JSON.parse(fs.readFileSync(path.join(dir, `${ns}.json`), 'utf8'))]),
    )
    const picked = pickMessages(messages, CLIENT_MESSAGE_PATHS)
    for (const p of CLIENT_MESSAGE_PATHS) {
      const node = p.split('.*')[0].split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], picked)
      expect(node, p).toBeTruthy()
    }
    expect(JSON.stringify(picked).length).toBeLessThan(26_000) // SC-001
  })

  it('projects wildcards without mutating the source', () => {
    const src = { a: { x: { name: 'X', body: 'long' }, y: { name: 'Y', body: 'long' } }, b: 'no' }
    const before = JSON.stringify(src)
    expect(pickMessages(src, ['a.*.name'])).toEqual({ a: { x: { name: 'X' }, y: { name: 'Y' } } })
    expect(JSON.stringify(src)).toBe(before)
    expect(pickMessages(src, ['a', 'a.*.name'])).toEqual({ a: src.a })
    expect(isCoveredByClientMessages('marketing.about')).toBe(false)
    expect(isCoveredByClientMessages('marketing')).toBe(false)
  })
})
