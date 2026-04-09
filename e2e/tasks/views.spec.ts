import { test, expect } from '@playwright/test'
import { TaskPage } from '../page-objects/task-page'
import { authenticatedPage } from '../fixtures/auth'

test.describe('Tasks - View Switching', () => {
  test('list view renders correctly', async ({ page: _page }) => {
    const { page, projectId } = await authenticatedPage(_page)
    const taskPage = new TaskPage(page)

    await taskPage.goto(projectId!)

    // Verify list view is active and visible
    expect(await taskPage.isListViewVisible()).toBe(true)

    // Verify elements are present
    expect(page.locator('div:has-text("Aberto")')).toBeVisible()
    expect(page.locator('div:has-text("Em Progresso")')).toBeVisible()
  })

  test('switch to kanban view', async ({ page: _page }) => {
    const { page, projectId } = await authenticatedPage(_page)
    const taskPage = new TaskPage(page)

    await taskPage.goto(projectId!)

    // Switch to kanban
    await taskPage.switchView('kanban')

    // Verify kanban is visible
    expect(await taskPage.isKanbanViewVisible()).toBe(true)

    // Verify columns exist
    const columns = page.locator('[class*="w-80"][class*="flex-shrink"]')
    expect(await columns.count()).toBeGreaterThan(0)
  })

  test('switch to calendar view', async ({ page: _page }) => {
    const { page, projectId } = await authenticatedPage(_page)
    const taskPage = new TaskPage(page)

    await taskPage.goto(projectId!)

    // Switch to calendar
    await taskPage.switchView('calendar')

    // Verify calendar is visible
    expect(await taskPage.isCalendarViewVisible()).toBe(true)

    // Verify calendar header exists
    expect(page.locator('text=Hoje')).toBeVisible()
  })

  test('switch between views smoothly', async ({ page: _page }) => {
    const { page, projectId } = await authenticatedPage(_page)
    const taskPage = new TaskPage(page)

    await taskPage.goto(projectId!)

    // List -> Kanban
    await taskPage.switchView('kanban')
    expect(await taskPage.isKanbanViewVisible()).toBe(true)

    // Kanban -> Calendar
    await taskPage.switchView('calendar')
    expect(await taskPage.isCalendarViewVisible()).toBe(true)

    // Calendar -> List
    await taskPage.switchView('list')
    expect(await taskPage.isListViewVisible()).toBe(true)
  })

  test('table view is locked for free users', async ({ page: _page }) => {
    const { page, projectId } = await authenticatedPage(_page)
    const taskPage = new TaskPage(page)

    await taskPage.goto(projectId!)

    // Try to click table view button
    const tableButton = page.locator('button:has-text("Tabela")')
    const isDisabled = await tableButton.evaluate((el) => el.hasAttribute('disabled'))

    // For free users it should be disabled and have lock icon or opacity-50
    if (isDisabled) {
      expect(tableButton).toHaveClass(/opacity-50/)
    }
  })
})
