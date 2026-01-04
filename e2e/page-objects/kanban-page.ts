import { Page, Locator } from '@playwright/test'
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
    return this.page.getByRole('button', { name: /criar negócio|novo negócio|create deal/i })
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
    await this.page.waitForSelector('[role="dialog"]')

    // Fill title
    await this.page.fill('input[name="title"], input[placeholder*="título"], input[placeholder*="nome"]', data.title)

    // Fill value if provided
    if (data.value) {
      const valueInput = this.page.locator('input[name="value"], input[placeholder*="valor"], input[type="number"]').first()
      await valueInput.fill(data.value)
    }

    // Select or create contact if provided
    if (data.contactName) {
      // Click on contact selector
      const contactSelector = this.page.locator('button:has-text("Selecionar"), [data-testid="contact-selector"]').first()
      await contactSelector.click()

      // Type contact name
      await this.page.fill('input[placeholder*="contato"]', data.contactName)

      // Click on "Criar novo contato" or select existing
      const createOption = this.page.locator('text="Criar novo contato"').or(
        this.page.locator(`text="${data.contactName}"`)
      ).first()
      await createOption.click()
    }

    // Submit form
    const submitButton = this.page.getByRole('button', { name: /criar|salvar|save/i })
    await submitButton.click()

    // Wait for dialog to close
    await this.page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 })
  }

  /**
   * Get all Kanban columns (stages)
   */
  getKanbanColumns() {
    return this.page.locator('[data-stage-id], .kanban-column')
  }

  /**
   * Get a specific Kanban column by name
   */
  getKanbanColumnByName(stageName: string) {
    return this.page.locator(`[data-stage-name="${stageName}"]`).or(
      this.page.locator(`.kanban-column:has-text("${stageName}")`)
    )
  }

  /**
   * Get all deal cards
   */
  getDealCards() {
    return this.page.locator('[data-deal-id], .deal-card, [class*="deal"]').filter({ hasText: /R\$|Valor/ })
  }

  /**
   * Get a specific deal card by title
   */
  getDealCardByTitle(title: string) {
    return this.page.locator(`text="${title}"`).locator('..').locator('..')
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
      const titleInput = this.page.locator('input[name="title"], input[placeholder*="título"]')
      await titleInput.fill(newData.title)
    }

    if (newData.value) {
      const valueInput = this.page.locator('input[name="value"], input[type="number"]').first()
      await valueInput.fill(newData.value)
    }

    // Save changes
    const saveButton = this.page.getByRole('button', { name: /salvar|save/i })
    await saveButton.click()

    // Wait for dialog to close
    await this.page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 })
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

    // Wait for dialog to close
    await this.page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 })
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
    const whatsappButton = dealCard.locator('button:has(svg), [title*="WhatsApp"], [title*="Conversar"]')

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
    const columns = this.getKanbanColumns()
    return await columns.first().isVisible({ timeout: 5000 }).catch(() => false)
  }

  /**
   * Get the count of all deals on the board
   */
  async getTotalDealCount(): Promise<number> {
    const deals = this.getDealCards()
    return await deals.count()
  }
}
