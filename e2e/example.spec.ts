import { test, expect } from '@playwright/test'

test.describe('Playwright Setup Validation', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads
    await expect(page).toHaveTitle(/Sirius/i)

    // The header links to the login page
    await expect(page.getByRole('link', { name: /^login$/i }).first()).toBeVisible()
  })

  test('should load pricing page', async ({ page }) => {
    await page.goto('/pricing')

    // One card per plan, found by the id the page gives each title
    for (const id of ['free', 'starter', 'pro', 'business']) {
      await expect(page.locator(`#tier-${id}`)).toBeVisible()
    }
  })
})
