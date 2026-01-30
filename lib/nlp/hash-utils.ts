/**
 * NLP Pipeline - Hash Utilities
 *
 * Pure utility functions for content hashing (no 'use server' directive).
 * Used by both auto-reprocess.ts and pipeline.ts.
 */

import { createHash } from 'crypto'

/**
 * Calculate SHA-256 hash of content for change detection
 *
 * This is a pure utility function that doesn't need to be a Server Action.
 * It's in a separate file to avoid 'use server' constraints.
 */
export function calculateContentHash(content: string): string {
  return createHash('sha256').update(content.trim()).digest('hex')
}
