import { test as base, expect } from '@playwright/test'
import { Page } from '@playwright/test'
import { RegisterPage } from '../page-objects/register-page'
import { DashboardPage } from '../page-objects/dashboard-page'

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
  await page.waitForURL(/\/dashboard/)
}

/**
 * Registers a new user through the real signup form and lands on the dashboard
 */
async function register(page: Page, email: string, password: string, name: string, organizationName: string) {
  await page.goto('/register')
  await new RegisterPage(page).register(name, email, password, organizationName)
  await page.waitForURL(/\/dashboard/)
  await new DashboardPage(page).dismissWelcome()
}

/**
 * For the task specs: a fresh user plus a task project created through the app's own API
 */
export async function authenticatedPage(page: Page): Promise<{ page: Page; projectId: string }> {
  const ts = Date.now()
  await register(page, `tasks-${ts}@example.com`, 'Test123456!', `Tasks User ${ts}`, `Tasks Org ${ts}`)
  const res = await page.request.post('/api/task-projects', { data: { name: `Projeto ${ts}` } })
  expect(res.status()).toBe(201)
  const project = await res.json()
  return { page, projectId: project.id }
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
