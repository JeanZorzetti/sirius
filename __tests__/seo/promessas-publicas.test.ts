/**
 * Spec 013: public copy is an offer that binds (CDC art. 30). These guards fail when a promise the product does not
 * keep comes back into the public pages, and when the /features plan table drifts from PLAN_LIMITS.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { PLAN_LIMITS } from '@/lib/entitlements'
import { tabelaDePlanos, limitePorPlano } from '@/lib/plan-table'

const ROOT = process.cwd()

const PUBLICO = [
  'messages/pt-BR/marketing.json',
  'messages/pt-BR/emails.json',
  'app/[locale]/(marketing)',
  'app/[locale]/(fluxo)',
  'config',
  'lib/blog/posts',
  'lib/help-articles.ts',
  'components/marketing',
  'components/calculadora-roi.tsx',
]

// Each one was published and is false: the Free plan is read-only after the 14-day trial, SSO/offline writes/full audit
// log do not exist, and no rating or customer count was ever collected.
const PROIBIDO: [RegExp, string][] = [
  [/(gr[aá]tis|gratuito|free) (para sempre|forever)|free plan forever/i, 'plano gratuito "para sempre"'],
  [/sem prazo de expira/i, 'plano gratuito "sem prazo"'],
  [/7 dias (do|de) pro|7 days of pro/i, 'teste de 7 dias (agora são 14)'],
  [/ponta a ponta|end-to-end encrypt/i, 'criptografia de ponta a ponta'],
  [/\bSSO\b/, 'SSO'],
  [/aggregateRating/, 'avaliação sem avaliações coletadas'],
  [/\+ ?[0-9][0-9.]* (corretores|agências|integradoras|consultores|representantes|times) /i, 'contagem de clientes'],
  [/sync offline|sincroniza (depois|automaticamente quando)/i, 'registro offline com sincronização'],
  [/abertura e cliques|opens and clicks/i, 'métrica de abertura e clique de e-mail'],
  [/padrões de perda/i, 'IA que analisa perdas'],
]

function* arquivos(alvo: string): Generator<string> {
  const p = path.join(ROOT, alvo)
  if (!fs.existsSync(p)) return
  if (fs.statSync(p).isFile()) {
    yield p
    return
  }
  for (const d of fs.readdirSync(p, { withFileTypes: true })) {
    const filho = path.join(alvo, d.name)
    if (d.isDirectory()) yield* arquivos(filho)
    else if (/\.(tsx?|json)$/.test(d.name)) yield path.join(ROOT, filho)
  }
}

describe('texto público só promete o que existe (spec 013)', () => {
  const achados: string[] = []
  for (const alvo of PUBLICO) {
    for (const arquivo of arquivos(alvo)) {
      const linhas = fs.readFileSync(arquivo, 'utf8').split('\n')
      linhas.forEach((linha, i) => {
        for (const [re, nome] of PROIBIDO) {
          if (re.test(linha)) achados.push(`${path.relative(ROOT, arquivo)}:${i + 1} — ${nome}`)
        }
      })
    }
  }

  it('nenhuma promessa proibida', () => {
    expect(achados).toEqual([])
  })
})

describe('tabela da /features vem de PLAN_LIMITS (spec 013)', () => {
  const t = tabelaDePlanos()

  it('números batem com o que o produto aplica', () => {
    expect(t.contacts.starter).toBe(PLAN_LIMITS.STARTER.maxContacts!.toLocaleString('pt-BR'))
    expect(t.deals.pro).toBe(PLAN_LIMITS.PRO.maxDeals!.toLocaleString('pt-BR'))
    expect(t.pipelines.business).toBe(String(PLAN_LIMITS.BUSINESS.maxPipelines))
    expect(t.contacts.business).toBe('Ilimitado')
    expect(t.tasks.business).toBe('Ilimitado')
  })

  it('a coluna do teste mostra o Pro, que é o que o teste entrega', () => {
    expect(t.contacts.free).toBe(t.contacts.pro)
    expect(t.users.free).toBe(t.users.pro)
  })

  it('páginas de recurso com limite leem o mesmo número', () => {
    expect(limitePorPlano('contacts')).toContain(`Starter: ${PLAN_LIMITS.STARTER.maxContacts!.toLocaleString('pt-BR')}`)
    expect(limitePorPlano('inbox')).toBeNull()
  })
})
