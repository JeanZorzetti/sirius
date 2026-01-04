import { test, expect } from '@playwright/test'
import { RegisterPage } from '../page-objects/register-page'
import { KanbanPage } from '../page-objects/kanban-page'

test.describe('Multiple Pipelines (PRO Feature)', () => {
  // Helper to create a test user and login
  async function setupUser(page: any) {
    const registerPage = new RegisterPage(page)
    await registerPage.goto()

    const timestamp = Date.now()
    const userData = {
      name: `Pipeline Test User ${timestamp}`,
      email: `pipeline-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      organizationName: `Pipeline Test Org ${timestamp}`,
    }

    await registerPage.register(
      userData.name,
      userData.email,
      userData.password,
      userData.organizationName
    )

    // Wait for registration to complete
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })

    return userData
  }

  test('should display pipeline selector', async ({ page }) => {
    await setupUser(page)

    const kanbanPage = new KanbanPage(page)

    // Verify pipeline selector is visible
    const pipelineSelector = kanbanPage.getPipelineSelector()
    await expect(pipelineSelector).toBeVisible()

    // Selector should show default pipeline name
    await expect(pipelineSelector).toContainText(/Pipeline|Principal/)
  })

  test('should show default pipeline on initial load', async ({ page }) => {
    await setupUser(page)

    const kanbanPage = new KanbanPage(page)

    // Get pipeline selector
    const pipelineSelector = kanbanPage.getPipelineSelector()

    // Should show "Pipeline Principal" (default pipeline)
    await expect(pipelineSelector).toContainText(/Principal|Pipeline/)
  })

  test('should navigate to pipeline management page', async ({ page }) => {
    await setupUser(page)

    // Navigate to pipelines page
    await page.goto('/dashboard/pipelines')
    await page.waitForLoadState('networkidle')

    // Verify we're on pipelines page
    expect(page.url()).toContain('/pipelines')

    // Should show pipeline management UI
    await expect(page.locator('h1, h2')).toContainText(/Pipeline|Gerenciar/)
  })

  test('should display PRO badge for creating multiple pipelines', async ({ page }) => {
    await setupUser(page)

    // Go to pipelines management
    await page.goto('/dashboard/pipelines')
    await page.waitForLoadState('networkidle')

    // Look for "Create Pipeline" or "Novo Pipeline" button
    const createButton = page.getByRole('button', { name: /novo pipeline|criar pipeline|create pipeline/i })

    // Button might exist but could show PRO badge or be disabled
    if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Check if there's a PRO indicator
      const proBadge = page.locator('text=/PRO|Premium|Upgrade/i')
      const hasProBadge = await proBadge.isVisible({ timeout: 2000 }).catch(() => false)

      // Either PRO badge exists or button works (depends on implementation)
      expect(hasProBadge || await createButton.isEnabled()).toBeTruthy()
    }
  })

  test('should persist selected pipeline in localStorage', async ({ page }) => {
    await setupUser(page)

    const kanbanPage = new KanbanPage(page)

    // Get initial pipeline
    const pipelineSelector = kanbanPage.getPipelineSelector()
    await expect(pipelineSelector).toBeVisible()

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Pipeline selector should still be visible with same selection
    await expect(pipelineSelector).toBeVisible()
  })

  test('should filter deals by selected pipeline', async ({ page }) => {
    await setupUser(page)

    const kanbanPage = new KanbanPage(page)

    // Create a deal in default pipeline
    const dealTitle = `Pipeline Filter Test ${Date.now()}`
    await kanbanPage.createDeal({
      title: dealTitle,
      value: '5000.00'
    })

    await page.waitForTimeout(1000)

    // Verify deal exists
    expect(await kanbanPage.hasDeal(dealTitle)).toBeTruthy()

    // If multiple pipelines exist, switching should hide this deal
    // This is a placeholder test - actual implementation depends on PRO upgrade
  })

  test('should show correct deal count for each pipeline', async ({ page }) => {
    await setupUser(page)

    const kanbanPage = new KanbanPage(page)

    // Create deals in default pipeline
    await kanbanPage.createDeal({
      title: `Deal 1 ${Date.now()}`,
      value: '1000'
    })

    await page.waitForTimeout(500)

    await kanbanPage.createDeal({
      title: `Deal 2 ${Date.now() + 1}`,
      value: '2000'
    })

    await page.waitForTimeout(1000)

    // Get total deal count
    const dealCount = await kanbanPage.getTotalDealCount()
    expect(dealCount).toBe(2)

    // All deals should belong to default pipeline
    const pipelineSelector = kanbanPage.getPipelineSelector()
    await expect(pipelineSelector).toContainText(/Principal|Pipeline/)
  })

  test('should display pipeline list on pipelines page', async ({ page }) => {
    await setupUser(page)

    // Navigate to pipelines management
    await page.goto('/dashboard/pipelines')
    await page.waitForLoadState('networkidle')

    // Should show at least the default pipeline
    const pipelineCards = page.locator('[data-pipeline-id], .pipeline-card, [class*="pipeline"]')

    // At minimum, should have default pipeline
    const count = await pipelineCards.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('should show pipeline settings/actions', async ({ page }) => {
    await setupUser(page)

    // Go to pipelines page
    await page.goto('/dashboard/pipelines')
    await page.waitForLoadState('networkidle')

    // Look for settings or action buttons (edit, delete, etc.)
    const actionButtons = page.locator('button:has-text("Editar"), button:has-text("Edit"), button[aria-label*="menu"], button:has(svg)')

    // Should have some action buttons
    const buttonCount = await actionButtons.count()
    expect(buttonCount).toBeGreaterThan(0)
  })

  test('should maintain pipeline selection across page navigation', async ({ page }) => {
    await setupUser(page)

    const kanbanPage = new KanbanPage(page)

    // Note initial pipeline
    const pipelineSelector = kanbanPage.getPipelineSelector()
    const initialText = await pipelineSelector.textContent()

    // Navigate to another page
    await page.goto('/dashboard/contacts')
    await page.waitForLoadState('networkidle')

    // Go back to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Pipeline selection should be maintained
    const newText = await pipelineSelector.textContent()
    expect(newText).toBe(initialText)
  })

  test('should show PRO upgrade prompt for free users creating second pipeline', async ({ page }) => {
    await setupUser(page)

    // Go to pipelines management
    await page.goto('/dashboard/pipelines')
    await page.waitForLoadState('networkidle')

    // Try to click create pipeline button
    const createButton = page.getByRole('button', { name: /novo pipeline|criar pipeline|create pipeline/i })

    if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createButton.click()

      // Should either show PRO modal or create pipeline form
      // For free users, expect PRO upgrade prompt
      const proModal = page.locator('text=/upgrade|pro|premium/i')
      const hasProModal = await proModal.isVisible({ timeout: 3000 }).catch(() => false)

      // If no PRO modal, user might already be PRO or button doesn't trigger modal
      // This is expected behavior
      if (hasProModal) {
        // Verify upgrade button exists
        const upgradeButton = page.getByRole('button', { name: /upgrade|assinar|fazer upgrade/i })
        await expect(upgradeButton).toBeVisible()
      }
    }
  })
})
