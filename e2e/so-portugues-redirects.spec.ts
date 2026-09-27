/**
 * E2E: o locale EN foi aposentado (spec 004).
 *
 * Este arquivo provava o oposto — que /en, /en/pricing e /en/about renderizavam
 * em inglês, com canários em português que NÃO podiam aparecer. Agora prova que
 * nenhuma URL /en serve conteúdo: cada uma redireciona (308) para o caminho em
 * português, e a página que responde é a PT.
 *
 * As URLs /en seguem indexadas no Google por meses, então o redirect é o
 * contrato que precisa continuar de pé — não a ausência da rota.
 */
import { test, expect } from '@playwright/test'

// Cada regra de redirect de next.config.ts, com o destino em PT que ela deve herdar.
const REDIRECTS: [string, string][] = [
  ['/en', '/'],
  ['/en/pricing', '/pricing'],
  ['/en/about', '/about'],
  ['/en/proposal', '/proposta'],
  ['/en/yearbook', '/anuario'],
  ['/en/automatic-sales', '/vendas-automaticas'],
  ['/en/automated-sales', '/vendas-automaticas'],
  ['/en/checkout/success', '/checkout/sucesso'],
  ['/en/tools/calculadora-roi', '/ferramentas/calculadora-roi'],
  ['/en/solutions/energia-solar', '/solucoes/energia-solar'],
  ['/en/blog/category/vendas', '/blog/categoria/vendas'],
]

test.describe('Só português — o locale EN foi aposentado', () => {
  for (const [from, to] of REDIRECTS) {
    test(`${from} redireciona para ${to}`, async ({ request }) => {
      const response = await request.get(from, { maxRedirects: 0 })

      expect(response.status()).toBe(308)

      // O Location precisa apontar para o equivalente em PT, não para a home:
      // redirect em massa para / é lido como soft-404 e a autoridade da URL evapora.
      const location = response.headers()['location']
      expect(location).toBeTruthy()
      expect(new URL(location, 'http://localhost:3000').pathname).toBe(to)
    })
  }

  test('a home não oferece mais troca de idioma', async ({ page }) => {
    await page.goto('/')

    expect(await page.getAttribute('html', 'lang')).toBe('pt-BR')
    await expect(page.getByRole('button', { name: /idioma|language/i })).toHaveCount(0)
  })

  test('nenhuma página anuncia uma versão em inglês', async ({ page }) => {
    for (const path of ['/', '/pricing', '/blog']) {
      await page.goto(path)
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(0)
    }
  })

  test('o sitemap não lista nenhuma URL /en', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.ok()).toBeTruthy()

    const xml = await response.text()
    expect(xml).not.toContain('/en/')
    expect(xml).not.toContain('hreflang')
  })
})
