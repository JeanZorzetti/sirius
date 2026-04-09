import { test, expect } from '@playwright/test'
import { authenticatedPage } from '../fixtures/auth'

test.describe('Tasks - Project Management', () => {
  test('create a new task project', async ({ page: _page }) => {
    const { page } = await authenticatedPage(_page)

    // Navigate to tasks hub
    await page.goto('/dashboard/tasks')

    // Click "Novo Projeto"
    const newProjectButton = page.locator('button:has-text("Novo Projeto")').first()
    await newProjectButton.click()

    // Fill dialog
    const nameInput = page.locator('input[placeholder*="nome"]')
    await nameInput.fill('Projeto de Teste')

    const descInput = page.locator('textarea')
    await descInput.fill('Descrição de teste')

    // Submit
    const createButton = page.locator('button:has-text("Criar")').last()
    await createButton.click()

    // Verify project appears in hub
    await page.waitForTimeout(500)
    expect(page.locator('text="Projeto de Teste"')).toBeVisible()
  })

  test('navigate to project workspace', async ({ page: _page }) => {
    const { page, projectId } = await authenticatedPage(_page)

    // Should already be in workspace
    await page.goto(`/dashboard/tasks/${projectId}`)

    // Verify workspace elements
    expect(page.locator('button:has-text("Lista")')).toBeVisible()
    expect(page.locator('button:has-text("Kanban")')).toBeVisible()
  })

  test('view project details in hub', async ({ page: _page }) => {
    const { page } = await authenticatedPage(_page)

    // Navigate to tasks hub
    await page.goto('/dashboard/tasks')

    // Verify project cards are visible
    const projectCards = page.locator('[class*="group relative"][class*="rounded-lg"][class*="border"]')
    expect(await projectCards.count()).toBeGreaterThan(0)
  })
})
