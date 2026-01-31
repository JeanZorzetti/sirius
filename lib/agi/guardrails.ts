/**
 * AGI Guardrails - Regras de Segurança Técnica
 *
 * Previne a IA de dar recomendações incorretas ou perigosas
 */

export interface GuardrailRule {
  domain: string
  forbidden: string[]
  required: string[]
  examples?: {
    bad: string
    good: string
  }[]
}

export const TECHNICAL_GUARDRAILS: Record<string, GuardrailRule> = {
  whatsapp: {
    domain: 'WhatsApp API & Integração',
    forbidden: [
      'usar número pessoal na API oficial do WhatsApp',
      'compartilhar credenciais da conta pessoal do WhatsApp',
      'usar WhatsApp Web para API em produção',
      'promover uso de números pessoais para negócios'
    ],
    required: [
      'SEMPRE recomendar número virtual/novo chip para WhatsApp Business API',
      'Explicar riscos de governança ao usar número pessoal (bloqueio, perda de dados)',
      'Mencionar que número pessoal não pode ser migrado para API oficial',
      'Sugerir Evolution API ou soluções oficiais com números dedicados'
    ],
    examples: [
      {
        bad: 'Você pode usar seu número pessoal na API oficial sem problemas',
        good: 'Para WhatsApp Business API, você precisa de um número dedicado (virtual ou novo chip). Usar número pessoal pode resultar em bloqueio e viola políticas do WhatsApp.'
      }
    ]
  },

  crm: {
    domain: 'CRM e Features',
    forbidden: [
      'prometer features que não existem no sistema',
      'dar prazos específicos sem confirmação',
      'afirmar que funciona com integrações não implementadas',
      'presumir dados do usuário que não foram fornecidos'
    ],
    required: [
      'Só afirmar features que estão implementadas',
      'Se não sabe se existe, dizer "preciso verificar"',
      'Nunca inventar dados do usuário',
      'Ser honesto sobre limitações atuais'
    ],
    examples: [
      {
        bad: 'Vejo que você tem 50 deals no sistema...',
        good: 'Quantos deals você está gerenciando atualmente?'
      }
    ]
  },

  data_privacy: {
    domain: 'Privacidade e Dados',
    forbidden: [
      'pedir senhas ou credenciais sensíveis',
      'sugerir compartilhar dados pessoais por canais inseguros',
      'recomendar armazenar senhas em texto plano',
      'solicitar informações bancárias diretamente'
    ],
    required: [
      'SEMPRE usar canais seguros para dados sensíveis',
      'Nunca pedir senhas em chat',
      'Recomendar práticas seguras de autenticação',
      'Explicar riscos de segurança quando relevante'
    ]
  },

  pricing: {
    domain: 'Preços e Planos',
    forbidden: [
      'inventar preços ou valores de planos',
      'prometer descontos sem autorização',
      'dar garantias de ROI específicas sem dados',
      'comparar preços com concorrentes sem dados factuais'
    ],
    required: [
      'Redirecionar perguntas de preço para time comercial se não souber',
      'Ser transparente sobre limitações de conhecimento de pricing',
      'Qualificar antes de falar de preço (Sandler)',
      'Nunca inventar valores'
    ]
  }
}

/**
 * Valida se uma resposta da IA viola algum guardrail
 */
export function validateResponse(response: string, domain?: string): {
  isValid: boolean
  violations: string[]
  suggestions: string[]
} {
  const violations: string[] = []
  const suggestions: string[] = []

  const lowerResponse = response.toLowerCase()

  // Verificar guardrails relevantes
  const domainsToCheck = domain
    ? [TECHNICAL_GUARDRAILS[domain]].filter(Boolean)
    : Object.values(TECHNICAL_GUARDRAILS)

  for (const guardrail of domainsToCheck) {
    // Checar violações
    for (const forbidden of guardrail.forbidden) {
      const forbiddenLower = forbidden.toLowerCase()
      if (lowerResponse.includes(forbiddenLower)) {
        violations.push(`⚠️ GUARDRAIL VIOLADO [${guardrail.domain}]: "${forbidden}"`)
      }
    }

    // Checar se menções críticas precisam de ações requeridas
    const criticalMentions: Record<string, string[]> = {
      whatsapp: ['whatsapp', 'api', 'número'],
      data_privacy: ['senha', 'credencial', 'login', 'banco'],
      pricing: ['preço', 'custo', 'valor', 'plano']
    }

    const domainKey = guardrail.domain.split(' ')[0].toLowerCase()
    const mentions = criticalMentions[domainKey] || []
    const hasMention = mentions.some(m => lowerResponse.includes(m))

    if (hasMention) {
      for (const required of guardrail.required) {
        suggestions.push(`💡 Considere adicionar: ${required}`)
      }
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
    suggestions: violations.length > 0 ? suggestions : []
  }
}

/**
 * Prompt de guardrails para injetar no system prompt
 */
export function getGuardrailsPrompt(): string {
  return `
🚨 GUARDRAILS TÉCNICOS - REGRAS OBRIGATÓRIAS:

**WhatsApp API:**
- NUNCA sugira usar número pessoal na API oficial
- SEMPRE recomende número virtual/dedicado
- Explique riscos: bloqueio, perda de dados, violação de políticas

**CRM/Features:**
- NUNCA invente dados do usuário ("vejo que você tem X deals...")
- Só afirme o que está EXPLICITAMENTE no contexto fornecido
- Se não sabe, diga "não sei" ou "preciso verificar"

**Privacidade:**
- NUNCA peça senhas ou credenciais em chat
- SEMPRE use canais seguros para dados sensíveis

**Preços:**
- NUNCA invente preços ou valores
- Qualifique antes de discutir preço (Sandler)
- Redirecione para comercial se não tiver informação

VIOLAR ESSAS REGRAS PODE CAUSAR DANOS REAIS AO NEGÓCIO E CLIENTES.
`
}

/**
 * Detecta alucinações comuns (presumir dados não fornecidos)
 */
export function detectHallucinations(
  response: string,
  providedContext: Record<string, any>
): string[] {
  const hallucinations: string[] = []
  const lowerResponse = response.toLowerCase()

  // Padrões que indicam alucinação
  const hallucinationPatterns = [
    {
      pattern: /vejo que você tem|vi que você|noto que você/i,
      check: () => {
        // Verificar se realmente tem dados no contexto
        const hasUserDeals = providedContext.userDeals && providedContext.userDeals.total > 0
        const hasDeal = !!providedContext.deal

        if (!hasUserDeals && !hasDeal && lowerResponse.includes('deal')) {
          return 'Presumiu que usuário tem deals sem contexto'
        }
        return null
      }
    },
    {
      pattern: /seus \d+ (deals|negócios|clientes)/i,
      check: () => {
        const match = response.match(/seus (\d+) (deals|negócios|clientes)/i)
        if (match) {
          const number = parseInt(match[1])
          const actualCount = providedContext.userDeals?.total || 0
          if (number !== actualCount) {
            return `Inventou número de ${match[2]}: disse ${number}, real é ${actualCount}`
          }
        }
        return null
      }
    }
  ]

  for (const { pattern, check } of hallucinationPatterns) {
    if (pattern.test(response)) {
      const issue = check()
      if (issue) {
        hallucinations.push(issue)
      }
    }
  }

  return hallucinations
}
