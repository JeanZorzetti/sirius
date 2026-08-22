/**
 * Audit de código morto — arquivos sem importador e rotas de API sem chamador.
 *
 *   node scripts/audit-dead-code.js
 *
 * Reproduz os números de docs/AUDITORIA_OVER_ENGINEERING_2026-08-22.md.
 * Resolve import estático, `import()` dinâmico e `require()`. Não resolve
 * caminho montado em runtime (template string) — ver "Limites" no doc.
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const SEP = String.fromCharCode(92);
const rel = p => path.relative(root, p).split(SEP).join('/');
const SKIP = new Set([
  'node_modules', '.next', '.git', 'android', 'ios',
  '.specify', '.claude', 'coverage', 'playwright-report', 'test-results',
  'public', // service workers são registrados por string em runtime
]);

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) files.push(p);
  }
})(root);

const lines = f => fs.readFileSync(f, 'utf8').split('\n').length;
// `import(` precisa do parêntese opcional — sem ele todo dynamic import vira falso positivo
const IMPORT_RE = /(?:from|import|require)\s*\(?\s*['"]([^'"]+)['"]/g;
const API_RE = /\/api\/[A-Za-z0-9_\-\/\[\]${}.]*/g;

// ---------------------------------------------------------------- arquivos
const imported = new Set();
const apiMentions = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const [, spec] of src.matchAll(IMPORT_RE)) {
    let abs;
    if (spec.startsWith('@/')) abs = path.join(root, spec.slice(2));
    else if (spec.startsWith('.')) abs = path.resolve(path.dirname(f), spec);
    else continue;
    imported.add(abs.toLowerCase());
    imported.add(path.join(abs, 'index').toLowerCase());
  }
  // uma rota citada dentro do próprio route.ts não conta como chamador
  if (/^app\/api\//.test(rel(f))) continue;
  for (const [url] of src.matchAll(API_RE)) apiMentions.push(url);
}

// entrypoints: o framework/CI carrega por convenção, ninguém importa
const isEntry = f => {
  const r = rel(f);
  return (/^app\//.test(r) && /\/(page|layout|route|loading|error|global-error|not-found|template|default|opengraph-image|twitter-image|icon|apple-icon|sitemap|robots|manifest)\.tsx?$/.test(r))
    || /^(middleware|instrumentation|instrumentation-client|next\.config|sentry\.|setup-tests|vitest|playwright|capacitor\.config|next-env|postcss|eslint)/.test(r)
    || /^(scripts|e2e|emails|mcp-server|prisma|ml-api|scraping-server|config|docker|i18n)\//.test(r)
    || /(^|\/)__tests__\//.test(r)
    || /\.(test|spec)\.tsx?$/.test(r);
};

const deadFiles = files
  .filter(f => !isEntry(f) && !imported.has(f.replace(/\.(ts|tsx|js|mjs)$/, '').toLowerCase()))
  .map(f => [lines(f), rel(f)])
  .sort((a, b) => b[0] - a[0]);

// ------------------------------------------------------------------ rotas
// webhooks, OAuth callbacks e specs públicas são chamados de fora do repo
const EXTERNAL = /^app\/api\/(webhooks?|cron|v1|auth|mcp|indexnow|og|sitemap|robots|health|openapi)\b|\/(webhook|callback)\/route\.ts$/;

const routes = files.filter(f => /^app\/api\/.*\/route\.ts$/.test(rel(f)));
const deadRoutes = routes
  .filter(f => !EXTERNAL.test(rel(f)))
  .filter(f => {
    const url = '/' + rel(f).replace(/^app\//, '').replace(/\/route\.ts$/, '');
    const prefix = url.split('[')[0].replace(/\/$/, '');
    return !apiMentions.some(m => m.startsWith(prefix));
  })
  .map(f => [lines(f), '/' + rel(f).replace(/^app\//, '').replace(/\/route\.ts$/, '')])
  .sort((a, b) => b[0] - a[0]);

// ----------------------------------------------------------------- output
const sum = rows => rows.reduce((acc, [n]) => acc + n, 0);
const report = (title, rows, total) => {
  console.log(`\n${title}: ${rows.length}${total ? '/' + total : ''} | ${sum(rows)} linhas`);
  for (const [n, name] of rows) console.log(String(n).padStart(6), name);
};

report('ARQUIVOS SEM IMPORTADOR', deadFiles);
report('ROTAS DE API SEM CHAMADOR', deadRoutes, routes.length);
console.log(`\ntotal removível: ${sum(deadFiles) + sum(deadRoutes)} linhas`);
