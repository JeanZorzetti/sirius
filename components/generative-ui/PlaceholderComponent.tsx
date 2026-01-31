/**
 * Placeholder Component
 *
 * Temporary placeholder shown for components not yet implemented.
 * Will be replaced by actual components in Phase 2.
 */

'use client'

interface PlaceholderComponentProps {
  name: string
}

export function PlaceholderComponent({ name }: PlaceholderComponentProps) {
  return (
    <div className="p-6 border border-dashed border-gray-400 rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
      <p className="text-gray-600 dark:text-gray-400">
        Component <strong>{name}</strong> will be implemented in Phase 2
      </p>
    </div>
  )
}
