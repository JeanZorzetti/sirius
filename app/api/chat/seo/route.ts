/**
 * SEO AI Assistant - Chat API Route
 *
 * POST /api/chat/seo
 * Chat endpoint for conversing with SEO AI specialist with GSC + ML context
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAgiBrain } from '@/lib/agi/brain';
import { canUseAGI, recordUsage } from '@/lib/agi/usage';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface SeoContext {
  history?: Array<{
    date: string;
    clicks: number;
    impressions: number;
  }>;
  keywords?: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  forecast?: {
    trends: {
      clicks: string;
      impressions: string;
    };
    velocity: {
      clicks: number;
      impressions: number;
    };
    predictedTotal: {
      clicks: number;
      impressions: number;
      clicksFromEfficiency: number;
    };
    confidence: {
      clicks: number;
      impressions: number;
    };
    efficiency: {
      currentRatio: number;
      trend: string;
      forecastNext30d: number;
    };
  };
  totals?: {
    clicks: number;
    impressions: number;
    ctr: number;
  };
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

interface ChatRequest {
  message: string;
  context?: SeoContext;
  modelOption?: 'option1' | 'option2';
  stream?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 2. Get user and organization
    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user || !user.organization) {
      return NextResponse.json(
        { error: 'Usuário ou organização não encontrada' },
        { status: 404 }
      );
    }

    const plan = user.organization.plan as 'FREE' | 'PRO';

    // 3. Check usage limits
    const usageCheck = await canUseAGI(
      user.organizationId,
      user.id,
      plan
    );

    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: usageCheck.reason || 'Limite de uso atingido' },
        { status: 429 }
      );
    }

    // 4. Parse request
    const body: ChatRequest = await req.json();
    const { message, context, modelOption, stream = false } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Mensagem não pode estar vazia' },
        { status: 400 }
      );
    }

    // 5. Build SEO specialist system prompt
    const seoSystemPrompt = `Você é o Head de SEO da Sirius CRM. Sua missão é analisar dados brutos do Google Search Console e dar conselhos táticos para aumentar tráfego orgânico sem gastar em ads.

CONTEXTO ATUAL (Google Search Console):
${context ? `
- Período: ${context.dateRange?.startDate} até ${context.dateRange?.endDate}
- Total de Cliques: ${context.totals?.clicks?.toLocaleString('pt-BR')}
- Total de Impressões: ${context.totals?.impressions?.toLocaleString('pt-BR')}
- CTR Médio: ${context.totals?.ctr?.toFixed(2)}%

ANÁLISE DE EFICIÊNCIA:
- Custo de Visibilidade Atual: ${context.forecast?.efficiency.currentRatio} impressões por clique
- Tendência: ${context.forecast?.efficiency.trend}
- Previsão 30 dias: ${context.forecast?.efficiency.forecastNext30d} impressões/clique

PREVISÃO ML (Próximos 30 dias):
- Tendência de Cliques: ${context.forecast?.trends.clicks} (velocidade: ${context.forecast?.velocity.clicks}/dia)
- Tendência de Impressões: ${context.forecast?.trends.impressions} (velocidade: ${context.forecast?.velocity.impressions}/dia)
- Previsão ML Direta: ${context.forecast?.predictedTotal.clicks?.toLocaleString('pt-BR')} cliques
- Previsão via Eficiência: ${context.forecast?.predictedTotal.clicksFromEfficiency?.toLocaleString('pt-BR')} cliques
- Confiança do Modelo: Cliques ${context.forecast?.confidence.clicks}%, Impressões ${context.forecast?.confidence.impressions}%

TOP KEYWORDS:
${context.keywords?.slice(0, 10).map((k, i) =>
  `${i + 1}. "${k.query}" - ${k.clicks} cliques, ${k.impressions} imp, CTR ${k.ctr?.toFixed(2)}%, Pos ${k.position?.toFixed(1)}`
).join('\n')}
` : 'Nenhum dado disponível'}

DIRETRIZES:
1. Analise a métrica de "Efficiency Ratio" (Impressões/Clique):
   - Se estiver subindo: Alerte sobre CTR baixo ou keywords irrelevantes
   - Se estiver caindo: Parabenize pela melhoria na qualidade

2. Use os dados de Forecast para validar se a estratégia atual está funcionando:
   - Compare ML Direta vs Via Eficiência (divergência indica problema)
   - Velocidade negativa = ação urgente necessária

3. Seja direto e técnico. Não use clichês como "O conteúdo é rei":
   - ❌ "Você precisa melhorar seu conteúdo"
   - ✅ "A keyword 'X' tem 5000 impressões mas apenas 50 cliques (CTR 1%). Mude o título para incluir benefício claro"

4. Use formatação Markdown para facilitar leitura:
   - Tabelas para comparações
   - **Negrito** para métricas importantes
   - Bullets para ações

5. Benchmarks (use conhecimento de mercado):
   - CTR médio página 1: 28-35%
   - CTR posição #1: 39-45%
   - CTR posição #3: 18-22%
   - Efficiency Ratio bom: <100 para SaaS B2B

6. Sempre sugira 2-3 ações específicas e mensuráveis.

IMPORTANTE: Você tem acesso aos dados REAIS acima. Use-os nas suas respostas.`;

    // 6. Initialize AGI Brain with SEO system prompt
    const brain = createAgiBrain(plan, modelOption);

    // Inject SEO system prompt (we'll override the default sales prompt)
    brain['systemPrompt'] = seoSystemPrompt;

    // 7. Prepare enhanced context with SEO data
    const enhancedContext: Record<string, any> = {
      seo: context,
    };

    // 8. Check if streaming is requested
    if (stream) {
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            let fullResponse = '';

            for await (const chunk of brain.thinkStream(message, enhancedContext)) {
              fullResponse += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
            }

            // Record usage
            const tokensUsed = brain['estimateTokens'](message + fullResponse);
            await recordUsage(user.organizationId, user.id, tokensUsed, plan);

            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // 9. Non-streaming response
    const response = await brain.think(message, enhancedContext);

    // 10. Record usage
    await recordUsage(
      user.organizationId,
      user.id,
      response.tokensUsed,
      plan
    );

    // 11. Return response
    return NextResponse.json({
      message: response.content,
      model: response.model,
    });
  } catch (error) {
    console.error('SEO Chat Error:', error);

    if (error instanceof Error && error.message.includes('Failed to get response')) {
      return NextResponse.json(
        {
          error: 'Não foi possível conectar ao servidor de IA. Verifique se o Ollama está rodando.',
          details: error.message,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao processar mensagem',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
