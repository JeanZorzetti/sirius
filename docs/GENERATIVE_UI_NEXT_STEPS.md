# Generative UI - Próximos Passos

## ✅ Fase 1 - COMPLETA

Parabéns! A fundação do sistema de Generative UI está 100% implementada.

### O que foi entregue:

#### **Backend**
- ✅ Tipos TypeScript completos (`lib/generative-ui/types.ts`)
- ✅ 10 Schemas Zod para validação (`lib/generative-ui/schemas.ts`)
- ✅ Component Registry com helpers (`lib/generative-ui/component-registry.ts`)
- ✅ AI Tool `render_ui_component` (`lib/agi/tools/render-ui-tool.ts`)
- ✅ System Prompt Generative UI (`lib/agi/prompts/generative-ui-prompt.ts`)
- ✅ Endpoint `/api/agi/chat-with-ui` com streaming (`app/api/agi/chat-with-ui/route.ts`)

#### **Frontend**
- ✅ ComponentSkeleton com 9 variants (`components/generative-ui/ComponentSkeleton.tsx`)
- ✅ DynamicUIComponent com error boundaries (`components/generative-ui/DynamicUIComponent.tsx`)
- ✅ ThinkingIndicator para feedback visual (`components/generative-ui/ThinkingIndicator.tsx`)
- ✅ MessageRenderer completo (`components/generative-ui/MessageRenderer.tsx`)
- ✅ Exemplo de uso (ChatWithUIExample)

#### **Documentação**
- ✅ Arquitetura completa (`docs/GENERATIVE_UI_ARCHITECTURE.md`)
- ✅ README técnico (`lib/generative-ui/README.md`)
- ✅ Este guia de próximos passos

---

## 🧪 Testando a Fase 1

### 1. Verificar Instalação

```bash
# No diretório do projeto
cd "C:\Users\jeanz\OneDrive\Desktop\ROI Labs\CRM\crm-project"

# Verificar dependências
npm list @ai-sdk/groq ai zod react-markdown framer-motion

# Se alguma estiver faltando:
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie/atualize `.env.local`:

```env
# LLM Provider (Groq)
GROQ_API_KEY=your-groq-api-key-here

# Database (já deve estar configurado)
DATABASE_URL=postgresql://...

# NextAuth (já deve estar configurado)
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. Testar o Endpoint

**Opção A: Via cURL**

```bash
# Primeiro, faça login no sistema e pegue o cookie de sessão
# Depois teste:

curl -X POST http://localhost:3000/api/agi/chat-with-ui \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "messages": [
      {"role": "user", "content": "Quanto eu economizo com o Sirius?"}
    ]
  }'
```

**Opção B: Criar Página de Teste**

```tsx
// app/test-genui/page.tsx
import { ChatWithUIExample } from '@/components/generative-ui/examples/ChatWithUIExample'

export default function TestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Teste Generative UI</h1>
      <ChatWithUIExample />
    </div>
  )
}
```

Acesse: `http://localhost:3000/test-genui`

### 4. Testar Validação de Props

```typescript
// Abra o console do navegador (F12)
import { validateComponentProps } from '@/lib/generative-ui'

// Teste válido ✅
const valid = validateComponentProps('ROICalculator', {
  scenario: {
    currentCost: 15000,
    withSirius: 8000,
    monthlySavings: 7000,
    annualROI: 84000,
    paybackPeriod: 2
  }
})
console.log('Valid:', valid)

// Teste inválido ❌
const invalid = validateComponentProps('ROICalculator', {
  scenario: { currentCost: -100 } // Negativo = erro
})
console.log('Invalid:', invalid.error)
```

---

## 🚀 Fase 2 - Implementar Componentes Core

**Status:** ⏳ PRÓXIMA FASE

**Duração estimada:** 2-3 semanas (1 dev)

### Objetivos

Implementar os 3 componentes mais críticos para vendas:
1. **ROICalculator** - Demonstrar valor economizado
2. **DealFormGenerator** - Criar oportunidades rapidamente
3. **DemoScheduler** - Agendar demos inline

### Tarefas Detalhadas

#### **Tarefa 2.1: Implementar ROICalculator**

**Arquivo:** `components/generative-ui/ROICalculator.tsx`

**Features:**
- Input fields: Current Cost, Estimated Savings
- Auto-calculate: Monthly Savings, Annual ROI, Payback Period
- Modo comparação (antes/depois)
- Gráfico de pizza (current vs with Sirius)
- Botão "Salvar Cálculo" (cria note no deal)

**Tecnologias:**
- React Hook Form para inputs
- Recharts para gráfico
- Zod para validação

**Exemplo de código:**

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ROICalculatorPropsSchema, type ROICalculatorProps } from '@/lib/generative-ui'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export function ROICalculator(props: ROICalculatorProps & { onInteraction?: Function }) {
  const { scenario, industry, comparisonMode } = props

  const [currentCost, setCurrentCost] = useState(scenario.currentCost)
  const [withSirius, setWithSirius] = useState(scenario.withSirius)

  // Calculations
  const monthlySavings = currentCost - withSirius
  const annualROI = monthlySavings * 12
  const paybackPeriod = withSirius / monthlySavings

  const chartData = [
    { name: 'Custo Atual', value: currentCost, color: '#ef4444' },
    { name: 'Com Sirius', value: withSirius, color: '#10b981' },
  ]

  const handleSave = () => {
    props.onInteraction?.('save_calculation', 'roi', {
      currentCost,
      withSirius,
      monthlySavings,
      annualROI,
    })
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Calculadora de ROI</h3>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium">Custo Atual (Mensal)</label>
          <Input
            type="number"
            value={currentCost}
            onChange={(e) => setCurrentCost(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Com Sirius (Mensal)</label>
          <Input
            type="number"
            value={withSirius}
            onChange={(e) => setWithSirius(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Results */}
      <div className="bg-muted rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Economia Mensal</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {monthlySavings.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ROI Anual</p>
            <p className="text-2xl font-bold text-blue-600">
              R$ {annualROI.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Payback</p>
            <p className="text-2xl font-bold text-purple-600">
              {paybackPeriod.toFixed(1)} meses
            </p>
          </div>
        </div>
      </div>

      {/* Chart (if comparison mode) */}
      {comparisonMode && (
        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">Compartilhar</Button>
        <Button onClick={handleSave}>Salvar Cálculo</Button>
      </div>
    </Card>
  )
}
```

**Integração:**

Substituir placeholder em `component-registry.ts`:

```typescript
import { ROICalculator } from '@/components/generative-ui/ROICalculator'

// No registry:
ROICalculator: {
  // ... metadata
  render: ROICalculator, // ✅ Componente real
}
```

---

#### **Tarefa 2.2: Implementar DealFormGenerator**

**Arquivo:** `components/generative-ui/DealFormGenerator.tsx`

**Features:**
- Form com campos: title, value, closeDate, contactId, stageId
- Prefill automático com dados da conversa
- Suggested tags (chips clicáveis)
- AI notes pré-preenchidos (editable)
- Modo "Quick Create" (menos campos)
- Submit cria deal via API

**API Integration:**

```typescript
const handleSubmit = async (data: DealFormData) => {
  const response = await fetch('/api/deals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (response.ok) {
    props.onInteraction?.('deal_created', 'form', data)
    toast.success('Deal criado com sucesso!')
  }
}
```

---

#### **Tarefa 2.3: Implementar DemoScheduler**

**Arquivo:** `components/generative-ui/DemoScheduler.tsx`

**Features:**
- Calendly embed via iframe
- Prefill de dados (name, email, company)
- Webhook listener para criar deal ao agendar
- Auto-trigger CRM (opcional)

**Calendly Integration:**

```tsx
export function DemoScheduler(props: DemoSchedulerProps) {
  const { eventType, prefill, autoTriggerCRM } = props

  const calendlyUrl = `https://calendly.com/sirius-crm/${eventType}?${new URLSearchParams({
    name: prefill?.name || '',
    email: prefill?.email || '',
    a1: prefill?.company || '', // Custom field
  })}`

  useEffect(() => {
    // Listen for Calendly events
    const handleMessage = (e: MessageEvent) => {
      if (e.data.event === 'calendly.event_scheduled') {
        if (autoTriggerCRM) {
          createDealFromDemo(e.data.payload)
        }
        props.onInteraction?.('demo_scheduled', 'calendly', e.data.payload)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div className="h-[700px] border rounded-lg overflow-hidden">
      <iframe
        src={calendlyUrl}
        width="100%"
        height="100%"
        frameBorder="0"
      />
    </div>
  )
}
```

---

### Checklist da Fase 2

- [ ] Implementar ROICalculator
  - [ ] Lógica de cálculo
  - [ ] Inputs interativos
  - [ ] Gráfico de comparação
  - [ ] Ação "Salvar"
  - [ ] Testes unitários

- [ ] Implementar DealFormGenerator
  - [ ] Form com React Hook Form
  - [ ] Prefill automático
  - [ ] Tags sugeridas
  - [ ] Integração com `/api/deals`
  - [ ] Validação de campos

- [ ] Implementar DemoScheduler
  - [ ] Calendly embed
  - [ ] Prefill de dados
  - [ ] Webhook listener
  - [ ] Auto-create deal
  - [ ] Confirmação visual

- [ ] Substituir placeholders no registry
- [ ] Testar cada componente isoladamente
- [ ] Testar integração end-to-end com AI
- [ ] Adicionar analytics tracking
- [ ] Documentar exemplos de uso

---

## 📋 Fase 3 - Componentes Secundários

**Status:** ⏳ FUTURA

Implementar os 7 componentes restantes:
- PricingComparison
- ScriptPreview
- QualificationDashboard
- CompetitorMatrix
- OnboardingTimeline
- InsightCard
- EmailPreview

*(Ver roadmap completo em `GENERATIVE_UI_ARCHITECTURE.md`)*

---

## 🎯 Quick Wins (Faça Agora)

### 1. Integrar ChatWithUIExample em uma Página Real

```tsx
// app/dashboard/agi-chat/page.tsx
import { ChatWithUIExample } from '@/components/generative-ui/examples/ChatWithUIExample'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AgiChatPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="container mx-auto py-8">
      <ChatWithUIExample />
    </div>
  )
}
```

### 2. Adicionar Analytics Tracking

```typescript
// lib/analytics/genui-tracker.ts
export function trackComponentRender(component: string, props: any) {
  if (typeof window !== 'undefined' && (window as any).analytics) {
    ;(window as any).analytics.track('genui_component_rendered', {
      component,
      props_count: Object.keys(props).length,
      timestamp: new Date().toISOString(),
    })
  }
}

export function trackComponentInteraction(data: ComponentInteraction) {
  if (typeof window !== 'undefined' && (window as any).analytics) {
    ;(window as any).analytics.track('genui_interaction', data)
  }
}
```

### 3. Adicionar Error Monitoring (Sentry)

```typescript
// lib/generative-ui/error-reporter.ts
import * as Sentry from '@sentry/nextjs'

export function reportGenUIError(error: Error, context: {
  component?: string
  props?: any
  validation?: any
}) {
  Sentry.captureException(error, {
    tags: {
      module: 'generative-ui',
      component: context.component,
    },
    extra: context,
  })
}
```

---

## 📚 Recursos de Aprendizado

### Documentação Técnica
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Zod Documentation](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)
- [Recharts](https://recharts.org/)

### Inspiração de UI
- [Vercel AI Examples](https://github.com/vercel/ai/tree/main/examples)
- [v0.dev Generative UI](https://v0.dev/)
- [Perplexity AI UI](https://www.perplexity.ai/) (componentes inline)

---

## ❓ FAQ

### Q: Como adiciono um novo componente?

**A:** Siga estes passos:

1. Criar schema em `schemas.ts`
2. Adicionar ao registry em `component-registry.ts`
3. Implementar componente em `components/generative-ui/[Nome].tsx`
4. Testar validação
5. Atualizar docs

### Q: O AI não está renderizando componentes. Por quê?

**A:** Checklist:

1. Endpoint correto? (`/api/agi/chat-with-ui`)
2. GROQ_API_KEY configurado?
3. Contexto suficiente na conversa? (AI precisa de dados para props)
4. System prompt carregado? (automático no endpoint)

### Q: Como debugar props inválidos?

**A:**

```typescript
import { validateComponentProps } from '@/lib/generative-ui'

const validation = validateComponentProps('ROICalculator', props)
if (!validation.valid) {
  console.error('Validation error:', validation.error)
  console.log('Received props:', props)
}
```

### Q: Posso usar componentes sem AI?

**A:** Sim! Os componentes são React normais:

```tsx
import { ROICalculator } from '@/components/generative-ui/ROICalculator'

function MyPage() {
  return (
    <ROICalculator
      scenario={{
        currentCost: 15000,
        withSirius: 8000,
        monthlySavings: 7000,
        annualROI: 84000,
        paybackPeriod: 2,
      }}
      comparisonMode={true}
    />
  )
}
```

---

## 🐛 Reportando Problemas

Se encontrar bugs ou tiver dúvidas:

1. Verificar se é um problema conhecido (ver FAQ acima)
2. Testar com dados diferentes
3. Verificar console do navegador (F12)
4. Verificar logs do servidor
5. Abrir issue no GitHub com:
   - Mensagem de erro completa
   - Props que causaram o erro
   - Steps to reproduce

---

## 🎉 Conclusão

**Parabéns!** Você tem agora uma fundação sólida de Generative UI implementada.

**Próximos passos imediatos:**

1. ✅ Testar o endpoint `/api/agi/chat-with-ui`
2. ✅ Integrar ChatWithUIExample em uma página
3. ✅ Implementar ROICalculator (Fase 2.1)
4. ✅ Implementar DealFormGenerator (Fase 2.2)
5. ✅ Implementar DemoScheduler (Fase 2.3)

**Tempo estimado até MVP funcional:** 2-3 semanas

Boa sorte! 🚀

---

**Última atualização:** 2026-01-31
**Versão:** 1.0 (Fase 1 Completa)
