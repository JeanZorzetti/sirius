import { Page } from '@playwright/test'
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
    // The user menu is a button with a rounded avatar inside
    return this.page.locator('button.rounded-full, button:has(div[class*="avatar"]), [data-testid="user-menu"]').first()
  }

  /**
   * Click user menu to open dropdown
   */
  async openUserMenu() {
    const userMenu = this.getUserMenuButton()
    await userMenu.click()
  }

  /**
   * Click logout button in user menu
   */
  async logout() {
    await this.openUserMenu()

    // Wait for menu to open and click logout
    const logoutButton = this.page.getByRole('menuitem', { name: /sair|logout/i })
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
