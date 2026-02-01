/**
 * Context Extractor - Intelligence Layer
 *
 * Extracts entities and intent from conversation messages.
 * Used to auto-fill component props and trigger UI rendering.
 */

// ============================================
// TYPES
// ============================================

export interface ExtractedEntities {
  // Financial
  monetaryValues: MonetaryValue[]
  percentages: number[]

  // Contact Info
  emails: string[]
  phones: string[]
  names: string[]
  companies: string[]

  // Temporal
  dates: DateEntity[]
  timeframes: string[]

  // Business
  competitors: CompetitorMention[]
  industries: string[]
  teamSizes: TeamSize | null
  plans: ('free' | 'pro')[]

  // Problems & Goals
  painPoints: string[]
  goals: string[]
}

export interface MonetaryValue {
  value: number
  currency: 'BRL' | 'USD' | 'EUR'
  context: 'cost' | 'revenue' | 'savings' | 'investment' | 'unknown'
  raw: string
}

export interface DateEntity {
  value: Date
  type: 'exact' | 'relative' | 'range'
  raw: string
}

export interface CompetitorMention {
  name: string
  normalized: 'pipedrive' | 'rdstation' | 'hubspot' | 'salesforce' | 'zoho' | 'other'
  sentiment: 'positive' | 'negative' | 'neutral'
}

export type TeamSize = 'solo' | 'small' | 'medium' | 'large'

export type UserIntent =
  | 'pricing_inquiry'
  | 'roi_calculation'
  | 'demo_request'
  | 'competitor_comparison'
  | 'implementation_timeline'
  | 'deal_creation'
  | 'script_generation'
  | 'qualification_check'
  | 'objection'
  | 'general_question'
  | 'closing_intent'

export interface IntentAnalysis {
  primary: UserIntent
  confidence: number
  secondary: UserIntent | null
  signals: string[]
}

// ============================================
// MONETARY EXTRACTION
// ============================================

const CURRENCY_PATTERNS = {
  BRL: /R\$\s*([\d.,]+)\s*(mil|k|m|mi|milhão|milhões)?/gi,
  USD: /(?:US\$|\$)\s*([\d.,]+)\s*(k|m|million|thousand)?/gi,
  EUR: /(?:€|EUR)\s*([\d.,]+)\s*(k|m)?/gi,
}

const NUMERIC_MULTIPLIERS: Record<string, number> = {
  'mil': 1000,
  'k': 1000,
  'm': 1000000,
  'mi': 1000000,
  'milhão': 1000000,
  'milhões': 1000000,
  'million': 1000000,
  'thousand': 1000,
}

export function extractMonetaryValues(text: string): MonetaryValue[] {
  const values: MonetaryValue[] = []

  for (const [currency, pattern] of Object.entries(CURRENCY_PATTERNS)) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const rawValue = match[1].replace(/\./g, '').replace(',', '.')
      let value = parseFloat(rawValue)

      const multiplierKey = match[2]?.toLowerCase()
      if (multiplierKey && NUMERIC_MULTIPLIERS[multiplierKey]) {
        value *= NUMERIC_MULTIPLIERS[multiplierKey]
      }

      // Detect context based on surrounding words
      const contextStart = Math.max(0, match.index - 50)
      const contextEnd = Math.min(text.length, match.index + match[0].length + 50)
      const surrounding = text.substring(contextStart, contextEnd).toLowerCase()

      let context: MonetaryValue['context'] = 'unknown'
      if (surrounding.match(/gast|custo|pago|pagar|investi|custa|preço/)) {
        context = 'cost'
      } else if (surrounding.match(/econom|poupo|salv|reduz/)) {
        context = 'savings'
      } else if (surrounding.match(/fatura|receit|ganha|vend/)) {
        context = 'revenue'
      } else if (surrounding.match(/investi|aplic/)) {
        context = 'investment'
      }

      values.push({
        value,
        currency: currency as 'BRL' | 'USD' | 'EUR',
        context,
        raw: match[0],
      })
    }
  }

  // Also extract plain numbers with context clues (e.g., "15 mil por mês")
  const plainPattern = /([\d.,]+)\s*(mil|k|m|mi|milhão|milhões)?\s*(por\s+mês|mensai?s?|mês|anua?i?s?|ano)?/gi
  let plainMatch: RegExpExecArray | null
  while ((plainMatch = plainPattern.exec(text)) !== null) {
    const currentMatch = plainMatch // Capture for use in callback
    // Skip if already matched by currency patterns
    if (values.some(v => v.raw.includes(currentMatch[1]))) continue

    const rawValue = currentMatch[1].replace(/\./g, '').replace(',', '.')
    let value = parseFloat(rawValue)

    // Skip unrealistic values (likely dates or other numbers)
    if (value < 100 || value > 10000000) continue

    const multiplierKey = currentMatch[2]?.toLowerCase()
    if (multiplierKey && NUMERIC_MULTIPLIERS[multiplierKey]) {
      value *= NUMERIC_MULTIPLIERS[multiplierKey]
    }

    const surrounding = text.substring(
      Math.max(0, currentMatch.index - 30),
      Math.min(text.length, currentMatch.index + currentMatch[0].length + 30)
    ).toLowerCase()

    // Only add if there's a money-related context
    if (surrounding.match(/gast|custo|pago|pagar|investi|custa|preço|econom|poupo|fatura|receit|vend/)) {
      values.push({
        value,
        currency: 'BRL', // Default assumption for Brazilian context
        context: 'unknown',
        raw: currentMatch[0],
      })
    }
  }

  return values
}

// ============================================
// COMPETITOR EXTRACTION
// ============================================

const COMPETITOR_PATTERNS: Record<string, RegExp> = {
  pipedrive: /pipe\s?drive/i,
  rdstation: /rd\s?station|rd\s?crm/i,
  hubspot: /hub\s?spot/i,
  salesforce: /sales\s?force/i,
  zoho: /zoho/i,
}

export function extractCompetitors(text: string): CompetitorMention[] {
  const competitors: CompetitorMention[] = []

  for (const [normalized, pattern] of Object.entries(COMPETITOR_PATTERNS)) {
    if (pattern.test(text)) {
      // Determine sentiment
      const surrounding = text.toLowerCase()
      let sentiment: CompetitorMention['sentiment'] = 'neutral'

      if (surrounding.match(new RegExp(`(uso|usando|usamos|tenho|temos).{0,30}${pattern.source}`, 'i'))) {
        sentiment = 'neutral' // Currently using
      } else if (surrounding.match(new RegExp(`${pattern.source}.{0,30}(ruim|problem|difícil|caro|complicado)`, 'i'))) {
        sentiment = 'negative'
      } else if (surrounding.match(new RegExp(`${pattern.source}.{0,30}(bom|gosto|funciona|legal)`, 'i'))) {
        sentiment = 'positive'
      }

      competitors.push({
        name: normalized.charAt(0).toUpperCase() + normalized.slice(1),
        normalized: normalized as CompetitorMention['normalized'],
        sentiment,
      })
    }
  }

  return competitors
}

// ============================================
// INTENT DETECTION
// ============================================

const INTENT_PATTERNS: Record<UserIntent, RegExp[]> = {
  pricing_inquiry: [
    /quanto\s+custa/i,
    /qual\s+o?\s*pre[çc]o/i,
    /planos?\s+(disponíve|de\s+pre[çc]o)/i,
    /valores?/i,
    /tabela\s+de\s+pre[çc]o/i,
    /free\s+(vs?|versus|ou)\s+pro/i,
  ],
  roi_calculation: [
    /quanto\s+(economiz|poupo|ganho)/i,
    /roi|retorno/i,
    /vale\s+a\s+pena/i,
    /custo.{0,20}benefício/i,
    /payback/i,
    /calcul(ar|e|a)\s+(economia|roi|retorno)/i,
  ],
  demo_request: [
    /quero\s+(ver|uma?)\s+demo/i,
    /agendar?\s+(demo|demonstra)/i,
    /mostrar?\s+(como\s+funciona|na\s+prática)/i,
    /ver\s+funcionando/i,
    /marcar\s+(reunião|call|demo)/i,
  ],
  competitor_comparison: [
    /compar(ar|ativo|e|ação)/i,
    /diferen[çc]a.{0,20}(pipedrive|hubspot|rd|salesforce|zoho)/i,
    /(pipedrive|hubspot|rd|salesforce|zoho).{0,20}vs/i,
    /melhor\s+que/i,
    /avaliar\s+outras?\s+op[çc][õo]es/i,
  ],
  implementation_timeline: [
    /quanto\s+tempo\s+(leva|demora)/i,
    /implementa[çc][ãa]o/i,
    /come[çc]ar\s+a\s+usar/i,
    /setup|configura[çc][ãa]o/i,
    /prazo\s+(de\s+)?implementa/i,
  ],
  deal_creation: [
    /criar\s+(deal|oportunidade|negócio)/i,
    /come[çc]ar\s+(a\s+usar|agora)/i,
    /como\s+(contra|assina|come[çc])/i,
    /quero\s+contratar/i,
    /fechar\s+negócio/i,
  ],
  script_generation: [
    /script\s+(de\s+)?(venda|cold\s+call|email)/i,
    /como\s+(abordar|ligar|prospectar)/i,
    /template\s+(de\s+)?email/i,
    /pitch/i,
  ],
  qualification_check: [
    /sirius\s+(é\s+)?pra\s+mim/i,
    /meu\s+perfil/i,
    /se\s+encaixa/i,
    /faz\s+sentido/i,
    /ideal\s+para/i,
  ],
  objection: [
    /(muito\s+)?caro/i,
    /não\s+tenho\s+(budget|or[çc]amento|tempo)/i,
    /preciso\s+pensar/i,
    /depois\s+eu\s+vejo/i,
    /não\s+sei\s+se/i,
  ],
  closing_intent: [
    /vamos\s+fechar/i,
    /pronto\s+para\s+(come[çc]ar|contratar)/i,
    /pode\s+mandar\s+(contrato|proposta)/i,
    /onde\s+assino/i,
  ],
  general_question: [
    /o\s+que\s+[eé]/i,
    /como\s+funciona/i,
    /me\s+(fala|explica)/i,
  ],
}

export function detectIntent(text: string): IntentAnalysis {
  const matches: { intent: UserIntent; score: number }[] = []

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    let score = 0
    const matchedPatterns: string[] = []

    for (const pattern of patterns) {
      if (pattern.test(text)) {
        score += 1
        matchedPatterns.push(pattern.source)
      }
    }

    if (score > 0) {
      matches.push({ intent: intent as UserIntent, score })
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score)

  if (matches.length === 0) {
    return {
      primary: 'general_question',
      confidence: 0.3,
      secondary: null,
      signals: [],
    }
  }

  const primary = matches[0]
  const secondary = matches[1] || null

  return {
    primary: primary.intent,
    confidence: Math.min(0.95, 0.5 + primary.score * 0.15),
    secondary: secondary?.intent || null,
    signals: INTENT_PATTERNS[primary.intent].map(p => p.source),
  }
}

// ============================================
// CONTACT INFO EXTRACTION
// ============================================

export function extractEmails(text: string): string[] {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  return [...new Set(text.match(emailPattern) || [])]
}

export function extractPhones(text: string): string[] {
  const phonePattern = /(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4,5}[-.\s]?\d{4}/g
  return [...new Set(text.match(phonePattern) || [])]
}

export function extractNames(text: string): string[] {
  // Look for patterns like "meu nome é X" or "sou o X" or "Fulano here"
  const namePatterns = [
    /(?:meu\s+nome\s+[eé]|me\s+chamo|sou\s+o?\s*)\s*([A-Z][a-záàâãéèêíïóôõöúçñ]+(?:\s+[A-Z][a-záàâãéèêíïóôõöúçñ]+)?)/gi,
    /(?:Dr\.?|Dra\.?|Sr\.?|Sra\.?)\s+([A-Z][a-záàâãéèêíïóôõöúçñ]+(?:\s+[A-Z][a-záàâãéèêíïóôõöúçñ]+)?)/gi,
  ]

  const names: string[] = []
  for (const pattern of namePatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      names.push(match[1].trim())
    }
  }

  return [...new Set(names)]
}

export function extractCompanies(text: string): string[] {
  const companyPatterns = [
    /(?:trabalho\s+na|empresa\s+[eé]?|da\s+empresa)\s+([A-Z][a-záàâãéèêíïóôõöúçñA-Z0-9\s]+?)(?:\.|,|$)/gi,
    /(?:Clínica|Hospital|Consultório|Escritório|Loja|Empresa)\s+([A-Z][a-záàâãéèêíïóôõöúçñA-Z0-9\s]+?)(?:\.|,|$)/gi,
  ]

  const companies: string[] = []
  for (const pattern of companyPatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      companies.push(match[1].trim())
    }
  }

  return [...new Set(companies)]
}

// ============================================
// TEAM SIZE EXTRACTION
// ============================================

export function extractTeamSize(text: string): TeamSize | null {
  const lower = text.toLowerCase()

  // Solo patterns
  if (lower.match(/sozinho|só\s+eu|individual|freelancer|autônomo/)) {
    return 'solo'
  }

  // Look for number patterns
  const numberPatterns = [
    /(\d+)\s*(?:pessoas?|funcionários?|colaboradores?|membros?|vendedores?)/i,
    /equipe\s+(?:de|com)\s*(\d+)/i,
    /time\s+(?:de|com)\s*(\d+)/i,
  ]

  for (const pattern of numberPatterns) {
    const match = text.match(pattern)
    if (match) {
      const size = parseInt(match[1])
      if (size === 1) return 'solo'
      if (size <= 5) return 'small'
      if (size <= 15) return 'medium'
      return 'large'
    }
  }

  // Qualitative patterns
  if (lower.match(/equipe\s+pequena|poucos\s+funcionários|time\s+reduzido/)) {
    return 'small'
  }
  if (lower.match(/equipe\s+grande|muitos\s+funcionários|grande\s+time/)) {
    return 'large'
  }

  return null
}

// ============================================
// PAIN POINTS & GOALS EXTRACTION
// ============================================

const PAIN_POINT_PATTERNS = [
  /(?:problema|dificuldade|desafio|frustra[çc][ãa]o|dor)\s+(?:[eé]|com)\s+(.+?)(?:\.|$)/gi,
  /(?:n[ãa]o\s+consigo|difícil\s+de|complicado|trabalhoso)\s+(.+?)(?:\.|$)/gi,
  /(?:perco|gasto|demoro)\s+(?:muito\s+)?(?:tempo|dinheiro)\s+(?:com|para)\s+(.+?)(?:\.|$)/gi,
]

const GOAL_PATTERNS = [
  /(?:quero|preciso|gostaria\s+de|objetivo\s+[eé])\s+(.+?)(?:\.|$)/gi,
  /(?:aumentar|melhorar|otimizar|reduzir)\s+(.+?)(?:\.|$)/gi,
]

export function extractPainPoints(text: string): string[] {
  const painPoints: string[] = []

  for (const pattern of PAIN_POINT_PATTERNS) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const painPoint = match[1].trim()
      if (painPoint.length > 5 && painPoint.length < 200) {
        painPoints.push(painPoint)
      }
    }
  }

  return [...new Set(painPoints)]
}

export function extractGoals(text: string): string[] {
  const goals: string[] = []

  for (const pattern of GOAL_PATTERNS) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const goal = match[1].trim()
      if (goal.length > 5 && goal.length < 200) {
        goals.push(goal)
      }
    }
  }

  return [...new Set(goals)]
}

// ============================================
// MAIN EXTRACTION FUNCTION
// ============================================

/**
 * Extract all entities from a conversation message
 */
export function extractEntities(text: string): ExtractedEntities {
  return {
    monetaryValues: extractMonetaryValues(text),
    percentages: [],
    emails: extractEmails(text),
    phones: extractPhones(text),
    names: extractNames(text),
    companies: extractCompanies(text),
    dates: [],
    timeframes: [],
    competitors: extractCompetitors(text),
    industries: [],
    teamSizes: extractTeamSize(text),
    plans: [],
    painPoints: extractPainPoints(text),
    goals: extractGoals(text),
  }
}

/**
 * Extract entities from entire conversation history
 */
export function extractEntitiesFromHistory(
  messages: { role: string; content: string }[]
): ExtractedEntities {
  const allEntities: ExtractedEntities = {
    monetaryValues: [],
    percentages: [],
    emails: [],
    phones: [],
    names: [],
    companies: [],
    dates: [],
    timeframes: [],
    competitors: [],
    industries: [],
    teamSizes: null,
    plans: [],
    painPoints: [],
    goals: [],
  }

  for (const message of messages) {
    if (message.role !== 'user') continue

    const entities = extractEntities(message.content)

    allEntities.monetaryValues.push(...entities.monetaryValues)
    allEntities.emails.push(...entities.emails)
    allEntities.phones.push(...entities.phones)
    allEntities.names.push(...entities.names)
    allEntities.companies.push(...entities.companies)
    allEntities.competitors.push(...entities.competitors)
    allEntities.painPoints.push(...entities.painPoints)
    allEntities.goals.push(...entities.goals)

    if (entities.teamSizes && !allEntities.teamSizes) {
      allEntities.teamSizes = entities.teamSizes
    }
  }

  // Deduplicate
  allEntities.emails = [...new Set(allEntities.emails)]
  allEntities.phones = [...new Set(allEntities.phones)]
  allEntities.names = [...new Set(allEntities.names)]
  allEntities.companies = [...new Set(allEntities.companies)]
  allEntities.painPoints = [...new Set(allEntities.painPoints)]
  allEntities.goals = [...new Set(allEntities.goals)]

  // Deduplicate competitors by normalized name
  const seenCompetitors = new Set<string>()
  allEntities.competitors = allEntities.competitors.filter(c => {
    if (seenCompetitors.has(c.normalized)) return false
    seenCompetitors.add(c.normalized)
    return true
  })

  return allEntities
}
