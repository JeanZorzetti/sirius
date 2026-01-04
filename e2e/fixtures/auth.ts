import { test as base, expect } from '@playwright/test'
import { Page } from '@playwright/test'

type AuthFixtures = {
  authenticatedPage: Page
  freeUserPage: Page
  proUserPage: Page
}

/**
 * Helper function to login via UI
 */
async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

/**
 * Helper function to register a new user
 */
async function register(
  page: Page,
  email: string,
  password: string,
  name: string,
  organizationName: string
) {
  await page.goto('/register')
  await page.fill('input[name="name"]', name)
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.fill('input[name="organizationName"]', organizationName)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Generic authenticated page - creates a temporary test user
   */
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // Create a unique test user
    const timestamp = Date.now()
    const testEmail = `test-${timestamp}@example.com`
    const testPassword = 'Test123456!'
    const testName = `Test User ${timestamp}`
    const testOrg = `Test Org ${timestamp}`

    // Register and login
    await register(page, testEmail, testPassword, testName, testOrg)

    // Use the authenticated page
    await use(page)

    // Cleanup
    await context.close()
  },

  /**
   * Free user page - authenticated user with FREE plan
   */
  freeUserPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    const timestamp = Date.now()
    const testEmail = `free-${timestamp}@example.com`
    const testPassword = 'Test123456!'
    const testName = `Free User ${timestamp}`
    const testOrg = `Free Org ${timestamp}`

    // Register (defaults to FREE plan)
    await register(page, testEmail, testPassword, testName, testOrg)

    await use(page)
    await context.close()
  },

  /**
   * Pro user page - authenticated user with PRO plan
   * Note: This requires either:
   * 1. Manually upgrading via Stripe checkout in the test
   * 2. Direct database manipulation (for faster tests)
   * For now, this is a placeholder - implement based on testing strategy
   */
  proUserPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    const timestamp = Date.now()
    const testEmail = `pro-${timestamp}@example.com`
    const testPassword = 'Test123456!'
    const testName = `Pro User ${timestamp}`
    const testOrg = `Pro Org ${timestamp}`

    // Register
    await register(page, testEmail, testPassword, testName, testOrg)

    // TODO: Upgrade to PRO
    // Option 1: Use Stripe test mode checkout
    // Option 2: Direct database update (faster but requires test DB setup)
    // For now, this user is still FREE - implement upgrade logic as needed

    await use(page)
    await context.close()
  },
})

export { expect }
