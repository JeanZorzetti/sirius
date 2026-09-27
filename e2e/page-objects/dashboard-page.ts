import { Page, expect } from '@playwright/test'
import { BasePage } from './base-page'

/**
 * Dashboard Page Object
 * Represents the main dashboard page and its interactions
 */
export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await this.page.goto('/dashboard')
  }

  /**
   * Check if user is on dashboard page
   */
  async isOnDashboard() {
    return this.page.url().includes('/dashboard')
  }

  /**
   * Get user menu button (avatar/profile dropdown)
   */
  getUserMenuButton() {
    // The account block at the bottom of the sidebar: a button with the user's avatar
    return this.page.locator('button:has([data-slot="avatar"]):visible').first()
  }

  /**
   * A new account sees the welcome dialog on its first dashboard visit, over the whole screen. Closing it records
   * "skipped" on the server, so it does not come back.
   */
  async dismissWelcome() {
    const welcome = this.page.getByRole('dialog', { name: /bem-vindo/i })
    await welcome.waitFor({ timeout: 5000 }).then(() => this.page.keyboard.press('Escape'), () => {})
    await welcome.waitFor({ state: 'hidden' })
  }

  /** Open the account block at the bottom of the sidebar */
  async openUserMenu() {
    // The sidebar opens on hover, and only an open sidebar expands the account block
    await this.dismissWelcome()
    const userMenu = this.getUserMenuButton()
    const sair = this.page.getByRole('button', { name: /^sair$/i })
    await expect(async () => {
      await userMenu.hover()
      if (!(await sair.isVisible())) await userMenu.click()
      await expect(sair).toBeVisible({ timeout: 2000 })
    }).toPass({ timeout: 20000 })
  }

  /**
   * Click logout button in user menu
   */
  async logout() {
    await this.openUserMenu()

    // Wait for menu to open and click logout
    const logoutButton = this.page.getByRole('button', { name: /^sair$/i })
    await logoutButton.click()
  }

  /**
   * Get kanban board element
   */
  getKanbanBoard() {
    return this.page.locator('[data-testid="kanban-board"], .kanban-board').first()
  }

  /**
   * Check if kanban board is visible
   */
  async isKanbanBoardVisible() {
    const kanbanBoard = this.page.locator('.grid, [data-testid="kanban-board"]').first()
    return await kanbanBoard.isVisible()
  }

  /**
   * Get pipeline selector
   */
  getPipelineSelector() {
    return this.page.locator('button:has-text("Pipeline"), [data-testid="pipeline-selector"]').first()
  }

  /**
   * Get navigation links
   */
  getNavigationLink(name: string) {
    return this.page.getByRole('link', { name: new RegExp(name, 'i') })
  }

  /**
   * Navigate to a specific section
   */
  async navigateTo(section: 'analytics' | 'contacts' | 'settings' | 'billing' | 'pipelines') {
    const link = this.getNavigationLink(section)
    await link.click()
    await this.page.waitForURL(`/dashboard/${section}`)
  }
}
