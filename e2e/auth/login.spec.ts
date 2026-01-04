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

    // Wait for registration to complete
    await page.waitForURL(/\/dashboard/)

    return userData
  }

  test('should successfully login with valid credentials', async ({ page }) => {
    // First, create a user
    const userData = await createTestUser(page)

    // Logout (navigate to login)
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

    // Should show error message
    const errorMessage = await loginPage.getErrorMessage()
    expect(errorMessage).toBeTruthy()

    // Should remain on login page
    expect(page.url()).toContain('/login')
  })

  test('should show error for wrong password', async ({ page }) => {
    // First, create a user
    const userData = await createTestUser(page)

    // Navigate to login
    await page.goto('/login')

    const loginPage = new LoginPage(page)

    // Try to login with wrong password
    await loginPage.login(userData.email, 'WrongPassword123!')

    // Should show error message
    const errorMessage = await loginPage.getErrorMessage()
    expect(errorMessage).toBeTruthy()

    // Should remain on login page
    expect(page.url()).toContain('/login')
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

  test('should persist session after page reload', async ({ page }) => {
    // Create and login user
    const userData = await createTestUser(page)
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

  test('should logout successfully', async ({ page }) => {
    // Create and login user
    const userData = await createTestUser(page)
    await page.goto('/login')

    const loginPage = new LoginPage(page)
    const dashboardPage = new DashboardPage(page)

    await loginPage.login(userData.email, userData.password)
    await page.waitForURL(/\/dashboard/)

    // Logout
    await dashboardPage.logout()

    // Should redirect to login or home page
    await page.waitForURL(/\/(login|$)/)

    // Should not be able to access dashboard after logout
    await page.goto('/dashboard')

    // Should redirect back to login
    await page.waitForURL(/\/login/)
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
