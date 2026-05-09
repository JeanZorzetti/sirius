import { test, expect } from '@playwright/test'

const PT_CANARIES = [
  'Funcionalidades',
  'Preços',
  'Começar grátis',
  'Começar Grátis',
  'Soluções',
  'Ferramentas',
  'Entrar',
  'Receita Recorrente',
  'Nova Geração',
]

test.describe('i18n — EN marketing pages', () => {
  test('/en homepage renders in English', async ({ page }) => {
    await page.goto('/en')

    // html lang attribute must be "en"
    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBe('en')

    // Page title must be in English (no PT canary words)
    const title = await page.title()
    expect(title).toMatch(/Sirius/i)
    for (const canary of PT_CANARIES) {
      expect(title).not.toContain(canary)
    }

    // No PT canary strings visible in body text
    const bodyText = await page.locator('body').innerText()
    for (const canary of PT_CANARIES) {
      expect(bodyText).not.toContain(canary)
    }

    // English nav link should be present
    await expect(page.getByText('Features').first()).toBeVisible()
  })

  test('/en/pricing renders in English', async ({ page }) => {
    await page.goto('/en/pricing')

    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBe('en')

    const title = await page.title()
    expect(title).toMatch(/Sirius/i)
    for (const canary of PT_CANARIES) {
      expect(title).not.toContain(canary)
    }

    const bodyText = await page.locator('body').innerText()
    for (const canary of PT_CANARIES) {
      expect(bodyText).not.toContain(canary)
    }

    // English pricing copy should be present
    await expect(page.getByText('Pricing').first()).toBeVisible()
  })

  test('/en/about renders in English', async ({ page }) => {
    await page.goto('/en/about')

    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBe('en')

    const title = await page.title()
    expect(title).toMatch(/Sirius/i)
    for (const canary of PT_CANARIES) {
      expect(title).not.toContain(canary)
    }

    const bodyText = await page.locator('body').innerText()
    for (const canary of PT_CANARIES) {
      expect(bodyText).not.toContain(canary)
    }

    // English about-page content should be present
    await expect(page.getByText('About').first()).toBeVisible()
  })
})
