# Calculadora de Vazamento de Vendas (ROI)

## 📊 Visão Geral

Componente React interativo que funciona como Lead Magnet, calculando o impacto financeiro de vendas desorganizadas e incentivando o cadastro no Sirius CRM.

## ✨ Funcionalidades

- **Inputs intuitivos**: Volume de leads, ticket médio e taxa de conversão (slider)
- **Cálculo automático**: Compara cenário atual vs otimizado (20% melhoria)
- **Destaque visual**: Perda mensal em vermelho grande com gradiente
- **ROI do Sirius**: Mostra retorno de investimento em 1 mês e 1 semana
- **CTA personalizável**: Botão configurável para conversão
- **Design responsivo**: Funciona perfeitamente em mobile e desktop
- **Dark mode**: Suporte completo ao tema escuro

## 🚀 Uso Básico

### 1. Em uma página dedicada

```tsx
import { CalculadoraROI } from '@/components/calculadora-roi'

export default function MinhaLandingPage() {
  return (
    <div className="container py-20">
      <CalculadoraROI
        ctaText="Organizar minhas vendas agora"
        ctaHref="/register"
      />
    </div>
  )
}
```

### 2. Com callback customizado

```tsx
import { CalculadoraROI } from '@/components/calculadora-roi'

export default function MinhaLandingPage() {
  const handleCTA = () => {
    // Analytics, popup, redirect customizado, etc.
    console.log('Usuário clicou no CTA')
    window.location.href = '/cadastro?source=calculadora'
  }

  return (
    <CalculadoraROI
      onCTAClick={handleCTA}
      ctaText="Pare de perder R$ X agora"
    />
  )
}
```

### 3. Embedded em outras páginas

```tsx
// Exemplo: Na página de pricing
import { CalculadoraROI } from '@/components/calculadora-roi'

export default function PricingPage() {
  return (
    <>
      {/* Seção de preços */}
      <PricingTable />

      {/* Calculadora como seção adicional */}
      <section className="py-24 bg-zinc-50 dark:bg-zinc-950">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            Quanto você está perdendo sem um CRM?
          </h2>
          <CalculadoraROI />
        </div>
      </section>
    </>
  )
}
```

## 🎨 Props (Opcionais)

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `onCTAClick` | `() => void` | `undefined` | Callback executado ao clicar no CTA |
| `ctaText` | `string` | `"Pare de perder esse dinheiro agora"` | Texto do botão de CTA |
| `ctaHref` | `string` | `"/cadastro"` | URL de destino do CTA (usado se `onCTAClick` não for fornecido) |

## 🧮 Lógica de Cálculo

```typescript
// 1. Faturamento Atual
faturamentoAtual = volumeLeads × (taxaConversão / 100) × ticketMédio

// 2. Cenário Otimizado (20% melhoria)
taxaOtimizada = taxaConversão × 1.2
faturamentoOtimizado = volumeLeads × (taxaOtimizada / 100) × ticketMédio

// 3. Perda Mensal
perdaMensal = faturamentoOtimizado - faturamentoAtual

// 4. ROI
roiMensal = perdaMensal / 49 (custo Sirius)
```

## 📍 Rota Dedicada

A calculadora está disponível publicamente em:

```
/ferramentas/calculadora-roi
```

Esta página inclui:
- Hero section explicativa
- Calculadora interativa
- Social proof (estatísticas)
- Seção "Por que você está perdendo vendas?"
- FAQ sobre o funcionamento

## 🎯 SEO & Marketing

### Meta tags incluídas na página dedicada:

- **Title**: "Calculadora de Vazamento de Vendas | Sirius CRM"
- **Description**: "Descubra quanto dinheiro você está perdendo por não ter um sistema organizado de vendas..."
- **Keywords**: calculadora roi, vazamento de vendas, crm, conversão
- **Open Graph**: Otimizado para compartilhamento social

### Estratégia de Ranqueamento:

**Termos-alvo**:
- "calculadora de roi vendas"
- "calculadora de conversão de vendas"
- "quanto perco sem crm"
- "vazamento de vendas"
- "planilha de vendas gratis" (atrair e converter)

## 🔗 Integrações Sugeridas

### 1. Landing Page Principal
```tsx
// app/(marketing)/page.tsx
<section>
  <h1>Sirius CRM - Organize suas vendas</h1>
  <CalculadoraROI />
</section>
```

### 2. Blog Post
```tsx
// app/(marketing)/blog/como-aumentar-vendas/page.tsx
<article>
  <h1>Como Aumentar Vendas em 20%</h1>
  <p>Conteúdo...</p>

  <CalculadoraROI
    ctaText="Calcular meu potencial de vendas"
  />
</article>
```

### 3. Pop-up de Saída (Exit Intent)
```tsx
<Dialog open={showExitIntent}>
  <DialogContent className="max-w-4xl">
    <h2>Antes de sair, veja quanto você está perdendo!</h2>
    <CalculadoraROI />
  </DialogContent>
</Dialog>
```

## 🎨 Customização de Estilo

O componente usa Tailwind CSS. Para customizar cores:

```tsx
// Edite em: components/calculadora-roi.tsx

// Perda Mensal (card vermelho)
className="bg-gradient-to-br from-red-600 to-red-700"

// CTA Button
className="bg-gradient-to-r from-indigo-600 to-indigo-700"

// Cards de benefícios
className="bg-white dark:bg-zinc-900 border border-zinc-200"
```

## 📊 Analytics & Tracking

Adicione tracking de eventos:

```tsx
const handleCTA = () => {
  // Google Analytics
  gtag('event', 'calculadora_cta_click', {
    perda_mensal: resultados.perdaMensal,
    roi_calculado: resultados.roiMensal
  })

  // Facebook Pixel
  fbq('track', 'Lead', {
    value: resultados.perdaMensal,
    currency: 'BRL'
  })

  // Redirect
  window.location.href = '/register'
}

<CalculadoraROI onCTAClick={handleCTA} />
```

## 🧪 Teste A/B Sugerido

Teste diferentes CTAs:

**Variante A** (Medo):
```tsx
ctaText="Pare de perder R$ {valor} agora"
```

**Variante B** (Ganho):
```tsx
ctaText="Recupere R$ {valor} todo mês"
```

**Variante C** (Urgência):
```tsx
ctaText="Organizar vendas agora (5 min)"
```

## 🚦 Próximos Passos

1. ✅ Componente criado e funcional
2. ✅ Rota dedicada criada
3. ⬜ Adicionar tracking de analytics
4. ⬜ Criar variações A/B do CTA
5. ⬜ Implementar captura de email (lead magnet)
6. ⬜ Integrar com landing page principal
7. ⬜ Criar páginas dinâmicas por segmento:
   - `/ferramentas/calculadora-roi-corretores`
   - `/ferramentas/calculadora-roi-energia-solar`
   - `/ferramentas/calculadora-roi-agencias`

## 📦 Dependências

- `@radix-ui/react-slider` - Componente de slider instalado ✅
- Shadcn/ui components (Card, Input, Button, Label)
- Lucide React (ícones)

## 🐛 Troubleshooting

**Erro: "Cannot find module '@radix-ui/react-slider'"**
```bash
npm install @radix-ui/react-slider
```

**Slider não aparece:**
- Verifique se o arquivo `components/ui/slider.tsx` foi criado
- Confirme que a importação está correta

**Estilos quebrados:**
- Certifique-se de que o Tailwind CSS está configurado
- Verifique se `globals.css` está importado no layout

---

**Criado para**: Sirius CRM
**Versão**: 1.0
**Última atualização**: Janeiro 2026
