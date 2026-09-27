import { test, expect } from '@playwright/test'
import { authenticatedPage } from '../fixtures/auth'

test.describe('Tasks - Project Management', () => {
  test('create a new task project', async ({ page: _page }) => {
    const { page } = await authenticatedPage(_page)
    await page.goto('/dashboard/tasks')

    await page.getByRole('button', { name: 'Novo projeto' }).click()
    const dialog = page.getByRole('dialog', { name: 'Novo projeto' })
    await dialog.getByRole('textbox', { name: /nome/i }).fill('Projeto de Teste')
    await dialog.getByRole('textbox', { name: 'Descrição' }).fill('Descrição de teste')
    await dialog.getByRole('button', { name: 'Criar' }).click()

    await expect(page.getByText('Projeto de Teste', { exact: true }).first()).toBeVisible()
  })

  test('navigate to project workspace', async ({ page: _page }) => {
    const { page, projectId } = await authenticatedPage(_page)
    await page.goto(`/dashboard/tasks/${projectId}`)

    await expect(page.getByRole('button', { name: 'Lista', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Kanban', exact: true })).toBeVisible()
  })

  test('view project details in hub', async ({ page: _page }) => {
    const { page } = await authenticatedPage(_page)
    await page.goto('/dashboard/tasks')

    // The project created by the fixture is listed as a card with its name
    await expect(page.getByRole('link', { name: /^Projeto \d+/ }).first()).toBeVisible()
  })
})
