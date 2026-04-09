import { Page, expect } from '@playwright/test'
import { BasePage } from './base-page'

export class TaskPage extends BasePage {
  readonly page: Page

  constructor(page: Page) {
    super(page)
    this.page = page
  }

  async goto(projectId: string) {
    await this.page.goto(`/dashboard/tasks/${projectId}`)
    // Wait for workspace to load
    await this.page.waitForSelector('div:has-text("Lista")', { timeout: 5000 })
  }

  async createTask(title: string) {
    // Look for "Adicionar tarefa" button
    const addButton = this.page.locator('button:has-text("Adicionar tarefa")').first()
    await addButton.click()

    // Fill dialog
    const titleInput = this.page.locator('input[placeholder*="título"]').first()
    await titleInput.fill(title)

    // Submit dialog
    const submitButton = this.page.locator('button:has-text("Criar")').first()
    await submitButton.click()

    // Wait for task to appear
    await this.page.waitForTimeout(500)
  }

  async getTaskCount(): Promise<number> {
    // Count task rows (depends on active view)
    const taskCards = this.page.locator('[class*="group relative"][class*="rounded"]').count()
    return taskCards
  }

  async switchView(view: 'list' | 'kanban' | 'calendar' | 'table') {
    const labels: Record<string, string> = {
      list: 'Lista',
      kanban: 'Kanban',
      calendar: 'Calendário',
      table: 'Tabela',
    }
    const button = this.page.locator(`button:has-text("${labels[view]}")`)
    await button.click()
    // Wait for view to transition
    await this.page.waitForTimeout(300)
  }

  async isListViewVisible(): Promise<boolean> {
    // Check for list-specific elements: groups with collapsed state
    return this.page.locator('div:has-text("Aberto")').first().isVisible()
  }

  async isKanbanViewVisible(): Promise<boolean> {
    // Check for kanban-specific columns with scrollable container
    const columns = this.page.locator('[class*="w-80"][class*="flex-shrink"]')
    return (await columns.count()) > 0
  }

  async isCalendarViewVisible(): Promise<boolean> {
    // Check for calendar grid (7 columns)
    const weekdays = this.page.locator('div:has-text("Dom")')
    return weekdays.isVisible()
  }

  async isTableViewVisible(): Promise<boolean> {
    // Check for table structure
    return this.page.locator('table').first().isVisible()
  }

  async completeTask(taskIndex: number = 0) {
    const checkbox = this.page.locator('input[type="checkbox"]').nth(taskIndex + 1) // +1 to skip header checkbox
    await checkbox.click()
    // Wait for update
    await this.page.waitForTimeout(300)
  }

  async deleteTask(taskIndex: number = 0) {
    // Open task menu (last cell with dropdown)
    const moreButton = this.page.locator('button[aria-label*="Mais"]').nth(taskIndex)
    await moreButton.click()

    // Click Delete
    await this.page.locator('text=Excluir').click()

    // Confirm if needed
    const confirmButton = this.page.locator('button:has-text("Excluir")').nth(1)
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
    }

    // Wait for deletion
    await this.page.waitForTimeout(300)
  }

  async verifyTaskExists(title: string): Promise<boolean> {
    return this.page.locator(`text="${title}"`).first().isVisible()
  }

  async openTaskDetail(taskIndex: number = 0) {
    // Click on task title to open detail
    const taskTitle = this.page.locator('[class*="truncate text-sm text-foreground"]').nth(taskIndex)
    await taskTitle.click()
    // Wait for detail panel to open
    await this.page.waitForSelector('[class*="Sheet"]', { timeout: 3000 })
  }
}
