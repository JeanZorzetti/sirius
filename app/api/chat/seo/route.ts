/**
 * SEO AI Assistant with Web Browsing - Chat API Route
 *
 * POST /api/chat/seo
 * Chat endpoint with tool calling (Tavily web search) for SEO analysis
 */

import { NextRequest } from 'next/server';
import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { tavily } from '@tavily/core';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const session = await getSession();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Get user and organization
    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user || !user.organization) {
      return new Response(JSON.stringify({ error: 'Usuário ou organização não encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const plan = user.organization.plan as 'FREE' | 'PRO';

    // 3. Check usage limits
    const usageCheck = await canUseAGI(
      user.organizationId,
      user.id,
      plan
    );

    if (!usageCheck.allowed) {
      return new Response(
        JSON.stringify({ error: usageCheck.reason || 'Limite de uso atingido' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Parse request
    const body: ChatRequest = await req.json();
    const { message, context } = body;

    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Mensagem não pode estar vazia' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. Build SEO specialist system prompt with context
    const seoSystemPrompt = `Você é o Head de SEO da Sirius CRM. Sua missão é analisar dados brutos do Google Search Console e dar conselhos táticos para aumentar tráfego orgânico sem gastar em ads.

${context ? `
CONTEXTO ATUAL (Google Search Console):
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

7. **IMPORTANTE - Web Search**: Você tem acesso a uma ferramenta 'searchWeb'. Use quando:
   - Usuário perguntar sobre concorrentes específicos
   - Precisar verificar posições na SERP em tempo real
   - Quiser analisar snippets/titles dos top 3 resultados
   - Buscar volume de busca ou tendências atuais

IMPORTANTE: Você tem acesso aos dados REAIS do GSC acima. Use-os nas suas respostas.`;

    // 6. Initialize Tavily client
    const tv = tavily({ apiKey: process.env.TAVILY_API_KEY! });

    // 7. Stream response with tool calling
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: seoSystemPrompt,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      tools: {
        searchWeb: tool({
          description: 'Pesquisa o Google para analisar concorrentes, verificar posições na SERP ou buscar volumes de busca atuais. Use isso quando precisar de dados externos que não estão no contexto do GSC.',
          parameters: z.object({
            query: z.string().describe('A query de busca otimizada para encontrar a informação necessária (ex: "site:competitor.com pricing" ou "top ranking crm imobiliario")'),
          }),
          execute: async ({ query }) => {
            console.log('[Tavily] Searching:', query);

            try {
              const searchResult = await tv.search(query, {
                search_depth: 'advanced',
                max_results: 5,
                include_answer: true,
                include_raw_content: false,
              });

              // Format results for the AI
              const formattedResults = {
                answer: searchResult.answer,
                results: searchResult.results.map((r: any) => ({
                  title: r.title,
                  url: r.url,
                  snippet: r.content?.substring(0, 300) || '',
                  score: r.score,
                })),
              };

              console.log('[Tavily] Found:', formattedResults.results.length, 'results');

              return formattedResults;
            } catch (error) {
              console.error('[Tavily] Error:', error);
              return {
                error: 'Não foi possível realizar a pesquisa web',
                details: error instanceof Error ? error.message : 'Unknown error',
              };
            }
          },
        }),
      },
      maxSteps: 5, // Allow multiple tool calls
      temperature: 0.7,
    });

    // 8. Track token usage (approximation for now)
    result.then(async (finalResult) => {
      const estimatedTokens = Math.ceil((message.length + seoSystemPrompt.length) / 3);
      await recordUsage(user.organizationId, user.id, estimatedTokens, plan);
    }).catch((error) => {
      console.error('Error recording usage:', error);
    });

    // 9. Return streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('SEO Chat Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Erro ao processar mensagem',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
