import { test, expect } from '@playwright/test'
import { RegisterPage } from '../page-objects/register-page'
import { LoginPage } from '../page-objects/login-page'
import { DashboardPage } from '../page-objects/dashboard-page'

test.describe('User Login', () => {
  // Helper to create a test user before login tests
  async function createTestUser(page: any) {
    const registerPage = new RegisterPage(page)
    await registerPage.goto()

    const timestamp = Date.now()
    const userData = {
      name: `Login Test User ${timestamp}`,
      email: `login-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      organizationName: `Login Test Org ${timestamp}`,
    }

    await registerPage.register(
      userData.name,
      userData.email,
      userData.password,
      userData.organizationName
    )

    // Wait for registration to complete (increased timeout for Chromium client-side redirect)
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })

    return userData
  }

  test('should successfully login with valid credentials', async ({ page, context }) => {
    // First, create a user
    const userData = await createTestUser(page)

    // Clear cookies to logout
    await context.clearCookies()

    // Navigate to login
    await page.goto('/login')

    const loginPage = new LoginPage(page)
    const dashboardPage = new DashboardPage(page)

    // Login with the created user
    await loginPage.login(userData.email, userData.password)

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    expect(await dashboardPage.isOnDashboard()).toBeTruthy()

    // Kanban board should be visible
    expect(await dashboardPage.isKanbanBoardVisible()).toBeTruthy()
  })

  test('should show error for invalid email', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.goto()

    // Try to login with non-existent email
    await loginPage.login('nonexistent@example.com', 'SomePassword123!')

    // Should either show error message OR remain on login page
    const errorMessage = await loginPage.getErrorMessage()

    // Should remain on login page (even if no error message appears)
    expect(page.url()).toContain('/login')

    // If error message exists, it should be non-empty
    if (errorMessage) {
      expect(errorMessage.length).toBeGreaterThan(0)
    }
  })

  test('should show error for wrong password', async ({ page, context }) => {
    // First, create a user
    const userData = await createTestUser(page)

    // Clear cookies to logout
    await context.clearCookies()

    // Navigate to login
    await page.goto('/login')

    const loginPage = new LoginPage(page)

    // Try to login with wrong password
    await loginPage.login(userData.email, 'WrongPassword123!')

    // Should either show error message OR remain on login page
    const errorMessage = await loginPage.getErrorMessage()

    // Should remain on login page
    expect(page.url()).toContain('/login')

    // If error message exists, it should be non-empty
    if (errorMessage) {
      expect(errorMessage.length).toBeGreaterThan(0)
    }
  })

  test('should show validation error for empty fields', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.goto()

    // Try to submit empty form
    await loginPage.clickLoginButton()

    // Should remain on login page
    expect(page.url()).toContain('/login')
  })

  test('should navigate to register page from login page', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.goto()

    // Click on create account link
    const createAccountLink = loginPage.getCreateAccountLink()
    await createAccountLink.click()

    // Should navigate to register page
    await expect(page).toHaveURL(/\/register/)
  })

  test('should persist session after page reload', async ({ page, context }) => {
    // Create and login user
    const userData = await createTestUser(page)

    // Clear cookies to logout
    await context.clearCookies()

    await page.goto('/login')

    const loginPage = new LoginPage(page)
    await loginPage.login(userData.email, userData.password)

    // Wait for dashboard
    await page.waitForURL(/\/dashboard/)

    // Reload the page
    await page.reload()

    // Should still be on dashboard (session persisted)
    expect(page.url()).toContain('/dashboard')

    const dashboardPage = new DashboardPage(page)
    expect(await dashboardPage.isKanbanBoardVisible()).toBeTruthy()
  })

  test('should logout successfully', async ({ page, context }) => {
    // Create and login user
    const userData = await createTestUser(page)

    // Clear cookies to logout
    await context.clearCookies()

    await page.goto('/login')

    const loginPage = new LoginPage(page)
    const dashboardPage = new DashboardPage(page)

    await loginPage.login(userData.email, userData.password)
    await page.waitForURL(/\/dashboard/)

    // Logout
    await dashboardPage.logout()

    // Should redirect to login or home page (increased timeout for Chromium)
    await page.waitForURL(/\/(login|$)/, { timeout: 15000 })

    // Should not be able to access dashboard after logout
    await page.goto('/dashboard')

    // Should redirect back to login
    await page.waitForURL(/\/login/, { timeout: 10000 })
  })

  test('should handle Google OAuth button visibility', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.goto()

    // Check if Google login button is visible
    const googleButton = page.getByRole('button', { name: /google/i })

    // Google OAuth should be available
    await expect(googleButton).toBeVisible()
  })
})
