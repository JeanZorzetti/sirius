/**
 * AGI Provider Factory
 * Supports multiple LLM providers with automatic fallback
 */

import logger from '@/lib/logger'

export type LLMProvider = 'ollama' | 'groq';

export interface ProviderConfig {
    provider: LLMProvider;
    apiKey?: string;
    baseUrl?: string;
    model: string;
    temperature: number;
    maxTokens: number;
}

export interface LLMResponse {
    content: string;
    tokensUsed: number;
    provider: LLMProvider;
    model: string;
}

/**
 * Call Ollama API
 */
async function callOllama(
    messages: Array<{ role: string; content: string }>,
    config: ProviderConfig
): Promise<LLMResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for Ollama

    try {
        const response = await fetch(`${config.baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Connection': 'keep-alive',
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: config.model,
                messages,
                stream: false,
                options: {
                    temperature: config.temperature,
                    num_predict: config.maxTokens,
                    num_ctx: 2048,
                },
            }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.message?.content || '';

        return {
            content,
            tokensUsed: Math.ceil(content.length / 3),
            provider: 'ollama',
            model: config.model,
        };
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Call Groq API (Fallback)
 */
async function callGroq(
    messages: Array<{ role: string; content: string }>,
    config: ProviderConfig
): Promise<LLMResponse> {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model,
                messages,
                temperature: config.temperature,
                max_tokens: config.maxTokens,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Groq] API Error:', errorText);
            throw new Error(`Groq API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        if (!content) {
            console.error('[Groq] Empty response:', data);
            throw new Error('Groq returned empty response');
        }

        logger.info({ model: config.model }, '[Groq] Success')

        return {
            content,
            tokensUsed: data.usage?.total_tokens || Math.ceil(content.length / 3),
            provider: 'groq',
            model: config.model,
        };
    } catch (error) {
        console.error('[Groq] Error:', error);
        throw error;
    }
}

/**
 * Main LLM call with automatic fallback
 */
export async function callLLM(
    messages: Array<{ role: string; content: string }>,
    userPlan: 'FREE' | 'PRO'
): Promise<LLMResponse> {
    // Use Groq as primary (fast, free, powerful!)
    const primaryProvider = 'groq';
    const fallbackProvider = 'groq'; // Use different Groq model as fallback

    // Primary config - Groq Llama 3.3 70B (BEST!)
    const primaryConfig: ProviderConfig = {
        provider: primaryProvider,
        apiKey: process.env.GROQ_API_KEY,
        model: userPlan === 'PRO'
            ? 'llama-3.3-70b-versatile'  // 70B for PRO users
            : 'llama-3.3-70b-versatile', // Same model for FREE (it's fast enough!)
        temperature: parseFloat(process.env.AGI_TEMPERATURE || '0.7'),
        maxTokens: userPlan === 'PRO' ? 2048 : 1024,
    };

    // Fallback config - Llama 4 Scout (if 70B fails)
    const fallbackConfig: ProviderConfig = {
        provider: fallbackProvider,
        apiKey: process.env.GROQ_API_KEY,
        model: 'llama-3.2-1b-preview', // Lightweight fallback
        temperature: parseFloat(process.env.AGI_TEMPERATURE || '0.7'),
        maxTokens: userPlan === 'PRO' ? 2048 : 1024,
    };

    // Try primary provider first
    try {
        logger.info({ model: primaryConfig.model }, '[AGI] Using Groq')

        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY não configurada. Configure no Vercel.');
        }

        return await callGroq(messages, primaryConfig);
    } catch (primaryError) {
        logger.warn({ err: primaryError }, '[AGI] Primary model failed, trying fallback')

        try {
            logger.info({ model: fallbackConfig.model }, '[AGI] Trying fallback')
            return await callGroq(messages, fallbackConfig);
        } catch (fallbackError) {
            console.error(`[AGI] All providers failed:`, fallbackError);
            throw new Error(`Serviço de IA temporariamente indisponível. Configure GROQ_API_KEY no Vercel.`);
        }
    }
}
