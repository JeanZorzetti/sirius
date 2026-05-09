import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireFeature, FeatureBlockedError } from '@/lib/feature-gates'
import logger from '@/lib/logger'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

/**
 * POST /api/tasks/analytics/summary
 *
 * Body: { kpis, comparison, rangeDays, projectName? }
 *
 * Gera um diagnóstico em linguagem natural via Groq (PRO+).
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404)
    }

    try {
      await requireFeature(user.organizationId, 'can_use_task_analytics')
    } catch (err) {
      if (err instanceof FeatureBlockedError) {
        return NextResponse.json({ error: 'Feature bloqueada', requiredTier: err.requiredTier }, { status: 403 })
      }
      throw err
    }

    const body = await request.json()
    const { kpis, comparison, rangeDays, projectName, overdueCount } = body

    if (!kpis) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const groqApiKey = process.env.GROQ_API_KEY
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Serviço de IA não configurado' }, { status: 503 })
    }

    // Monta prompt compacto com os dados
    const scope = projectName ? `projeto "${projectName}"` : 'toda a organização'
    const period = `últimos ${rangeDays} dias`

    const dataPrompt = `
Período: ${period} | Escopo: ${scope}

KPIs:
- Total de tarefas: ${kpis.total}
- Concluídas no período: ${kpis.completed} (${kpis.completionRate}% do total)
- Em progresso: ${kpis.inProgress}
- Atrasadas: ${kpis.overdue}
- Velocity: ${kpis.velocity} tasks/semana
- Tempo médio de conclusão: ${kpis.avgCompletionHours}h

Comparação com período anterior:
- Tarefas concluídas: ${comparison?.completed?.delta != null ? `${comparison.completed.delta > 0 ? '+' : ''}${comparison.completed.delta}%` : 'sem dados'}
- Tarefas criadas: ${comparison?.created?.delta != null ? `${comparison.created.delta > 0 ? '+' : ''}${comparison.created.delta}%` : 'sem dados'}
- Tarefas atrasadas: ${comparison?.overdue?.delta != null ? `${comparison.overdue.delta > 0 ? '+' : ''}${comparison.overdue.delta}%` : 'sem dados'}
- Tempo médio: ${comparison?.avgCompletionHours?.delta != null ? `${comparison.avgCompletionHours.delta > 0 ? '+' : ''}${comparison.avgCompletionHours.delta}%` : 'sem dados'}
`.trim()

    const systemPrompt = `Você é um analista de produtividade de times. Analise os dados de tarefas fornecidos e gere um diagnóstico curto (3-4 frases) em português brasileiro.

Seja direto e específico. Destaque o principal ponto positivo e o principal ponto de atenção. Termine com uma recomendação acionável concreta. Não use bullet points — escreva em prosa fluida.

Tom: profissional mas acessível, como um gestor experiente conversando com o time.`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: dataPrompt },
        ],
        temperature: 0.6,
        max_tokens: 300,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error({ err: errorText }, '[tasks/analytics/summary] Groq error')
      return await apiError(ERR.INTERNAL_ERROR, 502)
    }

    const data = await response.json()
    const summary = data.choices?.[0]?.message?.content?.trim() ?? ''

    if (!summary) {
      return NextResponse.json({ error: 'Resposta vazia da IA' }, { status: 502 })
    }

    return NextResponse.json({ summary })
  } catch (error) {
    logger.error({ err: error }, '[tasks/analytics/summary] error')
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
