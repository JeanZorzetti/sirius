# SEO AI Assistant com Web Browsing - Setup Guide

Este guia explica como configurar o **SEO AI Assistant** com capacidades de pesquisa web em tempo real usando **Tavily**.

---

## 📋 Pré-requisitos

1. **Tavily API Key** (para web search)
2. **Groq API Key** (para tool calling com Llama 3.3 70B)

---

## 🔑 1. Obter API Keys

### Tavily API (Web Search)

1. Acesse: [https://tavily.com](https://tavily.com)
2. Crie uma conta gratuita
3. Vá para Dashboard → API Keys
4. Copie sua API key (formato: `tvly-XXXXXXXXXX`)

**Free Tier**:
- 1,000 pesquisas/mês grátis
- `search_depth: advanced`
- 5 resultados por pesquisa

### Groq API

1. Acesse: [https://console.groq.com/keys](https://console.groq.com/keys)
2. Faça login ou crie uma conta
3. Clique em "Create API Key"
4. Copie a key (formato: `gsk_XXXXXXXXXX`)

**Modelo usado**: `llama-3.3-70b-versatile` (GRATUITO, excelente para tool calling)

**Custo estimado**:
- **GRÁTIS** (rate limit: 30 req/min, 14400 tokens/min)
- Performance comparável ao GPT-4o-mini
- Sem custos por conversa

---

## ⚙️ 2. Configurar Variáveis de Ambiente

Adicione as seguintes linhas ao seu arquivo `.env`:

```bash
# Tavily (Web Search for AI Agents)
TAVILY_API_KEY="tvly-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Groq (LLM provider - usado no AGI + SEO Assistant)
GROQ_API_KEY="gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

**IMPORTANTE**: Nunca commite o arquivo `.env`! Ele já está no `.gitignore`.

---

## 🚀 3. Instalar Dependências

As dependências já foram adicionadas ao `package.json`. Para instalar:

```bash
npm install
```

Pacotes instalados:
- `@tavily/core` - Tavily SDK
- `zod` - Schema validation
- `ai` - Vercel AI SDK
- `@ai-sdk/groq` - Groq provider para AI SDK

---

## 🧪 4. Testar a Configuração

### Testar Tavily

```bash
curl -X POST https://api.tavily.com/search \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_TAVILY_KEY",
    "query": "best crm 2024",
    "max_results": 3
  }'
```

Resposta esperada: JSON com `results` array.

### Testar Groq

```bash
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer YOUR_GROQ_KEY"
```

Resposta esperada: Lista de modelos disponíveis (incluindo llama-3.3-70b-versatile).

---

## 🎯 5. Como Funciona

### Arquitetura

```
User Message
    ↓
/api/chat/seo (POST)
    ↓
[Auth + Usage Check]
    ↓
Vercel AI SDK: streamText()
    ├── Model: llama-3.3-70b-versatile (Groq)
    ├── System Prompt: SEO Specialist + GSC Context
    └── Tools: { searchWeb }
    ↓
LLM decide se precisa de tool
    ├─ NO → Responde direto
    └─ YES → Executa searchWeb
           ↓
       Tavily API (search_depth: advanced)
           ↓
       Resultados retornam ao LLM
           ↓
       LLM analisa e responde
    ↓
Stream Response (Server-Sent Events)
    ↓
Frontend: useChat hook renderiza tool UI
```

### Tool Execution Flow

1. **User pergunta**: "Quem está rankeando para 'CRM imobiliário'?"
2. **LLM decide**: "Preciso pesquisar na web"
3. **Tool call**: `searchWeb({ query: "top ranking crm imobiliario" })`
4. **Tavily busca**: 5 resultados com títulos, URLs, snippets
5. **LLM analisa**: "Encontrei 3 concorrentes..."
6. **Frontend mostra**: Card azul com resultados + análise

---

## 💡 6. Exemplos de Uso

### Exemplo 1: Benchmarking de Concorrentes

**User**: "Pesquise na web quem está rankeando para 'CRM' e compare comigo"

**Tool Call**:
```json
{
  "tool": "searchWeb",
  "args": { "query": "top crm software 2024 ranking" }
}
```

**Response IA**:
```
🌐 Pesquisei na web: "top crm software 2024 ranking"

Encontrei 5 concorrentes principais:

1. **Salesforce** - Posição #1
   - Title: "Best CRM Software 2024 | Salesforce"
   - CTR estimado: 42%

2. **HubSpot** - Posição #2
   - Title: "Free CRM for Small Business | HubSpot"
   - CTR estimado: 28%

...

**Análise**: Você está na posição #8 para "CRM".
Para competir, considere:
- Adicionar "Free" no título (HubSpot faz isso)
- Incluir ano no meta description
```

### Exemplo 2: Análise de SERP

**User**: "Verifique os títulos dos top 3 para 'software gestão imóveis'"

**Tool Call**:
```json
{
  "tool": "searchWeb",
  "args": { "query": "software gestão imóveis -anúncio" }
}
```

**Response IA**:
```
Analisei os top 3 resultados:

| Posição | Título | CTR Pattern |
|---------|--------|-------------|
| #1 | "Software Gestão Imobiliária - 15 Dias Grátis" | Trial offer |
| #2 | "Top 10 Melhores Softwares Imóveis 2024" | List + Year |
| #3 | "Gestão de Imóveis: Tudo em 1 Plataforma" | Value prop |

**Recomendação**: Seus títulos não têm trial offers. Adicione "Teste Grátis 14 Dias".
```

---

## 🐛 7. Troubleshooting

### Erro: "Failed to get response from Tavily"

**Causa**: API key inválida ou limite atingido.

**Solução**:
1. Verifique se `TAVILY_API_KEY` está correto no `.env`
2. Acesse [tavily.com/dashboard](https://tavily.com/dashboard) e verifique usage
3. Se atingiu limite gratuito, upgrade para paid

### Erro: "Groq API error: 401"

**Causa**: API key inválida.

**Solução**:
1. Verifique se `GROQ_API_KEY` está correto no `.env`
2. Acesse [console.groq.com/keys](https://console.groq.com/keys)
3. Verifique se a key não expirou (recriar se necessário)

### Tool não está sendo chamada

**Causa**: Pergunta muito vaga ou contexto suficiente no GSC.

**Solução**: Use frases explícitas:
- ✅ "**Pesquise na web** quem está rankeando para X"
- ✅ "Verifique **na SERP** quem é o #1 para Y"
- ❌ "Quem são os concorrentes?" (muito vago)

---

## 📊 8. Monitoramento de Custos

### Tavily

- Limite Free: 1,000 searches/mês
- Monitorar em: [tavily.com/dashboard](https://tavily.com/dashboard)

### Groq

- **GRÁTIS** (rate limit: 30 req/min, 14400 tokens/min)
- Sem custos por conversa
- Monitorar em: [console.groq.com](https://console.groq.com)

**Vantagem**: Zero custo de LLM! Apenas Tavily (1000 searches grátis/mês).

---

## 🔒 9. Segurança

### Rate Limiting

O endpoint `/api/chat/seo` já usa:
- Auth check (getSession)
- AGI usage limits (canUseAGI)
- Per-user quotas (FREE: 50K tokens/mês, PRO: 500K tokens/mês)

### API Key Protection

- ✅ Keys no `.env` (nunca commitadas)
- ✅ Server-side only (não expostas ao cliente)
- ✅ Verificar `.gitignore` inclui `.env`

---

## 📚 10. Recursos Adicionais

- [Tavily Docs](https://docs.tavily.com)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Groq Tool Calling Guide](https://console.groq.com/docs/tool-use)

---

## ✅ Checklist de Setup

- [ ] Tavily API key obtida e configurada
- [ ] Groq API key obtida e configurada
- [ ] Dependências instaladas (`npm install`)
- [ ] `.env` atualizado com ambas as keys
- [ ] Testado endpoint `/api/chat/seo`
- [ ] Rate limits verificados (Groq: 30 req/min)

---

**Status**: Pronto para uso em produção! 🚀
