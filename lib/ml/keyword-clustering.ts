// ============================================================================
// KEYWORD CLUSTERING & TOPIC MODELING (TypeScript nativo)
// Sprint 3 - Keyword Clustering
//
// Agrupa keywords semanticamente usando similaridade de palavras,
// detecta canibalizacao entre paginas e identifica content gaps.
//
// Algoritmo: Tokenizacao + Jaccard Similarity + Agglomerative Clustering
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface KeywordCluster {
  clusterId: number
  topicName: string
  keywords: ClusterKeyword[]
  totalClicks: number
  totalImpressions: number
  averagePosition: number
  averageCTR: number
  pagesTargeting: string[]
  cannibalizationRisk: 'high' | 'medium' | 'low' | 'none'
  contentCoverage: number
  gapScore: number
  recommendedAction: 'create_page' | 'expand_existing' | 'consolidate' | 'optimize' | 'maintain'
  actionDescription: string
}

export interface ClusterKeyword {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface KeywordClusteringResponse {
  clusters: KeywordCluster[]
  summary: ClusteringSummary
  processedAt: string
}

export interface ClusteringSummary {
  totalKeywords: number
  totalClusters: number
  contentGaps: number
  cannibalizationIssues: number
  topOpportunityCluster: string
  estimatedMissingTraffic: number
}

interface KeywordInput {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface PageInput {
  page: string
  slug: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

// ============================================================================
// PORTUGUESE STOPWORDS
// ============================================================================

const STOPWORDS = new Set([
  'a', 'as', 'o', 'os', 'um', 'uma', 'uns', 'umas',
  'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'por', 'para', 'com', 'sem', 'sob', 'sobre',
  'e', 'ou', 'mas', 'que', 'se', 'como', 'quando',
  'ao', 'aos', 'pelo', 'pela', 'pelos', 'pelas',
  'esse', 'essa', 'este', 'esta', 'isso', 'isto',
  'ele', 'ela', 'eles', 'elas', 'seu', 'sua', 'seus', 'suas',
  'meu', 'minha', 'meus', 'minhas',
  'ter', 'ser', 'estar', 'fazer', 'ir',
  'mais', 'muito', 'bem', 'mal', 'ja', 'ainda', 'tambem',
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been',
  'what', 'how', 'who', 'where', 'when', 'which', 'why',
])

// ============================================================================
// TOKENIZATION & NORMALIZATION
// ============================================================================

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
}

function normalizeSlug(slug: string): string[] {
  return slug
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
}

// ============================================================================
// SIMILARITY FUNCTIONS
// ============================================================================

/**
 * Jaccard Similarity between two sets of tokens
 * Returns 0-1 (0 = no overlap, 1 = identical)
 */
function jaccardSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 && tokensB.length === 0) return 0

  const setA = new Set(tokensA)
  const setB = new Set(tokensB)

  let intersection = 0
  for (const token of setA) {
    if (setB.has(token)) intersection++
  }

  const union = setA.size + setB.size - intersection
  return union > 0 ? intersection / union : 0
}

/**
 * Enhanced similarity: Jaccard + substring matching for compound words
 */
function keywordSimilarity(tokensA: string[], tokensB: string[]): number {
  const jaccard = jaccardSimilarity(tokensA, tokensB)

  // Bonus for shared substrings (captures "crm" in "crm-vendas" and "crm-gratis")
  let substringBonus = 0
  for (const a of tokensA) {
    for (const b of tokensB) {
      if (a !== b) {
        if (a.includes(b) || b.includes(a)) {
          substringBonus += 0.1
        }
        // Shared prefix of 4+ chars
        if (a.length >= 4 && b.length >= 4 && a.substring(0, 4) === b.substring(0, 4)) {
          substringBonus += 0.05
        }
      }
    }
  }

  return Math.min(jaccard + substringBonus, 1)
}

// ============================================================================
// AGGLOMERATIVE CLUSTERING
// ============================================================================

interface ClusterNode {
  id: number
  keywordIndices: number[]
  tokens: string[] // merged tokens from all keywords
}

/**
 * Agglomerative (bottom-up) hierarchical clustering
 * Merges most similar clusters until similarity threshold is met
 */
function agglomerativeClustering(
  tokenizedKeywords: string[][],
  similarityThreshold: number = 0.25
): number[][] {
  // Initialize: each keyword is its own cluster
  let clusters: ClusterNode[] = tokenizedKeywords.map((tokens, i) => ({
    id: i,
    keywordIndices: [i],
    tokens: [...tokens],
  }))

  // Iteratively merge most similar clusters
  while (clusters.length > 1) {
    let bestSimilarity = 0
    let bestI = -1
    let bestJ = -1

    // Find most similar pair
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const sim = keywordSimilarity(clusters[i].tokens, clusters[j].tokens)
        if (sim > bestSimilarity) {
          bestSimilarity = sim
          bestI = i
          bestJ = j
        }
      }
    }

    // Stop if best similarity is below threshold
    if (bestSimilarity < similarityThreshold) break

    // Merge clusters
    const merged: ClusterNode = {
      id: clusters[bestI].id,
      keywordIndices: [...clusters[bestI].keywordIndices, ...clusters[bestJ].keywordIndices],
      tokens: [...new Set([...clusters[bestI].tokens, ...clusters[bestJ].tokens])],
    }

    // Remove old clusters and add merged
    clusters = clusters.filter((_, idx) => idx !== bestI && idx !== bestJ)
    clusters.push(merged)
  }

  return clusters.map((c) => c.keywordIndices)
}

// ============================================================================
// TOPIC NAME EXTRACTION
// ============================================================================

/**
 * Extract a descriptive topic name from cluster keywords
 * Uses word frequency to find the most representative terms
 */
function extractTopicName(keywords: ClusterKeyword[]): string {
  const wordFreq = new Map<string, number>()

  for (const kw of keywords) {
    const tokens = tokenize(kw.query)
    for (const token of tokens) {
      wordFreq.set(token, (wordFreq.get(token) || 0) + 1)
    }
  }

  // Sort by frequency, take top 2-3 words
  const sorted = [...wordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word)

  if (sorted.length === 0) return keywords[0]?.query || 'Sem nome'

  // Capitalize first letter
  return sorted
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ============================================================================
// CANNIBALIZATION DETECTION
// ============================================================================

/**
 * Detect if multiple pages are targeting the same keyword cluster
 */
function detectCannibalization(
  clusterKeywords: ClusterKeyword[],
  pages: PageInput[]
): { risk: 'high' | 'medium' | 'low' | 'none'; matchingPages: string[] } {
  const clusterTokens = new Set<string>()
  for (const kw of clusterKeywords) {
    for (const token of tokenize(kw.query)) {
      clusterTokens.add(token)
    }
  }

  // Find pages whose slugs match cluster tokens
  const matchingPages: string[] = []

  for (const page of pages) {
    const pageTokens = normalizeSlug(page.slug || page.page)
    let matchCount = 0
    for (const token of pageTokens) {
      if (clusterTokens.has(token)) matchCount++
    }

    // Page matches if 50%+ of its slug tokens are in the cluster
    const matchRatio = pageTokens.length > 0 ? matchCount / pageTokens.length : 0
    if (matchRatio >= 0.4 && matchCount >= 1) {
      matchingPages.push(page.page)
    }
  }

  if (matchingPages.length >= 3) return { risk: 'high', matchingPages }
  if (matchingPages.length === 2) return { risk: 'medium', matchingPages }
  if (matchingPages.length === 1) return { risk: 'none', matchingPages }
  return { risk: 'none', matchingPages: [] }
}

// ============================================================================
// CONTENT COVERAGE & GAP DETECTION
// ============================================================================

/**
 * Calculate how well existing pages cover a keyword cluster
 * Returns 0-100 coverage percentage
 */
function calculateContentCoverage(
  clusterKeywords: ClusterKeyword[],
  matchingPages: string[],
  allPages: PageInput[]
): number {
  if (matchingPages.length === 0) return 0

  // Coverage based on:
  // 1. Number of matching pages (more pages = better coverage, up to a point)
  // 2. Average position of cluster keywords (lower = better coverage)
  // 3. Actual clicks vs impressions (higher CTR = content is relevant)

  const avgPosition =
    clusterKeywords.reduce((sum, kw) => sum + kw.position, 0) / clusterKeywords.length
  const avgCTR =
    clusterKeywords.reduce((sum, kw) => sum + kw.ctr, 0) / clusterKeywords.length

  let coverage = 0

  // Page existence (0-40)
  coverage += Math.min(matchingPages.length * 20, 40)

  // Position factor (0-35): position 1 = 35, position 20 = 5
  coverage += Math.max(0, 35 - avgPosition * 1.5)

  // CTR factor (0-25): high CTR means content matches intent well
  coverage += Math.min(avgCTR * 5, 25)

  return Math.round(Math.min(Math.max(coverage, 0), 100))
}

// ============================================================================
// ACTION RECOMMENDATION
// ============================================================================

function determineAction(
  coverage: number,
  pageCount: number,
  cannibalizationRisk: 'high' | 'medium' | 'low' | 'none'
): { action: 'create_page' | 'expand_existing' | 'consolidate' | 'optimize' | 'maintain'; description: string } {
  if (pageCount === 0) {
    return {
      action: 'create_page',
      description: 'Nenhuma pagina cobre este topico. Crie conteudo dedicado para capturar este trafego.',
    }
  }

  if (cannibalizationRisk === 'high') {
    return {
      action: 'consolidate',
      description: `${pageCount} paginas competindo pelo mesmo topico. Consolide em uma pagina principal e redirecione as demais.`,
    }
  }

  if (cannibalizationRisk === 'medium') {
    return {
      action: 'consolidate',
      description: '2 paginas competindo. Considere mesclar o conteudo ou diferenciar os angulos de cada pagina.',
    }
  }

  if (coverage < 30) {
    return {
      action: 'expand_existing',
      description: 'Cobertura baixa. Expanda o conteudo existente com subtopicos, FAQs e exemplos praticos.',
    }
  }

  if (coverage < 60) {
    return {
      action: 'optimize',
      description: 'Cobertura media. Otimize title tags, headings e adicione secoes para cobrir subtopicos faltantes.',
    }
  }

  return {
    action: 'maintain',
    description: 'Boa cobertura. Mantenha o conteudo atualizado e monitore competidores.',
  }
}

// ============================================================================
// MAIN CLUSTERING FUNCTION
// ============================================================================

/**
 * Cluster keywords into topics, detect cannibalization and content gaps
 *
 * @param keywords - Keywords from GSC
 * @param pages - Pages from GSC
 * @param similarityThreshold - Minimum similarity to merge clusters (0-1, default 0.25)
 * @param minClusterSize - Minimum keywords to form a cluster (default 2)
 */
export function clusterKeywords(
  keywords: KeywordInput[],
  pages: PageInput[],
  similarityThreshold: number = 0.25,
  minClusterSize: number = 2
): KeywordClusteringResponse {
  if (!keywords || keywords.length === 0) {
    return {
      clusters: [],
      summary: {
        totalKeywords: 0,
        totalClusters: 0,
        contentGaps: 0,
        cannibalizationIssues: 0,
        topOpportunityCluster: '',
        estimatedMissingTraffic: 0,
      },
      processedAt: new Date().toISOString(),
    }
  }

  // Filter keywords with some data
  const validKeywords = keywords.filter((kw) => kw.impressions >= 5 && kw.query.trim().length > 0)

  // Tokenize all keywords
  const tokenized = validKeywords.map((kw) => tokenize(kw.query))

  // Perform clustering
  const clusterIndices = agglomerativeClustering(tokenized, similarityThreshold)

  // Build cluster objects
  const clusters: KeywordCluster[] = []
  let clusterId = 1

  for (const indices of clusterIndices) {
    // Skip clusters that are too small
    if (indices.length < minClusterSize) continue

    const clusterKws: ClusterKeyword[] = indices.map((i) => ({
      query: validKeywords[i].query,
      clicks: validKeywords[i].clicks,
      impressions: validKeywords[i].impressions,
      ctr: validKeywords[i].ctr,
      position: validKeywords[i].position,
    }))

    // Sort keywords by impressions (most important first)
    clusterKws.sort((a, b) => b.impressions - a.impressions)

    // Detect cannibalization
    const { risk, matchingPages } = detectCannibalization(clusterKws, pages)

    // Calculate metrics
    const totalClicks = clusterKws.reduce((sum, kw) => sum + kw.clicks, 0)
    const totalImpressions = clusterKws.reduce((sum, kw) => sum + kw.impressions, 0)
    const avgPosition = clusterKws.reduce((sum, kw) => sum + kw.position, 0) / clusterKws.length
    const avgCTR = clusterKws.reduce((sum, kw) => sum + kw.ctr, 0) / clusterKws.length

    // Calculate coverage
    const coverage = calculateContentCoverage(clusterKws, matchingPages, pages)

    // Determine action
    const { action, description } = determineAction(coverage, matchingPages.length, risk)

    clusters.push({
      clusterId: clusterId++,
      topicName: extractTopicName(clusterKws),
      keywords: clusterKws,
      totalClicks,
      totalImpressions,
      averagePosition: Math.round(avgPosition * 10) / 10,
      averageCTR: Math.round(avgCTR * 100) / 100,
      pagesTargeting: matchingPages,
      cannibalizationRisk: risk,
      contentCoverage: coverage,
      gapScore: 100 - coverage,
      recommendedAction: action,
      actionDescription: description,
    })
  }

  // Sort: content gaps first, then cannibalization, then by impressions
  clusters.sort((a, b) => {
    // Prioritize content gaps (no pages)
    if (a.pagesTargeting.length === 0 && b.pagesTargeting.length > 0) return -1
    if (b.pagesTargeting.length === 0 && a.pagesTargeting.length > 0) return 1

    // Then cannibalization
    const riskOrder = { high: 0, medium: 1, low: 2, none: 3 }
    if (riskOrder[a.cannibalizationRisk] !== riskOrder[b.cannibalizationRisk]) {
      return riskOrder[a.cannibalizationRisk] - riskOrder[b.cannibalizationRisk]
    }

    // Then by gap score
    return b.gapScore - a.gapScore
  })

  // Summary
  const contentGaps = clusters.filter((c) => c.pagesTargeting.length === 0).length
  const cannibalizationIssues = clusters.filter(
    (c) => c.cannibalizationRisk === 'high' || c.cannibalizationRisk === 'medium'
  ).length

  const estimatedMissingTraffic = clusters
    .filter((c) => c.gapScore > 50)
    .reduce((sum, c) => {
      // Estimate: if we had good coverage, we'd get ~5% CTR on impressions
      const potentialClicks = Math.round((c.totalImpressions * 5) / 100)
      return sum + Math.max(0, potentialClicks - c.totalClicks)
    }, 0)

  const topOpportunity = clusters[0]?.topicName || ''

  return {
    clusters,
    summary: {
      totalKeywords: validKeywords.length,
      totalClusters: clusters.length,
      contentGaps,
      cannibalizationIssues,
      topOpportunityCluster: topOpportunity,
      estimatedMissingTraffic,
    },
    processedAt: new Date().toISOString(),
  }
}

// ============================================================================
// HELPER EXPORTS (for UI)
// ============================================================================

export function getActionColor(action: KeywordCluster['recommendedAction']): {
  bg: string
  border: string
  text: string
  badge: string
} {
  const colors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    create_page: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      badge: 'bg-red-100 text-red-700',
    },
    expand_existing: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      badge: 'bg-orange-100 text-orange-700',
    },
    consolidate: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      badge: 'bg-yellow-100 text-yellow-700',
    },
    optimize: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      badge: 'bg-blue-100 text-blue-700',
    },
    maintain: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      badge: 'bg-green-100 text-green-700',
    },
  }
  return colors[action] || colors.maintain
}

export function getActionLabel(action: KeywordCluster['recommendedAction']): string {
  const labels: Record<string, string> = {
    create_page: 'Criar Pagina',
    expand_existing: 'Expandir Conteudo',
    consolidate: 'Consolidar',
    optimize: 'Otimizar',
    maintain: 'Manter',
  }
  return labels[action] || action
}

export function getCannibalizationLabel(risk: KeywordCluster['cannibalizationRisk']): string {
  const labels: Record<string, string> = {
    high: 'Canibalizacao Alta',
    medium: 'Canibalizacao Media',
    low: 'Canibalizacao Baixa',
    none: 'Sem Canibalizacao',
  }
  return labels[risk] || risk
}
