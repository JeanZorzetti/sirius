/**
 * CI script: detect hardcoded Portuguese strings in TypeScript/TSX source files.
 * Fails if match count exceeds the stored baseline.
 *
 * Usage:
 *   npx tsx scripts/detect-pt-strings.ts [--update-baseline]
 *
 * Add to package.json scripts:
 *   "check:i18n": "npx tsx scripts/detect-pt-strings.ts"
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'fs'
import { join, extname, relative } from 'path'

const ROOT = join(__dirname, '..')
const BASELINE_FILE = join(__dirname, 'i18n-baseline.json')

// Directories to scan
const SCAN_DIRS = ['app', 'components', 'lib']

// Directories/files to exclude (content with PT strings that are intentional)
const EXCLUDE_PATTERNS = [
  'messages/',
  'node_modules/',
  'lib/blog-data.ts',
  'lib/blog/',
  'lib/agi/prompts/',
  'lib/agi/guardrails.ts',
  'lib/agi/sandler-prompts.ts',
  'lib/agi/spin-engine.ts',
  '.test.',
  '.spec.',
  'scripts/',
  '__tests__/',
  'CLAUDE.md',
]

// PT-BR canary strings in string literals (inside quotes)
const PT_PATTERNS: RegExp[] = [
  // Common UI strings
  /"Cancelar"/,
  /"Salvar"/,
  /"Salvando\.\.\."/,
  /"Excluir"/,
  /"Adicionar"/,
  /"Editar"/,
  /"Confirmar"/,
  /"Carregando\.\.\."/,
  /"Enviando\.\.\."/,
  /'Cancelar'/,
  /'Salvar'/,
  /'Excluir'/,
  /'Adicionar'/,
  /'Editar'/,
  /'Confirmar'/,
  /'Carregando\.\.\.'/,

  // Auth/error messages
  /"Não autorizado"/,
  /"Acesso negado"/,
  /"Não encontrado"/,
  /'Não autorizado'/,
  /'Acesso negado'/,
  /'Usuário não pertence/,
  /'Erro ao buscar'/,
  /"Usuário não pertence/,
  /"Erro ao buscar"/,

  // Success/toast messages
  /"Salvo com sucesso"/,
  /"Excluído com sucesso"/,
  /"Criado com sucesso"/,
  /"Atualizado com sucesso"/,
  /'Salvo com sucesso'/,
  /'Excluído com sucesso'/,
  /'Criado com sucesso'/,
]

interface Match {
  file: string
  line: number
  content: string
  pattern: string
}

function shouldExclude(filepath: string): boolean {
  const rel = relative(ROOT, filepath).replace(/\\/g, '/')
  return EXCLUDE_PATTERNS.some(p => rel.includes(p))
}

function walkDir(dir: string): string[] {
  const files: string[] = []
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...walkDir(full))
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name)
        if (['.ts', '.tsx'].includes(ext)) {
          files.push(full)
        }
      }
    }
  } catch {
    // ignore unreadable dirs
  }
  return files
}

function scanFile(filepath: string): Match[] {
  if (shouldExclude(filepath)) return []

  const content = readFileSync(filepath, 'utf-8')
  const lines = content.split('\n')
  const matches: Match[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Skip comments
    if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue

    for (const pattern of PT_PATTERNS) {
      if (pattern.test(line)) {
        matches.push({
          file: relative(ROOT, filepath).replace(/\\/g, '/'),
          line: i + 1,
          content: line.trim().substring(0, 120),
          pattern: pattern.toString(),
        })
        break // one match per line is enough
      }
    }
  }
  return matches
}

function main() {
  const updateBaseline = process.argv.includes('--update-baseline')

  console.log('🔍 Scanning for hardcoded PT-BR strings...\n')

  const allMatches: Match[] = []

  for (const dir of SCAN_DIRS) {
    const fullDir = join(ROOT, dir)
    if (!existsSync(fullDir)) continue
    const files = walkDir(fullDir)
    for (const file of files) {
      allMatches.push(...scanFile(file))
    }
  }

  const count = allMatches.length

  if (allMatches.length > 0) {
    console.log(`Found ${count} hardcoded PT-BR string(s):\n`)
    for (const m of allMatches.slice(0, 50)) {
      console.log(`  ${m.file}:${m.line}`)
      console.log(`    ${m.content}\n`)
    }
    if (allMatches.length > 50) {
      console.log(`  ... and ${allMatches.length - 50} more\n`)
    }
  }

  if (updateBaseline) {
    writeFileSync(BASELINE_FILE, JSON.stringify({ count, updatedAt: new Date().toISOString() }, null, 2))
    console.log(`✅ Baseline updated: ${count} matches`)
    process.exit(0)
  }

  let baseline = { count: 0 }
  if (existsSync(BASELINE_FILE)) {
    baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf-8'))
  }

  if (count > baseline.count) {
    console.error(`\n❌ FAIL: ${count} PT-BR strings found (baseline: ${baseline.count})`)
    console.error('Run with --update-baseline to accept current state, or fix the strings above.')
    process.exit(1)
  } else if (count < baseline.count) {
    console.log(`\n✅ PASS: ${count} PT-BR strings (${baseline.count - count} fixed since baseline)`)
    console.log('Run with --update-baseline to lower the baseline.')
  } else {
    console.log(`\n✅ PASS: ${count} PT-BR strings (matches baseline)`)
  }
}

main()
