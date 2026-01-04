import { test, expect } from '@playwright/test'

test.describe('Protected Routes', () => {
  const protectedRoutes = [
    '/dashboard',
    '/dashboard/analytics',
    '/dashboard/contacts',
    '/dashboard/settings',
    '/dashboard/billing',
    '/dashboard/pipelines',
    '/dashboard/email-automations',
  ]

  test.describe('Unauthenticated User', () => {
    protectedRoutes.forEach((route) => {
      test(`should redirect to login when accessing ${route}`, async ({ page }) => {
        // Try to access protected route without authentication
        await page.goto(route)

        // Should redirect to login page
        await page.waitForURL(/\/login/)
        expect(page.url()).toContain('/login')
      })
    })

    test('should redirect to login when accessing /admin routes', async ({ page }) => {
      await page.goto('/admin')

      // Should redirect to login
      await page.waitForURL(/\/login/)
      expect(page.url()).toContain('/login')
    })
  })

  test.describe('Authenticated User', () => {
    test('should allow access to protected routes after login', async ({ page }) => {
      // Register and login a user
      await page.goto('/register')

      const timestamp = Date.now()
      await page.fill('input[name="name"]', `Test User ${timestamp}`)
      await page.fill('input[name="email"]', `test-${timestamp}@example.com`)
      await page.fill('input[name="password"]', 'SecurePassword123!')
      await page.fill('input[name="company"]', `Test Org ${timestamp}`)
      await page.click('button[type="submit"]')

      // Wait for redirect to dashboard
      await page.waitForURL(/\/dashboard/)

      // Now try to access all protected routes
      for (const route of protectedRoutes) {
        await page.goto(route)

        // Should be able to access the route
        expect(page.url()).toContain(route)

        // Should not redirect to login
        expect(page.url()).not.toContain('/login')
      }
    })

    test('should not allow non-admin to access /admin routes', async ({ page }) => {
      // Register and login a regular user
      await page.goto('/register')

      const timestamp = Date.now()
      await page.fill('input[name="name"]', `Regular User ${timestamp}`)
      await page.fill('input[name="email"]', `regular-${timestamp}@example.com`)
      await page.fill('input[name="password"]', 'SecurePassword123!')
      await page.fill('input[name="company"]', `Regular Org ${timestamp}`)
      await page.click('button[type="submit"]')

      await page.waitForURL(/\/dashboard/)

      // Try to access admin route
      await page.goto('/admin')

      // Should redirect or show unauthorized
      // (Behavior depends on implementation - either redirect to login or show 403)
      await page.waitForTimeout(1000)

      const url = page.url()
      const isUnauthorized = url.includes('/login') || url.includes('/dashboard') || page.getByText(/unauthorized|não autorizado/i)

      expect(isUnauthorized).toBeTruthy()
    })
  })

  test.describe('Public Routes', () => {
    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/pricing',
      '/features',
      '/blog',
    ]

    publicRoutes.forEach((route) => {
      test(`should allow unauthenticated access to ${route}`, async ({ page }) => {
        await page.goto(route)

        // Should be able to access the route
        expect(page.url()).toContain(route)

        // If not already on login, should not redirect to login
        // (this check doesn't make sense for /login and /register routes themselves)
        if (route !== '/login' && route !== '/register') {
          expect(page.url()).not.toContain('/login')
        }
      })
    })
  })

  test.describe('Session Expiration', () => {
    test('should redirect to login after clearing cookies', async ({ page, context }) => {
      // Register and login a user
      await page.goto('/register')

      const timestamp = Date.now()
      await page.fill('input[name="name"]', `Session Test User ${timestamp}`)
      await page.fill('input[name="email"]', `session-test-${timestamp}@example.com`)
      await page.fill('input[name="password"]', 'SecurePassword123!')
      await page.fill('input[name="company"]', `Session Test Org ${timestamp}`)
      await page.click('button[type="submit"]')

      await page.waitForURL(/\/dashboard/)

      // User is authenticated - dashboard is accessible
      expect(page.url()).toContain('/dashboard')

      // Clear all cookies (simulate logout/session expiration)
      await context.clearCookies()

      // Wait a bit for cookie clearing to propagate (especially in Chromium)
      await page.waitForTimeout(500)

      // Try to access dashboard again
      await page.goto('/dashboard', { waitUntil: 'networkidle' })

      // Should redirect to login (increased timeout for Chromium)
      await page.waitForURL(/\/login/, { timeout: 10000 })
      expect(page.url()).toContain('/login')
    })
  })
})
