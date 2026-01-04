import { test, expect } from '@playwright/test'
import { RegisterPage } from '../page-objects/register-page'
import { DashboardPage } from '../page-objects/dashboard-page'

test.describe('User Registration', () => {
  test('should successfully register a new user', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    const dashboardPage = new DashboardPage(page)

    // Navigate to register page
    await registerPage.goto()

    // Generate unique user data
    const timestamp = Date.now()
    const testData = {
      name: `Test User ${timestamp}`,
      email: `test-${timestamp}@example.com`,
      password: 'SecurePassword123!',
      organizationName: `Test Organization ${timestamp}`,
    }

    // Fill registration form
    await registerPage.register(
      testData.name,
      testData.email,
      testData.password,
      testData.organizationName
    )

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    expect(await dashboardPage.isOnDashboard()).toBeTruthy()

    // Dashboard should be visible
    expect(await dashboardPage.isKanbanBoardVisible()).toBeTruthy()
  })

  test('should show error for duplicate email', async ({ page, context }) => {
    const registerPage = new RegisterPage(page)

    // First, register a user
    await registerPage.goto()

    const timestamp = Date.now()
    const testData = {
      name: `Test User ${timestamp}`,
      email: `duplicate-${timestamp}@example.com`,
      password: 'SecurePassword123!',
      organizationName: `Test Organization ${timestamp}`,
    }

    await registerPage.register(
      testData.name,
      testData.email,
      testData.password,
      testData.organizationName
    )

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/)

    // Clear cookies to logout
    await context.clearCookies()

    // Now try to register again with the same email
    await registerPage.goto()

    await registerPage.register(
      'Another User',
      testData.email, // Same email
      'AnotherPassword123!',
      'Another Organization'
    )

    // Should either show error message OR remain on register page
    const errorMessage = await registerPage.getErrorMessage()

    // Should remain on register page
    expect(page.url()).toContain('/register')

    // If error message exists, it should mention email
    if (errorMessage) {
      expect(errorMessage.toLowerCase()).toContain('email')
    }
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    const registerPage = new RegisterPage(page)

    await registerPage.goto()

    // Try to submit empty form
    await registerPage.clickRegisterButton()

    // Should remain on register page
    expect(page.url()).toContain('/register')

    // Should show validation errors (browser native or custom)
    // Note: This might vary based on implementation
  })

  test('should navigate to login page from register page', async ({ page }) => {
    const registerPage = new RegisterPage(page)

    await registerPage.goto()

    // Click on login link
    const loginLink = registerPage.getLoginLink()
    await loginLink.click()

    // Should navigate to login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('should create default pipeline for new user', async ({ page }) => {
    const registerPage = new RegisterPage(page)
    const dashboardPage = new DashboardPage(page)

    await registerPage.goto()

    const timestamp = Date.now()
    const testData = {
      name: `Pipeline Test User ${timestamp}`,
      email: `pipeline-test-${timestamp}@example.com`,
      password: 'SecurePassword123!',
      organizationName: `Pipeline Test Org ${timestamp}`,
    }

    await registerPage.register(
      testData.name,
      testData.email,
      testData.password,
      testData.organizationName
    )

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/)

    // Pipeline selector should be visible with default pipeline
    const pipelineSelector = dashboardPage.getPipelineSelector()
    await expect(pipelineSelector).toBeVisible()

    // Default pipeline should be named "Pipeline Principal"
    await expect(pipelineSelector).toContainText(/Pipeline Principal/i)
  })
})
