import { Page, expect } from '@playwright/test'
import { BasePage } from './base-page'

/**
 * Task project workspace (/dashboard/tasks/[projectId]), found by roles and accessible names. In the list view each
 * task is a row with a checkbox and a button named after the task title; that button opens the detail panel.
 */
export class TaskPage extends BasePage {
  readonly page: Page

  constructor(page: Page) {
    super(page)
    this.page = page
  }

  async goto(projectId: string) {
    await this.page.goto(`/dashboard/tasks/${projectId}`)
    await expect(this.page.getByRole('button', { name: /nova tarefa/i })).toBeVisible()
  }

  /** "Nova tarefa" opens a dialog; the task shows up in the list once the server saves it */
  async createTask(title: string) {
    await this.page.getByRole('button', { name: /nova tarefa/i }).click()
    const dialog = this.page.getByRole('dialog')
    await dialog.locator('#title').fill(title)
    await dialog.locator('button[type="submit"]').click()
    await expect(this.taskButton(title)).toBeVisible()
  }

  /** The button that carries the task title in the list */
  taskButton(title: string) {
    return this.page.getByRole('main').getByRole('button', { name: title, exact: true })
  }

  async getTaskCount(): Promise<number> {
    return this.page.getByRole('main').getByRole('checkbox').count()
  }

  async switchView(view: 'list' | 'kanban' | 'calendar' | 'table') {
    const labels = { list: 'Lista', kanban: 'Kanban', calendar: 'Calendário', table: 'Tabela' }
    await this.page.getByRole('button', { name: labels[view], exact: true }).click()
  }

  viewButton(view: 'list' | 'kanban' | 'calendar' | 'table') {
    const labels = { list: 'Lista', kanban: 'Kanban', calendar: 'Calendário', table: 'Tabela' }
    return this.page.getByRole('button', { name: labels[view], exact: true })
  }

  /** The row's checkbox marks the task done; its title then gets a strike-through */
  async completeTask(title: string) {
    const row = this.page.getByRole('main').locator('div').filter({ has: this.taskButton(title) }).last()
    await row.getByRole('checkbox').click()
  }

  async openTaskDetail(title: string) {
    await this.taskButton(title).click()
    await expect(this.page.getByRole('dialog')).toBeVisible()
  }

  /** Delete lives in the detail panel and asks for a native confirm() */
  async deleteTask(title: string) {
    await this.openTaskDetail(title)
    this.page.once('dialog', d => d.accept())
    await this.page.getByRole('dialog').getByRole('button', { name: /excluir/i }).click()
  }

  async verifyTaskExists(title: string): Promise<boolean> {
    return this.taskButton(title).isVisible()
  }
}
