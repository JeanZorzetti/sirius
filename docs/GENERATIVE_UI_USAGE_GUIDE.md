# Guia de Uso - Componentes de Generative UI

## 📋 Índice

1. [Quando Usar Cada Componente](#quando-usar-cada-componente)
2. [Componentes por Categoria](#componentes-por-categoria)
3. [Exemplos de Uso](#exemplos-de-uso)
4. [Troubleshooting](#troubleshooting)
5. [Best Practices](#best-practices)

---

## Quando Usar Cada Componente

### 🧮 ROICalculator
**Quando usar:**
- Lead menciona custo atual ou frustração com ferramentas
- Discussão sobre orçamento ou economia
- Comparação de preços com concorrentes
- Demonstração de valor do produto

**Não usar quando:**
- Lead ainda não entendeu o produto
- Muito cedo na conversa (use depois de estabelecer need)
- Lead não tem autoridade sobre budget

**Props principais:**
```typescript
{
  scenario: {
    currentCost: number,
    withSirius: number,
    monthlySavings?: number,
    annualROI?: number,
    paybackPeriod?: number
  },
  industry?: string,
  comparisonMode?: boolean
}
```

---

### 📝 DealFormGenerator
**Quando usar:**
- Lead demonstrou interesse claro
- Após qualification positiva (BANT score > 60)
- Lead solicitou proposta ou próximos passos
- Conversa natural levou a criar oportunidade

**Não usar quando:**
- Ainda explorando necessidades
- Lead não qualificado
- Informações insuficientes

---

### 📅 DemoScheduler
**Quando usar:**
- Lead solicitou demonstração
- Interesse confirmado em conhecer o produto
- Após apresentar valor inicial
- Lead tem need e timeline definidos

---

### 💰 PricingComparison
**Quando usar:**
- Lead perguntou sobre planos ou preços
- Comparação entre opções (FREE vs PRO)
- Demonstrar diferencial de features

---

### 🎯 QualificationDashboard
**Quando usar:**
- Após coletar informações de BANT
- Mostrar ao vendedor onde focar
- Identificar gaps de qualificação
- Priorizar next steps

**Não usar quando:**
- Início da conversa (sem dados)
- Apresentar diretamente ao lead (é interno)

---

## Best Practices

### 1. Sempre Use TypeScript
```typescript
import type { ROICalculatorProps } from '@/lib/generative-ui/schemas'
const props: ROICalculatorProps = { ... }
```

### 2. Track Analytics
```typescript
const { trackRender, trackInteraction } = useComponentAnalytics({
  component: 'ROICalculator',
  sessionId: 'abc123'
})
```

### 3. Use Optimistic Updates
```typescript
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate'
const { executeUpdate, isPending } = useOptimisticUpdate(deals)
```

### 4. Handle Errors Gracefully
```typescript
<GenUIErrorBoundary componentName="ROICalculator">
  <ROICalculator {...props} />
</GenUIErrorBoundary>
```

---

## Recursos Adicionais

- **Documentação completa:** `docs/GENERATIVE_UI_ARCHITECTURE.md`
- **Schemas:** `lib/generative-ui/schemas.ts`
- **Registry:** `lib/generative-ui/component-registry.ts`
- **Testes:** `__tests__/components/generative-ui/`
- **Analytics Dashboard:** `/admin/generative-ui-analytics`

---

**Última Atualização:** 2026-02-02  
**Versão:** 1.0
