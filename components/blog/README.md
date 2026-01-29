# Blog Interactive Components Integration

Este README explica como adicionar componentes React interativos (Honey Traps) dentro do conteúdo dos posts do blog.

## Como Funciona

O sistema usa `createRoot()` do React 18 para injetar componentes React em placeholders HTML no conteúdo estático dos posts.

## Adicionando Componentes ao Blog

### 1. Criar o Placeholder no Conteúdo HTML

No arquivo `lib/blog-data.ts`, adicione um `<div>` com classe específica onde você quer o componente:

```html
<!-- Exemplo: Calculadora ROI -->
<div class="roi-calculator-component"></div>

<!-- Exemplo: Calculadora de Funil -->
<div class="funnel-calculator-component"></div>

<!-- Exemplo: Download de Template -->
<div class="funnel-template-download-component"></div>
```

### 2. Configurar a Injeção no BlogContentWrapper

Edite `components/blog/blog-content-wrapper.tsx` e adicione a lógica de injeção:

```tsx
// Importar o componente
import { SeuComponente } from '@/components/seu-componente'

// No useEffect, adicionar condicional por slug:
if (slug === 'seu-post-slug') {
  const placeholder = contentRef.current.querySelector('.seu-componente-class')
  if (placeholder && !placeholder.hasChildNodes()) {
    const root = createRoot(placeholder)
    root.render(<SeuComponente prop1="valor" />)
  }
}
```

## Componentes Disponíveis (Honey Traps)

### CalculadoraROI
**Arquivo:** `components/calculadora-roi.tsx`
**Placeholder:** `.roi-calculator-component`
**Props:**
- `ctaText?: string` - Texto do botão CTA
- `ctaHref?: string` - URL do CTA
- `onCTAClick?: () => void` - Callback customizado

**Uso:**
```tsx
root.render(
  <CalculadoraROI
    ctaText="Pare de perder comissões"
    ctaHref="/register"
  />
)
```

**Posts usando:**
- `planilha-controle-comissao-corretor`

---

### FunnelCalculator
**Arquivo:** `components/blog/funnel-calculator.tsx`
**Placeholder:** `.funnel-calculator-component`
**Props:** Nenhuma

**Posts usando:**
- `funil-de-vendas-guia-completo`

---

### FunnelTemplateDownload
**Arquivo:** `components/blog/funnel-template-download.tsx`
**Placeholder:** `.funnel-template-download-component`
**Props:** Nenhuma

**Posts usando:**
- `funil-de-vendas-guia-completo`

## Exemplo Completo

### 1. No `lib/blog-data.ts`:

```typescript
{
  slug: 'meu-post',
  title: 'Meu Post Incrível',
  content: `
    <h2>Introdução</h2>
    <p>Texto introdutório...</p>

    <h2>Calculadora Interativa</h2>
    <p>Use nossa calculadora para descobrir seu ROI:</p>

    <!-- Placeholder do componente React -->
    <div class="roi-calculator-component"></div>

    <h2>Conclusão</h2>
    <p>Texto de conclusão...</p>
  `,
}
```

### 2. No `components/blog/blog-content-wrapper.tsx`:

```tsx
import { CalculadoraROI } from '@/components/calculadora-roi'

useEffect(() => {
  if (!contentRef.current) return

  if (slug === 'meu-post') {
    const placeholder = contentRef.current.querySelector('.roi-calculator-component')
    if (placeholder && !placeholder.hasChildNodes()) {
      const root = createRoot(placeholder)
      root.render(
        <CalculadoraROI
          ctaText="Comece Agora"
          ctaHref="/register"
        />
      )
    }
  }
}, [slug])
```

## Boas Práticas

1. **Use classes CSS únicas** para cada tipo de componente (`.roi-calculator-component`, não `.calculator`)
2. **Verifique `hasChildNodes()`** antes de criar o root para evitar duplicação
3. **Importe apenas os componentes necessários** para o post atual (code splitting)
4. **Posicione estrategicamente** os componentes no meio do conteúdo (após 50% de scroll ideal)
5. **Teste eventos PostHog** para garantir tracking correto

## Tracking de Interações

Todos os componentes interativos devem disparar eventos PostHog:

```tsx
import { analytics } from '@/lib/posthog'

// Exemplo:
analytics.toolInteraction({
  tool_type: 'roi_calculator',
  action: 'calculated',
  metadata: { potential_loss: 50000 }
})
```

## Troubleshooting

**Componente não aparece:**
- Verifique se o placeholder existe no HTML (`console.log(placeholder)`)
- Verifique se o slug está correto na condicional
- Verifique erros no console do navegador

**Componente duplicado:**
- Adicione verificação `!placeholder.hasChildNodes()`
- Limpe o cache do navegador (React Strict Mode pode causar duplicação em dev)

**Estilos não aplicados:**
- Os componentes herdam estilos do `.prose` do Tailwind
- Use classes Tailwind diretamente nos componentes
- Teste em modo dark e light
