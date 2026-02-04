// ============================================================================
// RANKING PREDICTION ENGINE (TypeScript nativo)
// Sprint 2 - Predictive Ranking Opportunities
//
// Analisa keywords do GSC e calcula:
// - Score de oportunidade (0-100)
// - Estimativa de trafego ganho
// - Nivel de esforco
// - Acoes recomendadas especificas
// - ROI score
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface RankingPrediction {
  keyword: string
  currentPosition: number
  targetPosition: number
  currentClicks: number
  currentImpressions: number
  currentCTR: number
  expectedCTR: number
  targetCTR: number
  ctrGap: number
  estimatedTrafficGain: number
  estimatedRevenueImpact: number
  opportunityScore: number
  effortLevel: 'low' | 'medium' | 'high'
  category: RankingCategory
  recommendedActions: RecommendedAction[]
  confidence: number
}

export type RankingCategory =
  | 'quick_win'
  | 'striking_distance'
  | 'ctr_optimization'
  | 'growth_opportunity'
  | 'defend_position'

export interface RecommendedAction {
  type: 'on_page' | 'content' | 'technical' | 'snippet' | 'internal_links' | 'backlinks'
  description: string
  priority: 'high' | 'medium' | 'low'
  estimatedImpact: string
}

export interface RankingPredictionResponse {
  predictions: RankingPrediction[]
  summary: PredictionSummary
  processedAt: string
}

export interface PredictionSummary {
  totalKeywordsAnalyzed: number
  quickWins: number
  strikingDistance: number
  ctrOptimizations: number
  growthOpportunities: number
  defendPositions: number
  totalEstimatedTrafficGain: number
  totalEstimatedRevenueImpact: number
  topCategory: RankingCategory
}

interface KeywordInput {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

// ============================================================================
// GOOGLE CTR CURVE (Industry Average 2024-2025)
// Source: Advanced Web Ranking, Sistrix, Backlinko studies
// ============================================================================

const CTR_CURVE: Record<number, number> = {
  1: 31.7,
  2: 24.7,
  3: 18.7,
  4: 13.6,
  5: 9.5,
  6: 6.2,
  7: 4.2,
  8: 3.1,
  9: 2.8,
  10: 2.5,
  11: 1.0,
  12: 0.8,
  13: 0.7,
  14: 0.6,
  15: 0.5,
  16: 0.4,
  17: 0.35,
  18: 0.3,
  19: 0.25,
  20: 0.2,
}

/**
 * Get expected CTR for a given position using the CTR curve
 * For positions > 20, uses exponential decay
 */
function getExpectedCTR(position: number): number {
  const roundedPos = Math.round(position)
  if (roundedPos <= 0) return 0
  if (roundedPos <= 20) return CTR_CURVE[roundedPos] || 0.2
  // Exponential decay for positions > 20
  return Math.max(0.05, 0.2 * Math.exp(-0.1 * (roundedPos - 20)))
}

/**
 * Calculate target position based on current position
 * - Position 11-20: Target is position 7 (page 1, realistic)
 * - Position 4-10: Target is position 3 (top 3)
 * - Position 1-3: Target is position 1 (defend/improve)
 * - Position 21+: Target is position 10 (reach page 1)
 */
function calculateTargetPosition(currentPosition: number): number {
  if (currentPosition <= 3) return 1
  if (currentPosition <= 10) return 3
  if (currentPosition <= 20) return 7
  if (currentPosition <= 30) return 10
  return 15
}

// ============================================================================
// EFFORT ESTIMATION
// ============================================================================

function estimateEffort(
  currentPosition: number,
  targetPosition: number,
  impressions: number
): 'low' | 'medium' | 'high' {
  const positionGap = currentPosition - targetPosition

  // Keywords with low impressions = low competition = easier
  const isLowCompetition = impressions < 500

  if (positionGap <= 3) return 'low'
  if (positionGap <= 7) return isLowCompetition ? 'low' : 'medium'
  if (positionGap <= 12) return isLowCompetition ? 'medium' : 'high'
  return 'high'
}

// ============================================================================
// CATEGORY CLASSIFICATION
// ============================================================================

function classifyKeyword(
  currentPosition: number,
  currentCTR: number,
  expectedCTR: number,
  impressions: number
): RankingCategory {
  // Position 1-3 with good metrics: defend
  if (currentPosition <= 3) {
    return 'defend_position'
  }

  // Position 4-10 with CTR significantly below expected: snippet issue
  if (currentPosition <= 10 && currentCTR < expectedCTR * 0.6) {
    return 'ctr_optimization'
  }

  // Position 11-15 with decent impressions: striking distance (quick win)
  if (currentPosition <= 15 && impressions >= 50) {
    return 'quick_win'
  }

  // Position 11-20: striking distance
  if (currentPosition <= 20) {
    return 'striking_distance'
  }

  // Position 21+: growth opportunity
  return 'growth_opportunity'
}

// ============================================================================
// OPPORTUNITY SCORING
// ============================================================================

/**
 * Calculate opportunity score (0-100)
 * Higher = more valuable opportunity
 *
 * Factors:
 * - Traffic gain potential (40% weight)
 * - Feasibility / effort (30% weight)
 * - Current momentum signals (20% weight)
 * - CTR gap (10% weight)
 */
function calculateOpportunityScore(
  currentPosition: number,
  targetPosition: number,
  impressions: number,
  currentCTR: number,
  expectedCTR: number,
  trafficGain: number
): number {
  // Traffic gain potential (0-40)
  const maxTrafficGain = 500 // normalize
  const trafficScore = Math.min(trafficGain / maxTrafficGain, 1) * 40

  // Feasibility: smaller position gap = easier (0-30)
  const positionGap = currentPosition - targetPosition
  const feasibilityScore = Math.max(0, 30 - positionGap * 2)

  // Momentum: high impressions = people are searching (0-20)
  const maxImpressions = 5000
  const momentumScore = Math.min(impressions / maxImpressions, 1) * 20

  // CTR gap: room for improvement (0-10)
  const ctrGapPct = expectedCTR > 0 ? Math.max(0, (expectedCTR - currentCTR) / expectedCTR) : 0
  const ctrScore = ctrGapPct * 10

  const totalScore = trafficScore + feasibilityScore + momentumScore + ctrScore

  return Math.round(Math.min(Math.max(totalScore, 0), 100))
}

// ============================================================================
// CONFIDENCE CALCULATION
// ============================================================================

function calculateConfidence(impressions: number, currentPosition: number): number {
  // More data = higher confidence
  let confidence = 50

  // Impressions boost confidence (max +30)
  if (impressions >= 1000) confidence += 30
  else if (impressions >= 500) confidence += 25
  else if (impressions >= 100) confidence += 15
  else if (impressions >= 50) confidence += 10
  else confidence += 5

  // Stable position (closer to integer) = higher confidence
  const positionFraction = currentPosition - Math.floor(currentPosition)
  if (positionFraction < 0.3 || positionFraction > 0.7) {
    confidence += 10
  }

  // Position within measurable range
  if (currentPosition <= 20) confidence += 10

  return Math.min(confidence, 100)
}

// ============================================================================
// REVENUE ESTIMATION
// ============================================================================

// Average CPC for organic traffic in Brazil (R$)
const AVG_ORGANIC_VALUE_PER_CLICK = 2.5

function estimateRevenueImpact(trafficGain: number): number {
  return Math.round(trafficGain * AVG_ORGANIC_VALUE_PER_CLICK * 100) / 100
}

// ============================================================================
// RECOMMENDED ACTIONS GENERATION
// ============================================================================

function generateActions(
  category: RankingCategory,
  currentPosition: number,
  currentCTR: number,
  expectedCTR: number,
  impressions: number
): RecommendedAction[] {
  const actions: RecommendedAction[] = []

  switch (category) {
    case 'quick_win':
      actions.push({
        type: 'internal_links',
        description: 'Adicionar 3-5 links internos apontando para esta pagina a partir de paginas com alta autoridade',
        priority: 'high',
        estimatedImpact: 'Pode subir 2-5 posicoes',
      })
      actions.push({
        type: 'content',
        description: 'Expandir conteudo com subtopicos relacionados e perguntas frequentes (FAQ)',
        priority: 'high',
        estimatedImpact: 'Melhora relevancia semantica',
      })
      actions.push({
        type: 'on_page',
        description: 'Otimizar H1, H2 e H3 com variacao da keyword principal',
        priority: 'medium',
        estimatedImpact: 'Melhora sinais on-page',
      })
      break

    case 'striking_distance':
      actions.push({
        type: 'content',
        description: 'Analisar top 3 resultados e adicionar conteudo que eles cobrem mas voce nao',
        priority: 'high',
        estimatedImpact: 'Pode subir 5-10 posicoes',
      })
      actions.push({
        type: 'backlinks',
        description: 'Conseguir 2-3 backlinks de dominios relevantes (guest posts, mencooes)',
        priority: 'high',
        estimatedImpact: 'Aumenta autoridade da pagina',
      })
      actions.push({
        type: 'internal_links',
        description: 'Criar cluster de conteudo com links internos para esta pagina como hub',
        priority: 'medium',
        estimatedImpact: 'Distribui autoridade interna',
      })
      actions.push({
        type: 'technical',
        description: 'Verificar Core Web Vitals da pagina e otimizar se necessario',
        priority: 'medium',
        estimatedImpact: 'Melhora experiencia do usuario',
      })
      break

    case 'ctr_optimization':
      actions.push({
        type: 'snippet',
        description: `Reescrever title tag: mais atraente, com numeros e call-to-action (CTR atual: ${currentCTR.toFixed(1)}%, esperado: ${expectedCTR.toFixed(1)}%)`,
        priority: 'high',
        estimatedImpact: `Pode ganhar +${Math.round(expectedCTR - currentCTR)}% de CTR`,
      })
      actions.push({
        type: 'snippet',
        description: 'Otimizar meta description: incluir beneficios claros e urgencia',
        priority: 'high',
        estimatedImpact: 'Mais cliques com mesma posicao',
      })
      actions.push({
        type: 'on_page',
        description: 'Adicionar Schema markup (FAQ, HowTo, Review) para rich snippets',
        priority: 'medium',
        estimatedImpact: 'Destaque visual na SERP',
      })
      break

    case 'defend_position':
      actions.push({
        type: 'content',
        description: 'Atualizar conteudo regularmente para manter freshness',
        priority: 'high',
        estimatedImpact: 'Protege posicao atual',
      })
      actions.push({
        type: 'technical',
        description: 'Monitorar Core Web Vitals e manter performance excelente',
        priority: 'medium',
        estimatedImpact: 'Evita perda de posicao',
      })
      if (currentCTR < expectedCTR * 0.8) {
        actions.push({
          type: 'snippet',
          description: 'Otimizar title/description para maximizar CTR na posicao atual',
          priority: 'medium',
          estimatedImpact: `CTR pode subir de ${currentCTR.toFixed(1)}% para ${expectedCTR.toFixed(1)}%`,
        })
      }
      break

    case 'growth_opportunity':
      actions.push({
        type: 'content',
        description: 'Criar conteudo completo e aprofundado (2000+ palavras) focado nesta keyword',
        priority: 'high',
        estimatedImpact: 'Necessario para competir',
      })
      actions.push({
        type: 'backlinks',
        description: 'Investir em link building: 5+ backlinks de qualidade',
        priority: 'high',
        estimatedImpact: 'Aumenta autoridade significativamente',
      })
      actions.push({
        type: 'internal_links',
        description: 'Criar topic cluster com 3-5 artigos de suporte linkando para esta pagina',
        priority: 'medium',
        estimatedImpact: 'Constroi autoridade tematica',
      })
      break
  }

  return actions
}

// ============================================================================
// MAIN PREDICTION FUNCTION
// ============================================================================

/**
 * Analyze all keywords and generate ranking predictions
 *
 * @param keywords - Keywords from GSC (query, clicks, impressions, ctr, position)
 * @returns RankingPredictionResponse with predictions sorted by opportunity score
 */
export function predictRankingOpportunities(
  keywords: KeywordInput[]
): RankingPredictionResponse {
  if (!keywords || keywords.length === 0) {
    return {
      predictions: [],
      summary: {
        totalKeywordsAnalyzed: 0,
        quickWins: 0,
        strikingDistance: 0,
        ctrOptimizations: 0,
        growthOpportunities: 0,
        defendPositions: 0,
        totalEstimatedTrafficGain: 0,
        totalEstimatedRevenueImpact: 0,
        topCategory: 'quick_win',
      },
      processedAt: new Date().toISOString(),
    }
  }

  // Filter keywords with meaningful data
  const validKeywords = keywords.filter(
    (kw) => kw.impressions >= 10 && kw.position > 0 && kw.position <= 50
  )

  const predictions: RankingPrediction[] = validKeywords.map((kw) => {
    const currentPosition = kw.position
    const targetPosition = calculateTargetPosition(currentPosition)
    const expectedCTR = getExpectedCTR(Math.round(currentPosition))
    const targetCTR = getExpectedCTR(targetPosition)
    const currentCTR = kw.ctr

    // Calculate estimated traffic gain
    const estimatedTrafficGain = Math.max(
      0,
      Math.round((kw.impressions * targetCTR) / 100 - kw.clicks)
    )

    // Category classification
    const category = classifyKeyword(currentPosition, currentCTR, expectedCTR, kw.impressions)

    // CTR gap (how much below expected)
    const ctrGap = expectedCTR > 0 ? Math.round((expectedCTR - currentCTR) * 10) / 10 : 0

    // Opportunity score
    const opportunityScore = calculateOpportunityScore(
      currentPosition,
      targetPosition,
      kw.impressions,
      currentCTR,
      expectedCTR,
      estimatedTrafficGain
    )

    // Effort level
    const effortLevel = estimateEffort(currentPosition, targetPosition, kw.impressions)

    // Revenue impact
    const estimatedRevenueImpact = estimateRevenueImpact(estimatedTrafficGain)

    // Confidence
    const confidence = calculateConfidence(kw.impressions, currentPosition)

    // Actions
    const recommendedActions = generateActions(
      category,
      currentPosition,
      currentCTR,
      expectedCTR,
      kw.impressions
    )

    return {
      keyword: kw.query,
      currentPosition,
      targetPosition,
      currentClicks: kw.clicks,
      currentImpressions: kw.impressions,
      currentCTR,
      expectedCTR,
      targetCTR,
      ctrGap,
      estimatedTrafficGain,
      estimatedRevenueImpact,
      opportunityScore,
      effortLevel,
      category,
      recommendedActions,
      confidence,
    }
  })

  // Sort by opportunity score (highest first)
  predictions.sort((a, b) => b.opportunityScore - a.opportunityScore)

  // Generate summary
  const quickWins = predictions.filter((p) => p.category === 'quick_win').length
  const strikingDistance = predictions.filter((p) => p.category === 'striking_distance').length
  const ctrOptimizations = predictions.filter((p) => p.category === 'ctr_optimization').length
  const growthOpportunities = predictions.filter((p) => p.category === 'growth_opportunity').length
  const defendPositions = predictions.filter((p) => p.category === 'defend_position').length

  const totalEstimatedTrafficGain = predictions.reduce(
    (sum, p) => sum + p.estimatedTrafficGain,
    0
  )
  const totalEstimatedRevenueImpact = predictions.reduce(
    (sum, p) => sum + p.estimatedRevenueImpact,
    0
  )

  // Determine top category (most impactful)
  const categoryMap: Record<RankingCategory, number> = {
    quick_win: quickWins,
    striking_distance: strikingDistance,
    ctr_optimization: ctrOptimizations,
    growth_opportunity: growthOpportunities,
    defend_position: defendPositions,
  }
  const topCategory = (Object.entries(categoryMap).sort(([, a], [, b]) => b - a)[0]?.[0] ||
    'quick_win') as RankingCategory

  return {
    predictions,
    summary: {
      totalKeywordsAnalyzed: validKeywords.length,
      quickWins,
      strikingDistance,
      ctrOptimizations,
      growthOpportunities,
      defendPositions,
      totalEstimatedTrafficGain,
      totalEstimatedRevenueImpact: Math.round(totalEstimatedRevenueImpact * 100) / 100,
      topCategory,
    },
    processedAt: new Date().toISOString(),
  }
}

// ============================================================================
// HELPER EXPORTS (for UI components)
// ============================================================================

export function getCategoryLabel(category: RankingCategory): string {
  const labels: Record<RankingCategory, string> = {
    quick_win: 'Quick Win',
    striking_distance: 'Striking Distance',
    ctr_optimization: 'Otimizar CTR',
    growth_opportunity: 'Oportunidade de Crescimento',
    defend_position: 'Defender Posicao',
  }
  return labels[category]
}

export function getCategoryColor(category: RankingCategory): {
  bg: string
  border: string
  text: string
  badge: string
  icon: string
} {
  const colors: Record<RankingCategory, { bg: string; border: string; text: string; badge: string; icon: string }> = {
    quick_win: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      badge: 'bg-green-100 text-green-700',
      icon: 'text-green-600',
    },
    striking_distance: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      badge: 'bg-orange-100 text-orange-700',
      icon: 'text-orange-600',
    },
    ctr_optimization: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      badge: 'bg-blue-100 text-blue-700',
      icon: 'text-blue-600',
    },
    growth_opportunity: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      badge: 'bg-purple-100 text-purple-700',
      icon: 'text-purple-600',
    },
    defend_position: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-800',
      badge: 'bg-slate-100 text-slate-700',
      icon: 'text-slate-600',
    },
  }
  return colors[category]
}

export function getEffortLabel(effort: 'low' | 'medium' | 'high'): string {
  const labels: Record<string, string> = {
    low: 'Baixo',
    medium: 'Medio',
    high: 'Alto',
  }
  return labels[effort]
}

export function getEffortColor(effort: 'low' | 'medium' | 'high'): string {
  const colors: Record<string, string> = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-red-600',
  }
  return colors[effort]
}

export function getCategoryIcon(category: RankingCategory): string {
  const icons: Record<RankingCategory, string> = {
    quick_win: 'zap',
    striking_distance: 'target',
    ctr_optimization: 'mouse-pointer-click',
    growth_opportunity: 'trending-up',
    defend_position: 'shield',
  }
  return icons[category]
}
