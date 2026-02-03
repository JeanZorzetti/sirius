/**
 * Google Search Console URL Inspection API Integration
 *
 * API: https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect
 *
 * Permite inspecionar URLs para obter:
 * - Status de indexação
 * - Mobile usability
 * - Rich results (structured data)
 * - AMP status
 * - Last crawl time
 */

import { google } from 'googleapis'

// ============================================================================
// TYPES
// ============================================================================

export interface IndexStatusResult {
  verdict: 'PASS' | 'PARTIAL' | 'FAIL' | 'NEUTRAL'
  coverageState?: string
  robotsTxtState?: 'ALLOWED' | 'BLOCKED'
  indexingState?: 'INDEXING_ALLOWED' | 'BLOCKED_BY_META_TAG' | 'BLOCKED_BY_HTTP_HEADER' | 'BLOCKED_BY_ROBOTS_TXT'
  lastCrawlTime?: string
  pageFetchState?: 'SUCCESSFUL' | 'SOFT_404' | 'BLOCKED_ROBOTS_TXT' | 'NOT_FOUND' | 'ACCESS_DENIED' | 'SERVER_ERROR' | 'REDIRECT_ERROR' | 'ACCESS_FORBIDDEN' | 'BLOCKED_4XX' | 'INTERNAL_CRAWL_ERROR' | 'INVALID_URL'
  googleCanonical?: string
  userCanonical?: string
  sitemap?: string[]
  referringUrls?: string[]
}

export interface MobileUsabilityResult {
  verdict: 'PASS' | 'FAIL' | 'NEUTRAL'
  issues?: Array<{
    issueType: string
    severity: 'WARNING' | 'ERROR'
    message: string
  }>
}

export interface RichResultsResult {
  verdict: 'PASS' | 'PARTIAL' | 'FAIL' | 'NEUTRAL'
  detectedItems?: Array<{
    richResultType: string
    items?: Array<{
      name?: string
      issues?: Array<{
        issueMessage: string
        severity: 'ERROR' | 'WARNING'
      }>
    }>
  }>
}

export interface AmpResult {
  verdict: 'PASS' | 'PARTIAL' | 'FAIL' | 'NEUTRAL'
  ampUrl?: string
  robotsTxtState?: 'ALLOWED' | 'BLOCKED'
  indexingState?: 'AMP_INDEXING_ALLOWED' | 'BLOCKED_BY_META_TAG' | 'BLOCKED_BY_HTTP_HEADER' | 'BLOCKED_BY_ROBOTS_TXT'
  issues?: Array<{
    issueMessage: string
    severity: 'ERROR' | 'WARNING'
  }>
}

export interface URLInspectionResult {
  inspectionUrl: string
  indexStatus: IndexStatusResult
  mobileUsability?: MobileUsabilityResult
  richResults?: RichResultsResult
  ampStatus?: AmpResult
  inspectedAt: string
}

export interface CoverageSummary {
  totalPages: number
  indexed: number
  excluded: number
  errors: number
  indexedPercentage: number
  errorRate: number
}

export interface InspectionError {
  url: string
  error: string
  category: 'indexing' | 'mobile' | 'rich_results' | 'amp' | 'fetch'
  severity: 'ERROR' | 'WARNING'
  message: string
  lastCrawl?: string
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

async function getSearchConsoleClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const projectId = process.env.GOOGLE_PROJECT_ID

  if (!clientEmail || !privateKey || !projectId) {
    throw new Error('Missing Google Search Console credentials in environment variables')
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
      project_id: projectId,
    },
    // URL Inspection requires write scope (not readonly)
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  })

  const searchConsole = google.searchconsole({
    version: 'v1',
    auth,
  })

  return searchConsole
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Inspeciona uma URL específica
 *
 * @param url - URL completa a ser inspecionada (ex: https://example.com/page)
 * @returns Resultado da inspeção ou erro
 */
export async function inspectURL(
  url: string
): Promise<URLInspectionResult | { error: string }> {
  try {
    const searchConsole = await getSearchConsoleClient()
    const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL

    if (!siteUrl) {
      throw new Error('GOOGLE_SEARCH_CONSOLE_SITE_URL not configured')
    }

    // Chamar API de inspeção
    const response = await searchConsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl: url,
        siteUrl: siteUrl,
      },
    })

    const result = response.data.inspectionResult

    if (!result) {
      return { error: 'No inspection result returned' }
    }

    // Extrair dados da resposta
    const inspection: URLInspectionResult = {
      inspectionUrl: url,
      indexStatus: {
        verdict: (result.indexStatusResult?.verdict as any) || 'NEUTRAL',
        coverageState: result.indexStatusResult?.coverageState || undefined,
        robotsTxtState: result.indexStatusResult?.robotsTxtState as any,
        indexingState: result.indexStatusResult?.indexingState as any,
        lastCrawlTime: result.indexStatusResult?.lastCrawlTime || undefined,
        pageFetchState: result.indexStatusResult?.pageFetchState as any,
        googleCanonical: result.indexStatusResult?.googleCanonical || undefined,
        userCanonical: result.indexStatusResult?.userCanonical || undefined,
        sitemap: result.indexStatusResult?.sitemap || undefined,
        referringUrls: result.indexStatusResult?.referringUrls || undefined,
      },
      mobileUsability: result.mobileUsabilityResult
        ? {
            verdict: (result.mobileUsabilityResult.verdict as any) || 'NEUTRAL',
            issues: result.mobileUsabilityResult.issues?.map((issue: any) => ({
              issueType: issue.issueType || '',
              severity: issue.severity || 'WARNING',
              message: issue.message || '',
            })),
          }
        : undefined,
      richResults: result.richResultsResult
        ? {
            verdict: (result.richResultsResult.verdict as any) || 'NEUTRAL',
            detectedItems: result.richResultsResult.detectedItems?.map((item: any) => ({
              richResultType: item.richResultType || '',
              items: item.items?.map((subItem: any) => ({
                name: subItem.name || undefined,
                issues: subItem.issues?.map((issue: any) => ({
                  issueMessage: issue.issueMessage || '',
                  severity: issue.severity || 'WARNING',
                })),
              })),
            })),
          }
        : undefined,
      ampStatus: result.ampResult
        ? {
            verdict: (result.ampResult.verdict as any) || 'NEUTRAL',
            ampUrl: result.ampResult.ampUrl || undefined,
            robotsTxtState: result.ampResult.robotsTxtState as any,
            indexingState: result.ampResult.indexingState as any,
            issues: result.ampResult.issues?.map((issue: any) => ({
              issueMessage: issue.issueMessage || '',
              severity: issue.severity || 'WARNING',
            })),
          }
        : undefined,
      inspectedAt: new Date().toISOString(),
    }

    return inspection

  } catch (error) {
    console.error('Error inspecting URL:', error)
    return {
      error: error instanceof Error ? error.message : 'Unknown error during URL inspection',
    }
  }
}

/**
 * Inspeciona múltiplas URLs em paralelo (com rate limiting)
 *
 * @param urls - Array de URLs a serem inspecionadas
 * @param delayMs - Delay entre requests em ms (padrão: 1000ms)
 * @returns Array de resultados de inspeção
 */
export async function inspectURLsBatch(
  urls: string[],
  delayMs: number = 1000
): Promise<URLInspectionResult[]> {
  const results: URLInspectionResult[] = []

  for (const url of urls) {
    const result = await inspectURL(url)

    if (!('error' in result)) {
      results.push(result)
    }

    // Rate limiting: aguardar antes do próximo request
    if (urls.indexOf(url) < urls.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return results
}

/**
 * Analisa resultados e extrai erros
 *
 * @param results - Array de resultados de inspeção
 * @returns Array de erros encontrados
 */
export function extractErrors(results: URLInspectionResult[]): InspectionError[] {
  const errors: InspectionError[] = []

  results.forEach((result) => {
    // Erros de indexação
    if (result.indexStatus.verdict === 'FAIL') {
      errors.push({
        url: result.inspectionUrl,
        error: result.indexStatus.coverageState || 'Indexing failed',
        category: 'indexing',
        severity: 'ERROR',
        message: `Indexação bloqueada: ${result.indexStatus.indexingState || 'unknown'}`,
        lastCrawl: result.indexStatus.lastCrawlTime,
      })
    }

    // Erros de fetch
    if (
      result.indexStatus.pageFetchState &&
      !['SUCCESSFUL', 'SOFT_404'].includes(result.indexStatus.pageFetchState)
    ) {
      errors.push({
        url: result.inspectionUrl,
        error: result.indexStatus.pageFetchState,
        category: 'fetch',
        severity: 'ERROR',
        message: `Erro ao fazer fetch da página: ${result.indexStatus.pageFetchState}`,
        lastCrawl: result.indexStatus.lastCrawlTime,
      })
    }

    // Erros de mobile usability
    if (result.mobileUsability?.verdict === 'FAIL' && result.mobileUsability.issues) {
      result.mobileUsability.issues.forEach((issue) => {
        errors.push({
          url: result.inspectionUrl,
          error: issue.issueType,
          category: 'mobile',
          severity: issue.severity,
          message: issue.message,
        })
      })
    }

    // Erros de rich results
    if (result.richResults?.verdict === 'FAIL' && result.richResults.detectedItems) {
      result.richResults.detectedItems.forEach((item) => {
        item.items?.forEach((subItem) => {
          subItem.issues?.forEach((issue) => {
            errors.push({
              url: result.inspectionUrl,
              error: item.richResultType,
              category: 'rich_results',
              severity: issue.severity,
              message: issue.issueMessage,
            })
          })
        })
      })
    }

    // Erros de AMP
    if (result.ampStatus?.verdict === 'FAIL' && result.ampStatus.issues) {
      result.ampStatus.issues.forEach((issue) => {
        errors.push({
          url: result.inspectionUrl,
          error: 'AMP Error',
          category: 'amp',
          severity: issue.severity,
          message: issue.issueMessage,
        })
      })
    }
  })

  return errors
}

/**
 * Gera resumo de cobertura
 *
 * @param results - Array de resultados de inspeção
 * @returns Resumo de cobertura
 */
export function generateCoverageSummary(results: URLInspectionResult[]): CoverageSummary {
  const totalPages = results.length
  const indexed = results.filter((r) => r.indexStatus.verdict === 'PASS').length
  const errors = results.filter((r) => r.indexStatus.verdict === 'FAIL').length
  const excluded = totalPages - indexed - errors

  return {
    totalPages,
    indexed,
    excluded,
    errors,
    indexedPercentage: totalPages > 0 ? Math.round((indexed / totalPages) * 100) : 0,
    errorRate: totalPages > 0 ? Math.round((errors / totalPages) * 100) : 0,
  }
}

/**
 * Agrupa erros por categoria
 *
 * @param errors - Array de erros
 * @returns Erros agrupados por categoria
 */
export function groupErrorsByCategory(errors: InspectionError[]): Record<string, InspectionError[]> {
  return errors.reduce((acc, error) => {
    if (!acc[error.category]) {
      acc[error.category] = []
    }
    acc[error.category].push(error)
    return acc
  }, {} as Record<string, InspectionError[]>)
}

/**
 * Filtra páginas com problemas de mobile usability
 *
 * @param results - Array de resultados de inspeção
 * @returns Páginas com problemas mobile
 */
export function filterMobileIssues(results: URLInspectionResult[]): URLInspectionResult[] {
  return results.filter(
    (r) => r.mobileUsability && r.mobileUsability.verdict !== 'PASS'
  )
}

/**
 * Filtra páginas elegíveis para rich results mas sem implementação
 *
 * @param results - Array de resultados de inspeção
 * @returns Páginas com oportunidades de rich results
 */
export function filterRichResultsOpportunities(
  results: URLInspectionResult[]
): URLInspectionResult[] {
  return results.filter(
    (r) =>
      r.richResults &&
      (r.richResults.verdict === 'NEUTRAL' || r.richResults.verdict === 'PARTIAL')
  )
}
