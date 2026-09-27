import { test, expect } from '@playwright/test'
import { TaskPage } from '../page-objects/task-page'
import { authenticatedPage } from '../fixtures/auth'

test.describe('Tasks - View Switching', () => {
  test('list view renders correctly', async ({ page: _page }) => {
    const { page, projectId } = await authenticatedPage(_page)
    const taskPage = new TaskPage(page)
    await taskPage.goto(projectId!)

    // A new project starts with the three default statuses
    for (const status of ['A Fazer', 'Em Progresso', 'Concluído']) {
      await expect(page.getByRole('main').getByText(status, { exact: true }).first()).toBeVisible()
    }
  })

  test('the Pro trial opens the kanban, calendar and table views', async ({ page: _page }) => {
    const { page, projectId } = await authenticatedPage(_page)
    const taskPage = new TaskPage(page)
    await taskPage.goto(projectId!)

    for (const view of ['kanban', 'calendar', 'table'] as const) {
      await expect(taskPage.viewButton(view)).toBeEnabled()
    }
  })

  test('switch between views', async ({ page: _page }) => {
    const { page, projectId } = await authenticatedPage(_page)
    const taskPage = new TaskPage(page)
    await taskPage.goto(projectId!)

    await taskPage.switchView('calendar')
    await expect(page.getByRole('button', { name: /^hoje$/i }).first()).toBeVisible()
    await taskPage.switchView('table')
    await expect(page.getByRole('main').getByRole('table')).toBeVisible()
    await taskPage.switchView('list')
    await expect(page.getByRole('main').getByText('A Fazer', { exact: true }).first()).toBeVisible()
  })
})
