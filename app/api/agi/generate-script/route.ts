/**
 * AGI Sirius - Script Generation API Route
 * 
 * POST /api/agi/generate-script
 * Generates sales scripts (cold call, cold email, etc.)
 */

import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAgiBrain } from '@/lib/agi/brain';
import { canUseAGI, recordUsage } from '@/lib/agi/usage';
import { gerarPerguntasSPIN } from '@/lib/agi/skills';
import { agiRateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const maxDuration = 60;

type ScriptType = 'cold_call' | 'cold_email' | 'follow_up' | 'demo_pitch' | 'objection_handling';

interface GenerateScriptRequest {
    type: ScriptType;
    context: {
        product?: string;
        targetCompany?: string;
        targetRole?: string;
        industry?: string;
        painPoint?: string;
        dealId?: string;
    };
}

export async function POST(req: NextRequest) {
    try {
        // 1. Authentication
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { organization: true },
        });

        if (!user || !user.organization) {
            return NextResponse.json(
                { error: 'Usuário ou organização não encontrada' },
                { status: 404 }
            );
        }

        const plan = user.organization.plan as 'FREE' | 'PRO';

        // 2. Check usage limits
        const usageCheck = await canUseAGI(user.organizationId, user.id, plan);
        if (!usageCheck.allowed) {
            return NextResponse.json(
                { error: usageCheck.reason || 'Limite de uso atingido' },
                { status: 429 }
            );
        }

        // 3. Parse request
        const body: GenerateScriptRequest = await req.json();
        const { type, context } = body;

        if (!type) {
            return NextResponse.json(
                { error: 'Tipo de script é obrigatório' },
                { status: 400 }
            );
        }

        // 4. Load deal context if provided
        let dealContext: any = null;
        if (context.dealId) {
            const deal = await prisma.deal.findFirst({
                where: {
                    id: context.dealId,
                    organizationId: user.organizationId,
                },
                include: {
                    contact: true,
                    stage: true,
                },
            });

            if (deal) {
                dealContext = {
                    title: deal.title,
                    company: deal.contact?.company,
                    contactName: deal.contact?.name,
                    stage: deal.stage.name,
                };
            }
        }

        // 5. Build prompt based on script type & context
        let prompt = '';
        let additionalData: any = {};

        switch (type) {
            case 'cold_call':
                // Use SPIN skill for discovery questions
                if (context.industry && context.painPoint) {
                    const spinQuestions = gerarPerguntasSPIN(context.industry, context.painPoint);
                    additionalData.spinQuestions = spinQuestions;
                }

                prompt = `Crie um script de cold calling profissional para:

**Produto/Serviço:** ${context.product || 'Nosso produto'}
**Empresa Alvo:** ${dealContext?.company || context.targetCompany || 'Empresa prospect'}
**Cargo do Decisor:** ${context.targetRole || 'Decisor'}
**Indústria:** ${context.industry || 'Não especificada'}
**Dor Identificada:** ${context.painPoint || 'Otimização de processos'}

O script deve incluir:
1. Abertura impactante (primeiros 10 segundos)
2. Quebra de gelo / rapport
3. Perguntas SPIN para identificar dores
4. Apresentação breve de valor
5. Fechamento com next step claro

Tom: Consultivo, não agressivo. Objetivo: agendar reunião de discovery.`;
                break;

            case 'cold_email':
                prompt = `Crie um cold email altamente personalizado para:

**Produto/Serviço:** ${context.product || 'Nosso produto'}
**Empresa Alvo:** ${dealContext?.company || context.targetCompany || 'Empresa prospect'}
**Cargo do Decisor:** ${context.targetRole || 'Decisor'}
**Indústria:** ${context.industry || 'Não especificada'}
**Dor Identificada:** ${context.painPoint || 'Não especificada'}

O email deve:
1. Assunto impactante (abaixo de 50 caracteres)
2. Primeira linha mostrando pesquisa sobre a empresa
3. Uma dor específica do cargo/indústria
4. Proposta de valor clara em 2 frases
5. CTA simples (agendar 15min de call)

Máximo: 150 palavras. Tom: Direto e consultivo.`;
                break;

            case 'follow_up':
                prompt = `Crie um email de follow-up para:

**Contexto:** ${dealContext ? `Deal "${dealContext.title}" em estágio "${dealContext.stage}"` : 'Contato anterior'}
**Empresa:** ${dealContext?.company || context.targetCompany || 'Prospect'}
**Contato:** ${dealContext?.contactName || 'Lead'}

O follow-up deve:
1. Referenciar a interação anterior
2. Adicionar valor novo (insight, case, conteúdo)
3. Reforçar próximo passo
4. Ser breve (máx 100 palavras)

Tom: Amigável mas profissional.`;
                break;

            case 'demo_pitch':
                prompt = `Crie um pitch estruturado para demo/apresentação:

**Produto:** ${context.product || 'Nosso produto'}
**Audiência:** ${context.targetRole || 'Stakeholders'}
**Indústria:** ${context.industry || 'Não especificada'}
**Dor Principal:** ${context.painPoint || 'Eficiência operacional'}

Estrutura do pitch (15-20 minutos):
1. Abertura: Estado atual vs Estado desejado
2. Problema: Dores do dia a dia
3. Solução: Como resolvemos (3 features-chave)
4. Prova: Case de sucesso similar
5. Próximos passos: Proposta ou trial

Inclua perguntas para manter engajamento.`;
                break;

            case 'objection_handling':
                prompt = `Crie respostas para objeções comuns em vendas de:

**Produto:** ${context.product || 'Nosso produto'}
**Objeção Principal:** ${context.painPoint || 'Preço alto'}

Forneça respostas estruturadas para:
1. "Está muito caro"
2. "Não é o momento certo"
3. "Já temos uma solução"
4. "Preciso pensar / falar com a equipe"

Use técnicas: Feel-Felt-Found, Isolamento, Redefinição.
Seja natural, não robotizado.`;
                break;
        }

        // 6. Generate script using AGI
        const brain = createAgiBrain(plan);
        const response = await brain.think(prompt);

        // 7. Record usage
        await recordUsage(user.organizationId, user.id, response.tokensUsed, plan);

        // 8. Return script
        return NextResponse.json({
            type,
            script: response.content,
            additionalData,
            tokensUsed: response.tokensUsed,
            model: response.model,
        });
    } catch (error) {
        logger.error({ err: error }, 'Script Generation Error');
        return NextResponse.json(
            {
                error: 'Erro ao gerar script',
                details: error instanceof Error ? error.message : 'Erro desconhecido',
            },
            { status: 500 }
        );
    }
}
