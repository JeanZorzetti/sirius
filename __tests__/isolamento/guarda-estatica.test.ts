// @vitest-environment node
import path from 'path'
import { describe, it, expect } from 'vitest'
import { varrer } from './varredura'

describe('isolamento entre contas (spec 011)', () => {
  it('toda consulta ou gravação por id carrega a conta, confere a conta ou justifica por escrito', () => {
    const achados = varrer(path.resolve(__dirname, '../..')).map((a) => `${a.arquivo}:${a.linha} ${a.modelo}.${a.op} — ${a.motivo}`)
    // To fix: add the organization to the where, compare `x.organizationId` with the caller's after the lookup,
    // or write `// isolamento: <reason>` above the call when it crosses organizations on purpose.
    expect(achados).toEqual([])
  }, 60_000)
})
