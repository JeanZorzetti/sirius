import { NextRequest } from 'next/server'
import { ApiResponse } from './api-middleware'

/**
 * Pagination configuration
 */
export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Parse pagination parameters from request
 */
export function getPaginationParams(request: NextRequest): PaginationParams {
  const searchParams = request.nextUrl.searchParams

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Calculate pagination metadata
 */
export function getPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

/**
 * Create paginated API response
 */
export function paginatedResponse<T>(
  requestId: string,
  data: T[],
  pagination: PaginationMeta
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    pagination,
    meta: {
      requestId,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Parse sort parameters from request
 */
export interface SortParams {
  sortBy: string
  order: 'asc' | 'desc'
}

export function getSortParams(
  request: NextRequest,
  defaultSort: string = 'createdAt',
  allowedFields: string[] = []
): SortParams {
  const searchParams = request.nextUrl.searchParams

  let sortBy = searchParams.get('sortBy') || defaultSort
  const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc'

  // Validate sortBy field if allowedFields is provided
  if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    sortBy = defaultSort
  }

  return { sortBy, order }
}

/**
 * Parse filter parameters from request
 */
export function getFilters(request: NextRequest, allowedFilters: string[]): Record<string, string> {
  const searchParams = request.nextUrl.searchParams
  const filters: Record<string, string> = {}

  allowedFilters.forEach(filter => {
    const value = searchParams.get(filter)
    if (value) {
      filters[filter] = value
    }
  })

  return filters
}

/**
 * Format Decimal to number for JSON response
 */
export function formatDecimal(value: any): number | null {
  if (value === null || value === undefined) return null
  return typeof value === 'object' && 'toNumber' in value
    ? value.toNumber()
    : Number(value)
}

/**
 * Format date to ISO string
 */
export function formatDate(date: Date | string | null): string | null {
  if (!date) return null
  return typeof date === 'string' ? date : date.toISOString()
}

/**
 * Sanitize object for API response (remove internal fields)
 */
export function sanitizeForApi<T extends Record<string, any>>(
  obj: T,
  fieldsToRemove: string[] = []
): Partial<T> {
  const sanitized = { ...obj }

  fieldsToRemove.forEach(field => {
    delete sanitized[field]
  })

  return sanitized
}
