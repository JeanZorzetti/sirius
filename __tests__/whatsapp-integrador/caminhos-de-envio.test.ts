// @vitest-environment node
import fs from 'fs'
import path from 'path'
import { describe, it, expect } from 'vitest'

/**
 * SC-006: through the integrator only a person sends, from the inbox. Every other sending path talks to the official
 * API or answers 410, and none of them may import the integrator sending code.
 */
const raiz = path.resolve(__dirname, '../..')
const outrosCaminhos = [
  'app/api/whatsapp/forward/route.ts',
  'app/api/whatsapp/send-template/route.ts',
  'app/api/whatsapp/send-buttons/route.ts',
  'app/api/whatsapp/send-location/route.ts',
  'lib/agaas-executor.ts',
  'app/api/v1/whatsapp/send/route.ts',
]

describe('caminhos de envio que não passam pelo integrador (SC-006)', () => {
  it.each(outrosCaminhos)('%s não importa lib/whatsapp/integradores', (arquivo) => {
    const codigo = fs.readFileSync(path.join(raiz, arquivo), 'utf8')
    expect(codigo).not.toMatch(/whatsapp\/integradores/)
  })

  it('só send-message e send-media, no inbox, chamam o envio do integrador', () => {
    const achados: string[] = []
    const varrer = (dir: string) => {
      for (const nome of fs.readdirSync(dir)) {
        if (['node_modules', '.next', '__tests__', '.git'].includes(nome)) continue
        const cheio = path.join(dir, nome)
        if (fs.statSync(cheio).isDirectory()) varrer(cheio)
        else if (/\.(ts|tsx)$/.test(nome) && /\.enviar(Texto|Midia)\(/.test(fs.readFileSync(cheio, 'utf8'))) {
          achados.push(path.relative(raiz, cheio).replace(/\\/g, '/'))
        }
      }
    }
    for (const dir of ['app', 'lib', 'components']) varrer(path.join(raiz, dir))
    expect(achados.sort()).toEqual(['app/api/whatsapp/send-media/route.ts', 'app/api/whatsapp/send-message/route.ts'])
  }, 60_000) // walks app, lib and components; slow under the parallel full run
})
