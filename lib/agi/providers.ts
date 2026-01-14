/**
 * AGI Provider Factory
 * Supports multiple LLM providers with automatic fallback
 */

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
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
            model: config.model, // e.g., 'llama-3.2-3b-preview'
            messages,
            temperature: config.temperature,
            max_tokens: config.maxTokens,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return {
        content,
        tokensUsed: data.usage?.total_tokens || Math.ceil(content.length / 3),
        provider: 'groq',
        model: config.model,
    };
}

/**
 * Main LLM call with automatic fallback
 */
export async function callLLM(
    messages: Array<{ role: string; content: string }>,
    userPlan: 'FREE' | 'PRO'
): Promise<LLMResponse> {
    const primaryProvider = (process.env.AGI_PRIMARY_PROVIDER as LLMProvider) || 'ollama';
    const fallbackProvider = (process.env.AGI_FALLBACK_PROVIDER as LLMProvider) || 'groq';

    // Primary config (Ollama)
    const primaryConfig: ProviderConfig = {
        provider: primaryProvider,
        baseUrl: process.env.AGI_OLLAMA_HOST || 'http://localhost:11434',
        model: userPlan === 'PRO'
            ? (process.env.AGI_MODEL_PRO || 'llama3.2:3b')
            : (process.env.AGI_MODEL_FREE || 'llama3.2:1b'),
        temperature: parseFloat(process.env.AGI_TEMPERATURE || '0.7'),
        maxTokens: userPlan === 'PRO' ? 2048 : 1024,
    };

    // Fallback config (Groq)
    const fallbackConfig: ProviderConfig = {
        provider: fallbackProvider,
        apiKey: process.env.GROQ_API_KEY,
        model: 'llama-3.2-3b-preview', // Groq's free model
        temperature: parseFloat(process.env.AGI_TEMPERATURE || '0.7'),
        maxTokens: userPlan === 'PRO' ? 2048 : 1024,
    };

    // Try primary provider first
    try {
        console.log(`[AGI] Trying primary provider: ${primaryProvider}`);

        if (primaryProvider === 'ollama') {
            return await callOllama(messages, primaryConfig);
        } else if (primaryProvider === 'groq') {
            return await callGroq(messages, primaryConfig);
        }

        throw new Error(`Unknown provider: ${primaryProvider}`);
    } catch (primaryError) {
        console.warn(`[AGI] Primary provider failed:`, primaryError);

        // Try fallback
        if (!process.env.GROQ_API_KEY && fallbackProvider === 'groq') {
            throw new Error('Ollama indisponível e Groq API key não configurada. Configure GROQ_API_KEY no Vercel.');
        }

        try {
            console.log(`[AGI] Trying fallback provider: ${fallbackProvider}`);

            if (fallbackProvider === 'groq') {
                return await callGroq(messages, fallbackConfig);
            } else if (fallbackProvider === 'ollama') {
                return await callOllama(messages, fallbackConfig);
            }

            throw new Error(`Unknown fallback provider: ${fallbackProvider}`);
        } catch (fallbackError) {
            console.error(`[AGI] Fallback provider also failed:`, fallbackError);
            throw new Error(`Todos os provedores de IA falharam. Tente novamente mais tarde.`);
        }
    }
}
