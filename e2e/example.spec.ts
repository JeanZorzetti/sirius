import { test, expect } from '@playwright/test'

test.describe('Playwright Setup Validation', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads
    await expect(page).toHaveTitle(/Sirius/i)

    // Check that main navigation is present
    const loginButton = page.getByRole('link', { name: /login/i })
    await expect(loginButton).toBeVisible()
  })

  test('should load pricing page', async ({ page }) => {
    await page.goto('/pricing')

    // Check that pricing tiers are visible (using first() to avoid strict mode violations)
    await expect(page.getByText(/Solopreneur/i).first()).toBeVisible()
    await expect(page.getByText(/Growth/i).first()).toBeVisible()
    await expect(page.getByText(/Enterprise/i).first()).toBeVisible()

    // Check that multiple pipelines feature is mentioned
    await expect(page.getByText(/Múltiplos Pipelines/i)).toBeVisible()

    // Check that pricing is displayed
    await expect(page.getByText(/Grátis/i).first()).toBeVisible()
    await expect(page.getByText(/R\$ 49/i).first()).toBeVisible()
  })
})
