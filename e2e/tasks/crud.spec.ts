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
    await taskPage.completeTask('Tarefa para completar')

    // A finished task keeps its row with the title struck through
    await expect(page.getByRole('main').getByText('Tarefa para completar', { exact: true })).toHaveClass(/line-through/)
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
    await taskPage.deleteTask(taskTitle)

    // Verify it's gone
    await expect(taskPage.taskButton(taskTitle)).toBeHidden()
  })

  test('open task detail panel', async ({ page: _page }) => {
    const { page, projectId } = await authenticatedPage(_page)
    const taskPage = new TaskPage(page)

    await taskPage.goto(projectId!)

    // Create a task
    await taskPage.createTask('Tarefa para detalhe')

    // Open detail
    await taskPage.openTaskDetail('Tarefa para detalhe')

    // The detail panel is a dialog whose title field holds the task title
    await expect(page.getByRole('dialog').getByPlaceholder('Título da tarefa...')).toHaveValue('Tarefa para detalhe')
  })
})
