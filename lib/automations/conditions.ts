/**
 * Automation Conditions Evaluator
 *
 * A condition has the shape:
 * {
 *   field: 'value' | 'stageId' | 'pipelineId' | 'title',
 *   operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains',
 *   value: string | number
 * }
 */

export interface AutomationCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
  value: string | number
}

/**
 * Evaluate all conditions against the given context.
 * Returns true if all conditions pass (AND logic) or if there are no conditions.
 */
export function evaluateConditions(
  conditions: AutomationCondition[],
  context: Record<string, unknown>
): boolean {
  if (!conditions || conditions.length === 0) return true
  return conditions.every(c => evaluateCondition(c, context))
}

function evaluateCondition(
  condition: AutomationCondition,
  context: Record<string, unknown>
): boolean {
  const { field, operator, value } = condition
  const actual = context[field]

  if (actual === undefined || actual === null) return false

  switch (operator) {
    case 'equals':
      return String(actual) === String(value)
    case 'not_equals':
      return String(actual) !== String(value)
    case 'greater_than':
      return Number(actual) > Number(value)
    case 'less_than':
      return Number(actual) < Number(value)
    case 'contains':
      return String(actual).toLowerCase().includes(String(value).toLowerCase())
    default:
      return false
  }
}
