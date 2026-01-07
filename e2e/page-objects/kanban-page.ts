import { Page } from '@playwright/test'
import { BasePage } from './base-page'

/**
 * Kanban Board Page Object
 * Represents the Kanban board and its interactions
 */
export class KanbanPage extends BasePage {
  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to dashboard (Kanban view)
   */
  async goto() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
    // Wait for the "Novo Deal" button to be visible, indicating the page has fully loaded
    await this.page.waitForSelector('button:has-text("Novo Deal")', { timeout: 15000, state: 'visible' })
    // Also wait for at least one stage heading to confirm board loaded
    await this.page.waitForSelector('h3.uppercase', { timeout: 10000, state: 'visible' })
  }

  /**
   * Get the pipeline selector button
   */
  getPipelineSelector() {
    return this.page.locator('button:has-text("Pipeline"), [data-testid="pipeline-selector"]').first()
  }

  /**
   * Select a pipeline by name
   */
  async selectPipeline(pipelineName: string) {
    const selector = this.getPipelineSelector()
    await selector.click()

    // Click on the pipeline option
    const pipelineOption = this.page.getByRole('option', { name: pipelineName }).or(
      this.page.locator(`[role="menuitem"]:has-text("${pipelineName}")`)
    )
    await pipelineOption.click()
  }

  /**
   * Get "Create Deal" button
   */
  getCreateDealButton() {
    // Button has text "Novo Deal" with Plus icon
    return this.page.getByRole('button', { name: /novo deal/i })
  }

  /**
   * Open create deal dialog
   */
  async openCreateDealDialog() {
    const button = this.getCreateDealButton()
    await button.click()
  }

  /**
   * Fill and submit create deal form
   */
  async createDeal(data: {
    title: string
    value?: string
    contactName?: string
    stageId?: string
  }) {
    await this.openCreateDealDialog()

    // Wait for dialog to open
    await this.page.waitForSelector('[role="dialog"]', { timeout: 10000 })

    // Fill title (input with id="title")
    await this.page.fill('input#title[name="title"]', data.title)

    // Fill value if provided (input with id="value")
    if (data.value) {
      await this.page.fill('input#value[name="value"]', data.value)
    }

    // Select or create contact if provided
    if (data.contactName) {
      // Click the "+" button to add new contact
      const addContactButton = this.page.getByRole('button').filter({ hasText: /\+/ }).or(
        this.page.locator('button:has-text("+")')
      ).first()

      if (await addContactButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addContactButton.click()
        await this.page.waitForTimeout(500)

        // Fill new contact name
        const contactNameInput = this.page.locator('input[placeholder*="Nome"], input[name="newContactName"]').first()
        if (await contactNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await contactNameInput.fill(data.contactName)
        }
      }
    }

    // Submit form by pressing the submit button inside the form
    const submitButton = this.page.locator('form button[type="submit"]').or(
      this.page.getByRole('button', { name: /criar|salvar/i })
    ).first()
    await submitButton.click()

    // With Optimistic UI, dialog closes immediately - no need to wait
    // Just wait a bit for the optimistic update to apply
    await this.page.waitForTimeout(500)
  }

  /**
   * Get all Kanban columns (stages)
   */
  getKanbanColumns() {
    // Find columns by looking for stage headings (h3 with uppercase text)
    // Then get their parent containers
    return this.page.locator('h3.uppercase').locator('xpath=ancestor::div[contains(@class, "flex-none")]')
  }

  /**
   * Get a specific Kanban column by name
   */
  getKanbanColumnByName(stageName: string) {
    // Find the column by looking for h3 with the stage name
    return this.page.locator(`h3:has-text("${stageName}")`).locator('../../../..')
  }

  /**
   * Get all deal cards
   */
  getDealCards() {
    // Deal cards have specific structure with title and value
    return this.page.locator('div[class*="group relative flex flex-col"]').filter({
      has: this.page.locator('span:has-text("Valor")')
    })
  }

  /**
   * Get a specific deal card by title
   */
  getDealCardByTitle(title: string) {
    // Find the card that contains the exact title text
    return this.page.locator('div[class*="group relative flex flex-col"]').filter({
      has: this.page.locator(`span.text-sm:has-text("${title}")`)
    }).first()
  }

  /**
   * Click on a deal card to open edit dialog
   */
  async openDealDialog(title: string) {
    const card = this.getDealCardByTitle(title)
    await card.click()
    await this.page.waitForSelector('[role="dialog"]')
  }

  /**
   * Edit a deal
   */
  async editDeal(currentTitle: string, newData: {
    title?: string
    value?: string
  }) {
    await this.openDealDialog(currentTitle)

    if (newData.title) {
      const titleInput = this.page.locator('input[name="title"], input#title')
      await titleInput.clear()
      await titleInput.fill(newData.title)
    }

    if (newData.value) {
      const valueInput = this.page.locator('input[name="value"], input#value')
      await valueInput.clear()
      await valueInput.fill(newData.value)
    }

    // Save changes
    const saveButton = this.page.getByRole('button', { name: /salvar|atualizar|save|update/i })
    await saveButton.click()

    // With Optimistic UI, dialog closes immediately - no need to wait
    await this.page.waitForTimeout(500)
  }

  /**
   * Delete a deal
   */
  async deleteDeal(title: string) {
    await this.openDealDialog(title)

    // Click delete button
    const deleteButton = this.page.getByRole('button', { name: /excluir|deletar|delete/i })
    await deleteButton.click()

    // Confirm deletion if there's a confirmation dialog
    const confirmButton = this.page.getByRole('button', { name: /confirmar|sim|yes/i })
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click()
    }

    // With Optimistic UI, dialog closes immediately - no need to wait
    await this.page.waitForTimeout(500)
  }

  /**
   * Drag a deal from one stage to another
   * Note: This is a simplified version - full drag & drop testing with Playwright
   * can be complex and may require specific data-testid attributes
   */
  async dragDealToStage(dealTitle: string, targetStageName: string) {
    const dealCard = this.getDealCardByTitle(dealTitle)
    const targetColumn = this.getKanbanColumnByName(targetStageName)

    // Get bounding boxes
    const dealBox = await dealCard.boundingBox()
    const targetBox = await targetColumn.boundingBox()

    if (!dealBox || !targetBox) {
      throw new Error('Could not get bounding boxes for drag and drop')
    }

    // Perform drag and drop
    await this.page.mouse.move(dealBox.x + dealBox.width / 2, dealBox.y + dealBox.height / 2)
    await this.page.mouse.down()
    await this.page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 100, { steps: 10 })
    await this.page.mouse.up()

    // Wait for the update to complete
    await this.page.waitForTimeout(1000)
  }

  /**
   * Check if a deal exists on the board
   */
  async hasDeal(title: string): Promise<boolean> {
    return await this.getDealCardByTitle(title).isVisible({ timeout: 3000 }).catch(() => false)
  }

  /**
   * Get count of deals in a specific stage
   */
  async getDealCountInStage(stageName: string): Promise<number> {
    const column = this.getKanbanColumnByName(stageName)
    const deals = column.locator('[data-deal-id], .deal-card')
    return await deals.count()
  }

  /**
   * Click WhatsApp button for a deal
   */
  async clickWhatsAppForDeal(dealTitle: string) {
    const dealCard = this.getDealCardByTitle(dealTitle)
    // WhatsApp button has MessageCircle icon and green styling
    const whatsappButton = dealCard.locator('button.text-green-500, button:has-text("Conversar")')

    // Wait for new page/tab to open
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      whatsappButton.click()
    ])

    return newPage
  }

  /**
   * Check if Kanban board is visible
   */
  async isBoardVisible(): Promise<boolean> {
    // Check if we can see at least one stage heading and the "Novo Deal" button
    const hasStages = await this.page.locator('h3.uppercase').count() > 0
    const hasButton = await this.page.locator('button:has-text("Novo Deal")').isVisible().catch(() => false)
    return hasStages && hasButton
  }

  /**
   * Get the count of all deals on the board
   */
  async getTotalDealCount(): Promise<number> {
    const deals = this.getDealCards()
    return await deals.count()
  }
}
