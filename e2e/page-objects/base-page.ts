import { Page, Locator } from '@playwright/test'

/**
 * Base Page Object
 * Contains common methods and properties shared across all page objects
 */
export class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string) {
    await this.page.goto(path)
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Get element by test id
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId)
  }

  /**
   * Get element by role
   */
  getByRole(role: 'button' | 'link' | 'heading' | 'textbox' | 'dialog', options?: { name?: string | RegExp }) {
    return this.page.getByRole(role, options)
  }

  /**
   * Get element by text
   */
  getByText(text: string | RegExp): Locator {
    return this.page.getByText(text)
  }

  /**
   * Get element by placeholder
   */
  getByPlaceholder(text: string | RegExp): Locator {
    return this.page.getByPlaceholder(text)
  }

  /**
   * Get element by label
   */
  getByLabel(text: string | RegExp): Locator {
    return this.page.getByLabel(text)
  }

  /**
   * Click on element
   */
  async click(selector: string) {
    await this.page.click(selector)
  }

  /**
   * Fill input field
   */
  async fill(selector: string, value: string) {
    await this.page.fill(selector, value)
  }

  /**
   * Wait for URL to match
   */
  async waitForURL(url: string | RegExp) {
    await this.page.waitForURL(url)
  }

  /**
   * Take a screenshot
   */
  async screenshot(options?: { path?: string; fullPage?: boolean }) {
    return await this.page.screenshot(options)
  }

  /**
   * Get current URL
   */
  url(): string {
    return this.page.url()
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector)
  }

  /**
   * Reload the page
   */
  async reload() {
    await this.page.reload()
  }
}
