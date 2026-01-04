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
  }

  /**
   * Fill email field
   */
  async fillEmail(email: string) {
    await this.page.fill('input[name="email"]', email)
  }

  /**
   * Fill password field
   */
  async fillPassword(password: string) {
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
    // Wait for error message to appear
    const errorLocator = this.page.locator('[role="alert"], .text-red-500, .text-destructive')

    if (await errorLocator.count() > 0) {
      return await errorLocator.first().textContent()
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
