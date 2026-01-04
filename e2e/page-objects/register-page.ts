import { Page } from '@playwright/test'
import { BasePage } from './base-page'

/**
 * Register Page Object
 * Represents the registration page and its interactions
 */
export class RegisterPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to register page
   */
  async goto() {
    await this.page.goto('/register')
  }

  /**
   * Fill name field
   */
  async fillName(name: string) {
    await this.page.fill('input[name="name"]', name)
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
   * Fill organization name field
   */
  async fillOrganizationName(organizationName: string) {
    await this.page.fill('input[name="organizationName"]', organizationName)
  }

  /**
   * Click register button
   */
  async clickRegisterButton() {
    await this.page.click('button[type="submit"]')
  }

  /**
   * Perform complete registration flow
   */
  async register(
    name: string,
    email: string,
    password: string,
    organizationName: string
  ) {
    await this.fillName(name)
    await this.fillEmail(email)
    await this.fillPassword(password)
    await this.fillOrganizationName(organizationName)
    await this.clickRegisterButton()
  }

  /**
   * Get error message (if any)
   */
  async getErrorMessage() {
    const errorLocator = this.page.locator('[role="alert"], .text-red-500, .text-destructive')

    if (await errorLocator.count() > 0) {
      return await errorLocator.first().textContent()
    }

    return null
  }

  /**
   * Check if redirected to dashboard after successful registration
   */
  async isRedirectedToDashboard() {
    await this.page.waitForURL(/\/dashboard/, { timeout: 10000 })
    return this.page.url().includes('/dashboard')
  }

  /**
   * Get "Já tem conta? Fazer login" link
   */
  getLoginLink() {
    return this.page.getByRole('link', { name: /login|entrar|sign in/i })
  }

  /**
   * Check if specific field has validation error
   */
  async hasFieldError(fieldName: string) {
    const fieldError = this.page.locator(`input[name="${fieldName}"] + .text-red-500, input[name="${fieldName}"] ~ .text-red-500`)
    return await fieldError.count() > 0
  }
}
