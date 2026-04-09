import { test, expect } from '@playwright/test'
import { TaskPage } from '../page-objects/task-page'
import { authenticatedPage } from '../fixtures/auth'

test.describe('Tasks - CRUD Operations', () => {
  test('create a task and verify it appears in list view', async ({ page: _page }) => {
    const { page, projectId } = await authenticatedPage(_page)
    const taskPage = new TaskPage(page)

    // Navigate to project workspace
    await taskPage.goto(projectId!)

    // Get initial count
    const initialCount = await taskPage.getTaskCount()

    // Create a task
    await taskPage.createTask('Nova tarefa de teste')

    // Verify task appears
    const newCount = await taskPage.getTaskCount()
    expect(newCount).toBeGreaterThan(initialCount)
    expect(await taskPage.verifyTaskExists('Nova tarefa de teste')).toBe(true)
  })

  test('complete a task via checkbox', async ({ page: _page }) => {
    const { page, projectId } = await authenticatedPage(_page)
    const taskPage = new TaskPage(page)

    await taskPage.goto(projectId!)

    // Create a task to complete
    await taskPage.createTask('Tarefa para completar')

    // Complete the task
    await taskPage.completeTask(0)

    // Verify it's marked as completed (opacity-50 or strikethrough)
    const completedTask = page.locator('text="Tarefa para completar"')
    const classList = await completedTask.evaluate((el) => el.className)
    expect(classList).toContain('line-through')
  })

  test('delete a task and verify removal', async ({ page: _page }) => {
    const { page, projectId } = await authenticatedPage(_page)
    const taskPage = new TaskPage(page)

    await taskPage.goto(projectId!)

    // Create a task to delete
    const taskTitle = `Tarefa para deletar - ${Date.now()}`
    await taskPage.createTask(taskTitle)

    // Verify it exists
    expect(await taskPage.verifyTaskExists(taskTitle)).toBe(true)

    // Delete the task
    await taskPage.deleteTask(0)

    // Verify it's gone
    await page.waitForTimeout(500)
    expect(await taskPage.verifyTaskExists(taskTitle)).toBe(false)
  })

  test('open task detail panel', async ({ page: _page }) => {
    const { page, projectId } = await authenticatedPage(_page)
    const taskPage = new TaskPage(page)

    await taskPage.goto(projectId!)

    // Create a task
    await taskPage.createTask('Tarefa para detalhe')

    // Open detail
    await taskPage.openTaskDetail(0)

    // Verify detail panel is visible
    const detailPanel = page.locator('[class*="Sheet"]')
    expect(detailPanel).toBeVisible()
  })
})
