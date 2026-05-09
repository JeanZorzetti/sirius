/**
 * E2E tests for API error localization via Accept-Language header.
 *
 * Uses GET /api/automations which passes `req` to apiError(), enabling
 * Accept-Language-based locale resolution for unauthenticated callers.
 */
import { test, expect } from '@playwright/test'

const ENDPOINT = '/api/automations'

test.describe('i18n — API error localization', () => {
  test('unauthenticated request with Accept-Language: en returns English error', async ({
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
    expect(body.error).toBe('Unauthorized')
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
