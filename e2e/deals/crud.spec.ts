import { test, expect } from '@playwright/test'
import { RegisterPage } from '../page-objects/register-page'
import { KanbanPage } from '../page-objects/kanban-page'

test.describe('Deal CRUD Operations', () => {
  // Helper to create a test user and login
  async function setupUser(page: any) {
    const registerPage = new RegisterPage(page)
    await registerPage.goto()

    const timestamp = Date.now()
    const userData = {
      name: `Deal Test User ${timestamp}`,
      email: `deal-test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      organizationName: `Deal Test Org ${timestamp}`,
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

  test('should create a new deal successfully', async ({ page }) => {
    await setupUser(page)

    const kanbanPage = new KanbanPage(page)

    // Ensure we're on the dashboard
    expect(await kanbanPage.isBoardVisible()).toBeTruthy()

    // Create a new deal
    const dealTitle = `Test Deal ${Date.now()}`
    await kanbanPage.createDeal({
      title: dealTitle,
      value: '1500.00'
    })

    // Verify deal appears on the board
    await page.waitForTimeout(1000) // Wait for optimistic update
    expect(await kanbanPage.hasDeal(dealTitle)).toBeTruthy()
  })

  test('should create a deal with contact', async ({ page }) => {
    await setupUser(page)

    const kanbanPage = new KanbanPage(page)

    const dealTitle = `Deal with Contact ${Date.now()}`
    const contactName = `Contact ${Date.now()}`

    await kanbanPage.createDeal({
      title: dealTitle,
      value: '2500.00',
      contactName: contactName
    })

    // Verify deal appears with contact
    await page.waitForTimeout(1000)
    expect(await kanbanPage.hasDeal(dealTitle)).toBeTruthy()

    // Verify contact name is visible on the card
    const dealCard = kanbanPage.getDealCardByTitle(dealTitle)
    await expect(dealCard).toContainText(contactName)
  })

  test('should edit an existing deal', async ({ page }) => {
    await setupUser(page)

    const kanbanPage = new KanbanPage(page)

    // Create a deal first
    const originalTitle = `Original Deal ${Date.now()}`
    await kanbanPage.createDeal({
      title: originalTitle,
      value: '1000.00'
    })

    await page.waitForTimeout(1000)

    // Edit the deal
    const newTitle = `Updated Deal ${Date.now()}`
    await kanbanPage.editDeal(originalTitle, {
      title: newTitle,
      value: '3000.00'
    })

    await page.waitForTimeout(1000)

    // Verify old title is gone and new title exists
    expect(await kanbanPage.hasDeal(originalTitle)).toBeFalsy()
    expect(await kanbanPage.hasDeal(newTitle)).toBeTruthy()

    // Verify new value is displayed
    const dealCard = kanbanPage.getDealCardByTitle(newTitle)
    await expect(dealCard).toContainText('3000')
  })

  test('should delete a deal', async ({ page }) => {
    await setupUser(page)

    const kanbanPage = new KanbanPage(page)

    // Create a deal first
    const dealTitle = `Deal to Delete ${Date.now()}`
    await kanbanPage.createDeal({
      title: dealTitle,
      value: '500.00'
    })

    await page.waitForTimeout(1000)

    // Verify deal exists
    expect(await kanbanPage.hasDeal(dealTitle)).toBeTruthy()

    // Delete the deal
    await kanbanPage.deleteDeal(dealTitle)

    await page.waitForTimeout(1000)

    // Verify deal is gone
    expect(await kanbanPage.hasDeal(dealTitle)).toBeFalsy()
  })

  test('should display deal value correctly', async ({ page }) => {
    await setupUser(page)

    const kanbanPage = new KanbanPage(page)

    const dealTitle = `Value Test Deal ${Date.now()}`
    const value = '12345.67'

    await kanbanPage.createDeal({
      title: dealTitle,
      value: value
    })

    await page.waitForTimeout(1000)

    // Verify deal card shows value
    const dealCard = kanbanPage.getDealCardByTitle(dealTitle)
    await expect(dealCard).toContainText('R$')
    await expect(dealCard).toContainText('12345')
  })

  test('should show empty state when no deals exist', async ({ page }) => {
    await setupUser(page)

    const kanbanPage = new KanbanPage(page)

    // Verify board is visible but empty
    expect(await kanbanPage.isBoardVisible()).toBeTruthy()

    // Total deal count should be 0
    const dealCount = await kanbanPage.getTotalDealCount()
    expect(dealCount).toBe(0)
  })

  test('should create multiple deals', async ({ page }) => {
    await setupUser(page)

    const kanbanPage = new KanbanPage(page)

    // Create 3 deals
    const deals = [
      { title: `Deal 1 ${Date.now()}`, value: '1000' },
      { title: `Deal 2 ${Date.now() + 1}`, value: '2000' },
      { title: `Deal 3 ${Date.now() + 2}`, value: '3000' }
    ]

    for (const deal of deals) {
      await kanbanPage.createDeal(deal)
      await page.waitForTimeout(500)
    }

    await page.waitForTimeout(1000)

    // Verify all deals exist
    for (const deal of deals) {
      expect(await kanbanPage.hasDeal(deal.title)).toBeTruthy()
    }

    // Verify total count
    const dealCount = await kanbanPage.getTotalDealCount()
    expect(dealCount).toBe(3)
  })

  test('should handle deal creation with empty value', async ({ page }) => {
    await setupUser(page)

    const kanbanPage = new KanbanPage(page)

    const dealTitle = `No Value Deal ${Date.now()}`

    await kanbanPage.createDeal({
      title: dealTitle
      // No value provided
    })

    await page.waitForTimeout(1000)

    // Verify deal exists
    expect(await kanbanPage.hasDeal(dealTitle)).toBeTruthy()

    // Verify it shows "-" or empty value indicator
    const dealCard = kanbanPage.getDealCardByTitle(dealTitle)
    await expect(dealCard).toContainText(/-|0|Valor/)
  })
})
