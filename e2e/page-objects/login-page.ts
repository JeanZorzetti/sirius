import { Page } from '@playwright/test'
import { BasePage } from './base-page'

/**
 * Login Page Object
 * Represents the login page and its interactions
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/login')
    // Wait for page to be fully loaded (especially important for WebKit)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Fill email field
   */
  async fillEmail(email: string) {
    // Wait for input to be visible and ready (especially important for WebKit)
    await this.page.waitForSelector('input[name="email"]', { state: 'visible' })
    await this.page.fill('input[name="email"]', email)
  }

  /**
   * Fill password field
   */
  async fillPassword(password: string) {
    // Wait for input to be visible and ready (especially important for WebKit)
    await this.page.waitForSelector('input[name="password"]', { state: 'visible' })
    await this.page.fill('input[name="password"]', password)
  }

  /**
   * Click login button
   */
  async clickLoginButton() {
    await this.page.click('button[type="submit"]')
  }

  /**
   * Perform complete login flow
   */
  async login(email: string, password: string) {
    await this.fillEmail(email)
    await this.fillPassword(password)
    await this.clickLoginButton()
  }

  /**
   * Get error message (if any)
   */
  async getErrorMessage() {
    // Wait a bit for error message to appear
    await this.page.waitForTimeout(1000)

    // Try multiple selectors for error messages
    const errorSelectors = [
      '[role="alert"]',
      '.text-red-500',
      '.text-destructive',
      '.error-message',
      'p:has-text("inválid")',
      'p:has-text("incorret")',
      'p:has-text("erro")',
      'div:has-text("inválid")',
      'div:has-text("incorret")',
    ]

    for (const selector of errorSelectors) {
      const errorLocator = this.page.locator(selector)
      if (await errorLocator.count() > 0) {
        const text = await errorLocator.first().textContent()
        if (text && text.trim().length > 0) {
          return text
        }
      }
    }

    return null
  }

  /**
   * Check if redirected to dashboard after successful login
   */
  async isRedirectedToDashboard() {
    await this.page.waitForURL(/\/dashboard/, { timeout: 10000 })
    return this.page.url().includes('/dashboard')
  }

  /**
   * Get "Criar conta" link
   */
  getCreateAccountLink() {
    return this.page.getByRole('link', { name: /criar conta|registrar|sign up/i })
  }

  /**
   * Get "Esqueci minha senha" link
   */
  getForgotPasswordLink() {
    return this.page.getByRole('link', { name: /esqueci|forgot password/i })
  }
}
