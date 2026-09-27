/**
 * E2E: erro de API sempre em português.
 *
 * Usa GET /api/automations, que passa `req` para apiError(). Antes da
 * aposentadoria do locale EN (spec 004), esse caminho resolvia o idioma pelo
 * Accept-Language; agora o cabeçalho não é mais sinal de nada e o primeiro
 * teste existe justamente para provar que ele é ignorado.
 */
import { test, expect } from '@playwright/test'

const ENDPOINT = '/api/automations'

test.describe('Só português — erros da API', () => {
  test('Accept-Language: en é ignorado — o erro sai em português', async ({
    request,
  }) => {
    const response = await request.get(ENDPOINT, {
      headers: {
        'Accept-Language': 'en',
      },
    })

    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)

    const body = await response.json()
    expect(body).toHaveProperty('error')
    expect(typeof body.error).toBe('string')
    expect(body.error).toBe('Não autorizado')
  })

  test('unauthenticated request with Accept-Language: pt-BR returns Portuguese error', async ({
    request,
  }) => {
    const response = await request.get(ENDPOINT, {
      headers: {
        'Accept-Language': 'pt-BR',
      },
    })

    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)

    const body = await response.json()
    expect(body).toHaveProperty('error')
    expect(typeof body.error).toBe('string')
    expect(body.error).toBe('Não autorizado')
  })

  test('unauthenticated request with no Accept-Language header returns Portuguese error (default locale)', async ({
    request,
  }) => {
    const response = await request.get(ENDPOINT)

    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)

    const body = await response.json()
    expect(body).toHaveProperty('error')
    expect(body.error).toBe('Não autorizado')
  })
})
