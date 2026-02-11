/**
 * Deal Automation Engine
 *
 * Responsible for finding and executing automations triggered by deal events.
 * This function is designed to be called fire-and-forget — it never throws.
 */

import { prisma } from '@/lib/prisma'
import logger from '@/lib/logger'
import { evaluateConditions, AutomationCondition } from './conditions'
import { executeActions, AutomationAction } from './actions'

export type AutomationTriggerType =
  | 'DEAL_CREATED'
  | 'DEAL_MOVED'
  | 'DEAL_WON'
  | 'DEAL_LOST'
  | 'DEAL_IDLE'

/**
 * Execute all matching automations for a given deal event.
 *
 * @param dealId - The ID of the deal that triggered the event
 * @param triggerType - The type of event that occurred
 * @param context - Contextual data about the event (organizationId, stageId, value, etc.)
 */
export async function executeDealAutomations(
  dealId: string,
  triggerType: AutomationTriggerType,
  context: Record<string, unknown>
): Promise<void> {
  try {
    const organizationId = context.organizationId as string | undefined
    if (!organizationId) {
      logger.warn({ dealId, triggerType }, 'executeDealAutomations called without organizationId')
      return
    }

    // Enrich context with dealId and triggerType for use in actions
    const enrichedContext: Record<string, unknown> = {
      ...context,
      dealId,
      triggerType
    }

    // Fetch all enabled automations for this org + trigger
    const automations = await prisma.dealAutomation.findMany({
      where: {
        organizationId,
        enabled: true,
        triggerType: triggerType as any
      }
    })

    if (automations.length === 0) return

    for (const automation of automations) {
      try {
        // For DEAL_MOVED: filter by toStageId if configured
        if (triggerType === 'DEAL_MOVED') {
          const triggerConfig = automation.triggerConfig as Record<string, unknown>
          const toStageId = triggerConfig?.toStageId as string | undefined

          // If toStageId is configured and doesn't match current stageId, skip
          if (toStageId && toStageId !== context.stageId) {
            continue
          }
        }

        // Evaluate conditions
        const conditions = automation.conditions as unknown as AutomationCondition[]
        const conditionsMet = evaluateConditions(conditions, enrichedContext)

        if (!conditionsMet) {
          // Log skipped execution
          await prisma.automationExecution.create({
            data: {
              automationId: automation.id,
              dealId,
              status: 'SKIPPED',
              actionsRun: 0,
              metadata: { reason: 'conditions_not_met' }
            }
          }).catch(() => {}) // Non-critical
          continue
        }

        // Execute actions
        const actions = automation.actions as unknown as AutomationAction[]
        const { actionsRun, errors } = await executeActions(actions, enrichedContext)

        const status = errors.length === 0 ? 'SUCCESS' : 'FAILED'
        const errorMessage = errors.length > 0 ? errors.join('; ') : undefined

        // Record execution
        await prisma.automationExecution.create({
          data: {
            automationId: automation.id,
            dealId,
            status: status as any,
            actionsRun,
            error: errorMessage,
            metadata: {
              triggerType,
              conditionsEvaluated: conditions.length,
              actionsAttempted: actions.length,
              errors
            }
          }
        })

        // Update automation stats
        await prisma.dealAutomation.update({
          where: { id: automation.id },
          data: {
            executionCount: { increment: 1 },
            lastExecutedAt: new Date()
          }
        })

        logger.info(
          {
            automationId: automation.id,
            dealId,
            triggerType,
            status,
            actionsRun
          },
          'Automation executed'
        )
      } catch (automationErr) {
        // Failure in one automation should not prevent others from running
        logger.error(
          { automationErr, automationId: automation.id, dealId, triggerType },
          'Error executing automation'
        )

        // Try to record the failure
        await prisma.automationExecution.create({
          data: {
            automationId: automation.id,
            dealId,
            status: 'FAILED',
            actionsRun: 0,
            error: automationErr instanceof Error ? automationErr.message : String(automationErr)
          }
        }).catch(() => {})
      }
    }
  } catch (err) {
    // Top-level catch — never propagate
    logger.error({ err, dealId, triggerType }, 'Unhandled error in executeDealAutomations')
  }
}
