/**
 * AGI Diagnostic Endpoint
 * Tests Ollama performance and identifies bottlenecks
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { agiRateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
    const auth = await requireAuth()
    if (auth instanceof Response) return auth
    const diagnostics: any = {
        timestamp: new Date().toISOString(),
        tests: {},
        recommendations: [],
    };

    const ollamaHost = process.env.AGI_OLLAMA_HOST || 'http://localhost:11434';

    // Test 1: Basic connectivity
    try {
        const start1 = Date.now();
        const response = await fetch(`${ollamaHost}/api/tags`, {
            signal: AbortSignal.timeout(5000),
        });
        const duration1 = Date.now() - start1;

        diagnostics.tests.connectivity = {
            status: response.ok ? 'OK' : 'FAILED',
            duration: `${duration1}ms`,
            statusCode: response.status,
        };

        if (response.ok) {
            const data = await response.json();
            diagnostics.tests.modelsAvailable = {
                count: data.models?.length || 0,
                models: data.models?.map((m: any) => ({
                    name: m.name,
                    size: `${(m.size / 1024 / 1024 / 1024).toFixed(2)} GB`,
                })),
            };
        }
    } catch (error) {
        diagnostics.tests.connectivity = {
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
        diagnostics.recommendations.push('❌ Ollama não está acessível. Verifique se está rodando no VPS.');
        return NextResponse.json(diagnostics);
    }

    // Test 2: Simple inference (minimal prompt)
    try {
        const start2 = Date.now();
        const model = process.env.AGI_MODEL_FREE || 'llama3.2:1b';

        const response = await fetch(`${ollamaHost}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(50000),
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: 'Hi' }],
                stream: false,
                options: {
                    num_predict: 10, // Only 10 tokens
                },
            }),
        });

        const duration2 = Date.now() - start2;
        diagnostics.tests.simpleInference = {
            status: response.ok ? 'OK' : 'FAILED',
            duration: `${duration2}ms`,
            model,
        };

        if (duration2 > 10000) {
            diagnostics.recommendations.push(`⚠️ Resposta lenta (${duration2}ms). VPS pode estar sem recursos.`);
        } else if (duration2 > 5000) {
            diagnostics.recommendations.push(`⚠️ Resposta moderada (${duration2}ms). Considere otimizar VPS.`);
        } else {
            diagnostics.recommendations.push(`✅ Resposta rápida (${duration2}ms). Ollama está OK!`);
        }

        if (response.ok) {
            const data = await response.json();
            diagnostics.tests.simpleInference.response = data.message?.content || 'No content';
        }
    } catch (error) {
        diagnostics.tests.simpleInference = {
            status: 'TIMEOUT',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
        diagnostics.recommendations.push('❌ Timeout em inferência simples. VPS muito lento ou modelo não carregado.');
    }

    // Test 3: Check if model is loaded (via ps)
    try {
        const response = await fetch(`${ollamaHost}/api/ps`, {
            signal: AbortSignal.timeout(3000),
        });

        if (response.ok) {
            const data = await response.json();
            diagnostics.tests.loadedModels = {
                status: 'OK',
                models: data.models || [],
            };

            if (!data.models || data.models.length === 0) {
                diagnostics.recommendations.push('⚠️ Nenhum modelo carregado na memória. OLLAMA_KEEP_ALIVE pode não estar funcionando.');
            } else {
                diagnostics.recommendations.push(`✅ ${data.models.length} modelo(s) carregado(s) na memória.`);
            }
        }
    } catch (error) {
        diagnostics.tests.loadedModels = {
            status: 'ERROR',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }

    // Final Analysis
    if (diagnostics.recommendations.length === 0) {
        diagnostics.recommendations.push('✅ Todos os testes passaram!');
    }

    diagnostics.summary = {
        ollamaHost,
        allTestsPassed: !diagnostics.recommendations.some((r: string) => r.includes('❌')),
    };

    return NextResponse.json(diagnostics, { status: 200 });
}
