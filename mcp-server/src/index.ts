import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import pg from 'pg'

const execAsync = promisify(exec)

const PROJECT_ROOT = 'C:/Users/jeanz/OneDrive/Desktop/ROI Labs/CRM/crm-project'
const DATABASE_URL = 'postgres://siriusdb:PAzo18**@2.24.207.200:5433/siriusdb?sslmode=disable'

const pool = new pg.Pool({ connectionString: DATABASE_URL })

const server = new McpServer({ name: 'sirius-crm', version: '1.0.0' })

function resolveSafe(relOrAbs: string): string {
  if (path.isAbsolute(relOrAbs)) return relOrAbs
  return path.join(PROJECT_ROOT, relOrAbs)
}

// ── read_file ─────────────────────────────────────────────────────────────────
server.tool(
  'read_file',
  'Read any file from the Sirius CRM project. Path can be relative to project root or absolute.',
  { path: z.string() },
  async ({ path: p }) => {
    const content = await fs.readFile(resolveSafe(p), 'utf-8')
    return { content: [{ type: 'text', text: content }] }
  },
)

// ── write_file ────────────────────────────────────────────────────────────────
server.tool(
  'write_file',
  'Write or overwrite a file. Creates parent directories automatically.',
  { path: z.string(), content: z.string() },
  async ({ path: p, content }) => {
    const full = resolveSafe(p)
    await fs.mkdir(path.dirname(full), { recursive: true })
    await fs.writeFile(full, content, 'utf-8')
    return { content: [{ type: 'text', text: `Written: ${full}` }] }
  },
)

// ── edit_file ─────────────────────────────────────────────────────────────────
server.tool(
  'edit_file',
  'Replace a string inside a file. Fails if old_string is not found.',
  {
    path: z.string(),
    old_string: z.string(),
    new_string: z.string(),
    replace_all: z.boolean().optional(),
  },
  async ({ path: p, old_string, new_string, replace_all }) => {
    const full = resolveSafe(p)
    const content = await fs.readFile(full, 'utf-8')
    if (!content.includes(old_string))
      throw new Error(`String not found: ${old_string.slice(0, 100)}`)
    const updated = replace_all
      ? content.split(old_string).join(new_string)
      : content.replace(old_string, new_string)
    await fs.writeFile(full, updated, 'utf-8')
    return { content: [{ type: 'text', text: `Edited: ${full}` }] }
  },
)

// ── delete_file ───────────────────────────────────────────────────────────────
server.tool(
  'delete_file',
  'Delete a file from the project.',
  { path: z.string() },
  async ({ path: p }) => {
    await fs.unlink(resolveSafe(p))
    return { content: [{ type: 'text', text: `Deleted: ${p}` }] }
  },
)

// ── list_files ────────────────────────────────────────────────────────────────
server.tool(
  'list_files',
  'List files in a project directory. Set recursive=true to walk subdirectories (skips node_modules, .next, .git).',
  {
    path: z.string().optional(),
    recursive: z.boolean().optional(),
  },
  async ({ path: p, recursive }) => {
    const full = resolveSafe(p ?? '')
    if (recursive) {
      const { stdout } = await execAsync(
        `find "${full}" -type f -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/.git/*" -not -path "*/dist/*"`,
      )
      return { content: [{ type: 'text', text: stdout }] }
    }
    const entries = await fs.readdir(full, { withFileTypes: true })
    const lines = entries.map((e) => `${e.isDirectory() ? 'd' : 'f'} ${e.name}`)
    return { content: [{ type: 'text', text: lines.join('\n') }] }
  },
)

// ── search_files ──────────────────────────────────────────────────────────────
server.tool(
  'search_files',
  'Grep for a pattern across project source files. Returns up to 100 matches.',
  {
    pattern: z.string(),
    glob: z.string().optional().describe('e.g. "*.ts" or "*.tsx"'),
    case_sensitive: z.boolean().optional(),
  },
  async ({ pattern, glob, case_sensitive }) => {
    const flag = case_sensitive ? '' : '-i'
    const include = glob
      ? `--include="${glob}"`
      : '--include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.md" --include="*.prisma" --include="*.css"'
    const cmd = `grep -rn ${flag} ${include} "${pattern}" "${PROJECT_ROOT}" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git --exclude-dir=dist 2>/dev/null | head -100`
    const { stdout } = await execAsync(cmd).catch(() => ({ stdout: '' }))
    return { content: [{ type: 'text', text: stdout || '(no matches)' }] }
  },
)

// ── run_command ───────────────────────────────────────────────────────────────
server.tool(
  'run_command',
  'Run a shell command in the project root (or a specified subdirectory). DATABASE_URL is pre-set.',
  {
    command: z.string(),
    cwd: z.string().optional(),
    timeout_ms: z.number().optional(),
  },
  async ({ command, cwd, timeout_ms }) => {
    const workdir = cwd ? resolveSafe(cwd) : PROJECT_ROOT
    const { stdout, stderr } = await execAsync(command, {
      cwd: workdir,
      timeout: timeout_ms ?? 60000,
      env: { ...process.env, DATABASE_URL },
    })
    const out = [stdout, stderr].filter(Boolean).join('\n--- stderr ---\n')
    return { content: [{ type: 'text', text: out || '(no output)' }] }
  },
)

// ── db_query ──────────────────────────────────────────────────────────────────
server.tool(
  'db_query',
  'Execute a raw SQL query against the Sirius CRM production database (postgres). Returns JSON rows.',
  {
    sql: z.string(),
    params: z.array(z.unknown()).optional(),
  },
  async ({ sql, params }) => {
    const client = await pool.connect()
    try {
      const result = await client.query(sql, params as unknown[] | undefined)
      const text = JSON.stringify(result.rows, null, 2)
      return { content: [{ type: 'text', text: `${result.rowCount} rows\n\n${text}` }] }
    } finally {
      client.release()
    }
  },
)

// ── get_schema ────────────────────────────────────────────────────────────────
server.tool(
  'get_schema',
  'Read the Prisma schema (all database models and their fields).',
  {},
  async () => {
    const content = await fs.readFile(path.join(PROJECT_ROOT, 'prisma/schema.prisma'), 'utf-8')
    return { content: [{ type: 'text', text: content }] }
  },
)

// ── get_project_info ──────────────────────────────────────────────────────────
server.tool(
  'get_project_info',
  'Get a quick overview of the Sirius CRM project: stack, DB, paths, and coding conventions from CLAUDE.md.',
  {},
  async () => {
    const [claudeMd, pkgRaw] = await Promise.all([
      fs.readFile(path.join(PROJECT_ROOT, 'CLAUDE.md'), 'utf-8').catch(() => ''),
      fs.readFile(path.join(PROJECT_ROOT, 'package.json'), 'utf-8').catch(() => '{}'),
    ])
    const pkg = JSON.parse(pkgRaw)
    const info = [
      `# Sirius CRM — Project Info`,
      ``,
      `**Root:** ${PROJECT_ROOT}`,
      `**Next.js:** ${pkg.dependencies?.next ?? '?'}`,
      `**Prisma:** ${pkg.dependencies?.['@prisma/client'] ?? '?'}`,
      `**DB (production):** postgres://siriusdb:***@2.24.207.200:5433/siriusdb`,
      ``,
      `---`,
      ``,
      claudeMd,
    ].join('\n')
    return { content: [{ type: 'text', text: info }] }
  },
)

// ── Start server ──────────────────────────────────────────────────────────────
const transport = new StdioServerTransport()
await server.connect(transport)
