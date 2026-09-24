/**
 * Next merges metadata per top-level key: a page that sets `openGraph` without `images` replaces the root
 * layout's object and ships no og:image at all (26 public pages did, including /blog). This names the file.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()

function* files(dir: string): Generator<string> {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name)
    if (d.isDirectory()) yield* files(p)
    else if (/\.tsx?$/.test(d.name)) yield p
  }
}

// Body of each `openGraph: { ... }` object, by brace count (metadata objects carry no braces in strings)
function openGraphBlocks(src: string): string[] {
  const blocks: string[] = []
  for (const m of src.matchAll(/openGraph:\s*\{/g)) {
    let depth = 0
    let i = m.index! + m[0].length - 1
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++
      else if (src[i] === '}' && --depth === 0) break
    }
    blocks.push(src.slice(m.index!, i + 1))
  }
  return blocks
}

describe('og:image', () => {
  it('every openGraph object sets images', () => {
    const missing: string[] = []
    for (const f of files(path.join(ROOT, 'app'))) {
      const blocks = openGraphBlocks(fs.readFileSync(f, 'utf8'))
      if (blocks.some(b => !/\bimages\s*:/.test(b))) missing.push(path.relative(ROOT, f).split(path.sep).join('/'))
    }
    expect(missing).toEqual([])
  })

  it('the brace walk finds the image inside the block, not after it', () => {
    const [block] = openGraphBlocks("x = { openGraph: { title: t('a'), url: { u: 1 } }, images: [] }")
    expect(/\bimages\s*:/.test(block)).toBe(false)
  })
})
