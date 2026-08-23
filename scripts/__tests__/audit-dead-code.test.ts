import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Roda o scanner real contra uma árvore sandbox — só assim dá pra controlar
// o resultado ("tem item fora da allowlist" / "não tem") sem depender do
// estado atual do repositório, que muda a cada história desta feature.
const SCRIPT = path.resolve(__dirname, '../audit-dead-code.js');

let sandbox: string;

function writeAllowlist(content: unknown) {
  mkdirSync(path.join(sandbox, 'scripts'), { recursive: true });
  writeFileSync(path.join(sandbox, 'scripts/dead-code-allowlist.json'), JSON.stringify(content));
}

function run(args: string[] = []) {
  return spawnSync('node', [SCRIPT, ...args], { cwd: sandbox, encoding: 'utf8' });
}

beforeEach(() => {
  sandbox = mkdtempSync(path.join(tmpdir(), 'audit-dead-code-'));
  // uma rota sem nenhum chamador em todo o sandbox
  mkdirSync(path.join(sandbox, 'app/api/orphan'), { recursive: true });
  writeFileSync(path.join(sandbox, 'app/api/orphan/route.ts'), 'export async function GET() { return new Response("ok"); }\n');
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe('audit-dead-code.js --check', () => {
  it('sai 1 quando há item fora da allowlist', () => {
    writeAllowlist({ routes: [], files: [] });

    const result = run(['--check']);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('/api/orphan');
  });

  it('sai 0 quando o mesmo item está na allowlist', () => {
    writeAllowlist({ routes: [{ path: '/api/orphan', reason: 'exceção de teste' }], files: [] });

    const result = run(['--check']);

    expect(result.status).toBe(0);
  });

  it('falha com entrada sem "reason", nos dois modos', () => {
    writeAllowlist({ routes: [{ path: '/api/orphan' }], files: [] });

    const checkResult = run(['--check']);
    const reportResult = run([]);

    expect(checkResult.status).toBe(1);
    expect(checkResult.stderr).toContain('reason');
    expect(reportResult.status).toBe(1);
    expect(reportResult.stderr).toContain('reason');
  });
});
