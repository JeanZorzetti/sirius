# Generative UI - Sistema de Interface Fluida para Sirius CRM

## 📋 Visão Geral

Sistema completo de **Generative UI** que permite ao AGI Sirius renderizar componentes React dinâmicos durante conversas de vendas. O AI decide **quando** e **qual** componente usar para melhor apoiar o argumento de venda.

**Status:** ✅ Fase 1 Completa (Fundação)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  MessageRenderer                                  │   │
│  │  ├─ TextChunk (Markdown)                         │   │
│  │  ├─ UIComponentChunk (Dynamic)                   │   │
│  │  └─ ThinkingChunk                                │   │
│  │                                                    │   │
│  │  DynamicUIComponent                               │   │
│  │  └─ Lazy loads components from registry          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ Streaming (text + UI metadata)
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND                               │
│  POST /api/agi/chat-with-ui                             │
│  ├─ Vercel AI SDK (streamText)                          │
│  ├─ Tool: render_ui_component                           │
│  └─ Transforms: text | ui_component | thinking          │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ Component metadata
                          ▼
┌─────────────────────────────────────────────────────────┐
│              COMPONENT REGISTRY                          │
│  10 components definidos:                               │
│  - ROICalculator                                        │
│  - DealFormGenerator                                    │
│  - PricingComparison                                    │
│  - ScriptPreview                                        │
│  - DemoScheduler                                        │
│  - QualificationDashboard                               │
│  - CompetitorMatrix                                     │
│  - OnboardingTimeline                                   │
│  - InsightCard                                          │
│  - EmailPreview                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Estrutura de Arquivos

### Backend (`/lib/generative-ui/`)

```
lib/generative-ui/
├── types.ts                    # TypeScript types
├── schemas.ts                  # Zod schemas (10 componentes)
├── component-registry.ts       # Registry completo
├── index.ts                    # Exports centralizados
└── README.md                   # Esta documentação
```

### AI Tools (`/lib/agi/`)

```
lib/agi/
├── tools/
│   └── render-ui-tool.ts      # AI tool para renderizar UI
└── prompts/
    └── generative-ui-prompt.ts # System prompt com instruções
```

### API Routes (`/app/api/`)

```
app/api/agi/
└── chat-with-ui/
    └── route.ts               # Endpoint com streaming
```

### Frontend Components (`/components/generative-ui/`)

```
components/generative-ui/
├── ComponentSkeleton.tsx      # 9 variants de loading states
├── DynamicUIComponent.tsx     # Renderer dinâmico
├── ThinkingIndicator.tsx      # Estados de "pensando"
├── MessageRenderer.tsx        # Renderiza mensagens completas
└── index.ts                   # Exports
```

---

## 🚀 Como Usar

### 1. Usando o Endpoint de API

```typescript
// Frontend
const response = await fetch('/api/agi/chat-with-ui', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Quanto eu economizo com o Sirius?' }
    ],
    sessionId: 'optional-session-id',
    context: {
      dealId: 'optional-deal-id',
    },
  }),
})

// Streaming response
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = JSON.parse(decoder.decode(value)) as StreamChunk

  if (chunk.type === 'ui_component') {
    // Renderizar componente
    console.log('Component:', chunk.name, chunk.props)
  }
}
```

### 2. Usando MessageRenderer

```tsx
import { MessageRenderer } from '@/components/generative-ui'

function ChatMessage({ chunks }) {
  return (
    <MessageRenderer
      chunks={chunks}
      onInteraction={(data) => {
        // Track interações com componentes
        console.log('User interagiu:', data)
      }}
    />
  )
}
```

### 3. Validando Props de Componente

```typescript
import { validateComponentProps } from '@/lib/generative-ui'

const validation = validateComponentProps('ROICalculator', {
  scenario: {
    currentCost: 15000,
    withSirius: 8000,
    monthlySavings: 7000,
    annualROI: 84000,
    paybackPeriod: 2,
  },
})

if (!validation.valid) {
  console.error(validation.error)
}
```

---

## 🧩 Componentes Disponíveis

### 1. ROICalculator

**Quando usar:** Usuário questiona custo/investimento

**Props:**
```typescript
{
  scenario: {
    currentCost: number
    withSirius: number
    monthlySavings: number
    annualROI: number
    paybackPeriod: number
  },
  industry?: 'orthodontics' | 'retail' | 'services' | ...
  comparisonMode?: boolean
}
```

---

### 2. DealFormGenerator

**Quando usar:** Usuário qualificado, pronto para criar deal

**Props:**
```typescript
{
  prefill?: {
    title?: string
    value?: number
    closeDate?: string // ISO
    contactId?: string
  },
  suggestedTags?: string[]
  aiNotes?: string
  quickCreate?: boolean
}
```

---

### 3. PricingComparison

**Quando usar:** Usuário pergunta sobre planos/preços

**Props:**
```typescript
{
  highlighted: 'free' | 'pro'
  emphasize_features?: string[]
  show_roi_badge?: boolean
  annual_savings?: number
}
```

---

### 4. DemoScheduler

**Quando usar:** Lead qualificado quer agendar demo

**Props:**
```typescript
{
  eventType: 'demo_30min' | 'demo_60min' | 'onboarding_call'
  prefill?: {
    name?: string
    email?: string
    company?: string
  }
  autoTriggerCRM?: boolean
}
```

---

*(Outros 6 componentes documentados em `docs/GENERATIVE_UI_ARCHITECTURE.md`)*

---

## ⚙️ Configuração

### Variáveis de Ambiente Necessárias

```env
# LLM Provider (Groq)
GROQ_API_KEY=your-groq-api-key

# Database (para salvar conversas)
DATABASE_URL=your-postgres-url

# NextAuth (para autenticação)
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
```

### Dependências

Todas as dependências já estão instaladas:

- ✅ `@ai-sdk/groq` - LLM provider
- ✅ `ai` - Vercel AI SDK
- ✅ `zod` - Schema validation
- ✅ `react-markdown` - Markdown rendering
- ✅ `framer-motion` - Animations

---

## 🧪 Testando

### Teste Manual via cURL

```bash
curl -X POST http://localhost:3000/api/agi/chat-with-ui \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "messages": [
      {"role": "user", "content": "Quanto eu economizo?"}
    ]
  }'
```

### Teste de Validação de Props

```typescript
import { validateComponentProps } from '@/lib/generative-ui'

// Válido ✅
const valid = validateComponentProps('ROICalculator', {
  scenario: { currentCost: 15000, withSirius: 8000, ... }
})

// Inválido ❌
const invalid = validateComponentProps('ROICalculator', {
  scenario: { currentCost: -100 } // Negativo = erro
})

console.log(invalid.error) // "currentCost must be positive"
```

---

## 📊 Status da Implementação

### ✅ Fase 1: Fundação (COMPLETA)

- [x] Tipos TypeScript
- [x] Schemas Zod (10 componentes)
- [x] Component Registry
- [x] AI Tool `render_ui_component`
- [x] System Prompt Generative UI
- [x] Endpoint `/api/agi/chat-with-ui`
- [x] ComponentSkeleton (9 variants)
- [x] DynamicUIComponent
- [x] ThinkingIndicator
- [x] MessageRenderer

### ⏳ Fase 2: Componentes Core (PRÓXIMA)

- [ ] Implementar ROICalculator
- [ ] Implementar DealFormGenerator
- [ ] Implementar DemoScheduler
- [ ] Integrar com backend (APIs de deal, calendly)
- [ ] Analytics tracking

### ⏳ Fase 3-6: Ver Roadmap Completo

Consulte `docs/GENERATIVE_UI_ARCHITECTURE.md` para roadmap completo.

---

## 🔧 Troubleshooting

### Erro: "Component not found in registry"

**Causa:** Nome do componente incorreto ou typo.

**Solução:**
```typescript
import { getComponentNames } from '@/lib/generative-ui'
console.log(getComponentNames()) // Lista todos disponíveis
```

---

### Erro: "Props validation failed"

**Causa:** Props não atendem ao schema Zod.

**Solução:**
```typescript
// Ver schema completo
import { ROICalculatorPropsSchema } from '@/lib/generative-ui'
console.log(ROICalculatorPropsSchema.shape)
```

---

### AI não está renderizando componentes

**Checklist:**
1. Endpoint correto? (`/api/agi/chat-with-ui`)
2. GROQ_API_KEY configurado?
3. System prompt inclui Generative UI? (automático no endpoint)
4. Tool `render_ui_component` registrado? (sim, no endpoint)
5. Contexto suficiente? (AI precisa de dados para props)

---

## 📚 Recursos Adicionais

- **Arquitetura Completa:** [docs/GENERATIVE_UI_ARCHITECTURE.md](../../docs/GENERATIVE_UI_ARCHITECTURE.md)
- **Vercel AI SDK:** https://sdk.vercel.ai/docs
- **Zod Documentation:** https://zod.dev/

---

## 👥 Contribuindo

### Adicionando Novo Componente

1. **Criar Schema:** Em `schemas.ts`
2. **Adicionar ao Registry:** Em `component-registry.ts`
3. **Implementar Componente:** Em `/components/generative-ui/[NomeComponente].tsx`
4. **Testar Props:** Via `validateComponentProps()`
5. **Atualizar Docs:** Adicionar exemplo de uso

---

## 🐛 Reportando Bugs

Abra issue no GitHub com:
- Versão do Next.js
- Mensagem de erro completa
- Props que causaram o erro
- Steps to reproduce

---

**Última atualização:** 2026-01-31
**Versão:** 1.0 (Fase 1 Completa)
