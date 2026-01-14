/**
 * AGI Sirius - Brain Module
 * 
 * TypeScript adaptation of the AGI Sirius Brain module.
 * Manages LLM communication via Ollama for sales intelligence.
 */

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface BrainConfig {
  ollamaHost: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface BrainResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

export class AgiBrain {
  private config: BrainConfig;
  private conversationHistory: Message[];
  private systemPrompt: string;

  constructor(config: BrainConfig) {
    this.config = config;
    this.conversationHistory = [];

    // System prompt especializado em vendas (versão otimizada)
    this.systemPrompt = `Você é Sirius, uma AGI especializada em Vendas e CRM.

EXPERTISE:
- Frameworks: BANT, MEDDIC, SPIN Selling, Challenger Sale
- Quebra de objeções (Preço, Timing, Autoridade, Concorrência)
- Análise de funil e métricas (CAC, LTV, Conversão)
- Scripts de vendas e playbooks

METODOLOGIA:
1. Diagnostique o contexto de vendas
2. Use o framework adequado
3. Seja objetiva e focada em resultados
4. Forneça respostas práticas e acionáveis

Você é a melhor consultora de vendas. Seja breve e precisa.`;

    this.addSystemMessage();
  }

  private addSystemMessage(): void {
    this.conversationHistory.push({
      role: 'system',
      content: this.systemPrompt,
    });
  }

  /**
   * Main thinking method - sends prompt to Ollama and returns response
   */
  async think(
    prompt: string,
    context?: Record<string, any>
  ): Promise<BrainResponse> {
    // Add context if provided
    let enhancedPrompt = prompt;
    if (context) {
      enhancedPrompt = `Contexto: ${JSON.stringify(context, null, 2)}\n\n${prompt}`;
    }

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: enhancedPrompt,
      timestamp: new Date().toISOString(),
    });

    // Prepare request to Ollama
    const messages = this.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      // Add timeout to prevent hanging with optimized connection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout

      // Optimize fetch with keep-alive for connection reuse
      const response = await fetch(`${this.config.ollamaHost}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=60, max=100',
        },
        signal: controller.signal,
        // @ts-ignore - Node.js specific options
        keepalive: true,
        body: JSON.stringify({
          model: this.config.model,
          messages,
          stream: false,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens,
            num_ctx: 2048, // Reduce context window to prevent OOM
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage = data.message.content;

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date().toISOString(),
      });

      // Estimate tokens used (Ollama doesn't provide exact count)
      const tokensUsed = this.estimateTokens(enhancedPrompt + assistantMessage);

      return {
        content: assistantMessage,
        tokensUsed,
        model: this.config.model,
      };
    } catch (error) {
      console.error('Error communicating with Ollama:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('AGI está demorando muito para responder. Por favor, tente novamente com uma pergunta mais simples ou contate o suporte.');
      }

      throw new Error(`Failed to get response from AGI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Streaming version of think() - returns AsyncGenerator for real-time responses
   */
  async *thinkStream(
    prompt: string,
    context?: Record<string, any>
  ): AsyncGenerator<string, void, unknown> {
    let enhancedPrompt = prompt;
    if (context) {
      enhancedPrompt = `Contexto: ${JSON.stringify(context, null, 2)}\n\n${prompt}`;
    }

    this.conversationHistory.push({
      role: 'user',
      content: enhancedPrompt,
      timestamp: new Date().toISOString(),
    });

    const messages = this.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const response = await fetch(`${this.config.ollamaHost}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          stream: true,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              const content = data.message.content;
              fullResponse += content;
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON lines
            console.warn('Failed to parse chunk:', line);
          }
        }
      }

      // Add complete response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in streaming:', error);
      throw new Error(`Failed to stream response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear conversation history (keep system prompt)
   */
  clearHistory(): void {
    this.conversationHistory = [];
    this.addSystemMessage();
  }

  /**
   * Get conversation history
   */
  getHistory(): Message[] {
    return [...this.conversationHistory];
  }

  /**
   * Check if Ollama is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.ollamaHost}/api/tags`, {
        method: 'GET',
      });

      if (!response.ok) return false;

      const data = await response.json();
      const models = data.models || [];
      const modelNames = models.map((m: any) => m.name);

      return modelNames.includes(this.config.model) ||
        modelNames.includes(`${this.config.model}:latest`);
    } catch {
      return false;
    }
  }

  /**
   * Estimate token count (rough approximation)
   * Average: 1 token ≈ 4 characters for English, ≈ 2.5 for Portuguese
   */
  private estimateTokens(text: string): number {
    // Using 3 characters per token as a middle ground
    return Math.ceil(text.length / 3);
  }
}

/**
 * Factory function to create Brain instance based on user plan
 */
export function createAgiBrain(plan: 'FREE' | 'PRO', modelOption?: 'option1' | 'option2'): AgiBrain {
  const ollamaHost = process.env.AGI_OLLAMA_HOST || 'http://localhost:11434';
  const temperature = parseFloat(process.env.AGI_TEMPERATURE || '0.7');

  let model: string;
  let maxTokens: number;

  if (plan === 'PRO') {
    model = process.env.AGI_MODEL_PRO || 'llama3.2:3b';
    maxTokens = parseInt(process.env.AGI_MAX_TOKENS_PRO || '2048');
  } else {
    // FREE plan - allow model selection
    if (modelOption === 'option2') {
      model = process.env.AGI_MODEL_FREE_OPTION_2 || 'gemma2:2b';
    } else {
      model = process.env.AGI_MODEL_FREE || 'llama3.2:1b';
    }
    maxTokens = parseInt(process.env.AGI_MAX_TOKENS_FREE || '1024');
  }

  return new AgiBrain({
    ollamaHost,
    model,
    temperature,
    maxTokens,
  });
}
