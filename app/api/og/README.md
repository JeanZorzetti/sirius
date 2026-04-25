# Dynamic Open Graph Image Generation

Geração dinâmica de imagens OG usando Satori (Edge Runtime).

## Endpoint

```
GET /api/og
```

## Parâmetros

| Parâmetro | Tipo | Default | Descrição |
|-----------|------|---------|-----------|
| `roi` | number | `94282` | Valor monetário da perda/ganho (em reais) |
| `title` | string | `O Custo Oculto da Inação no CRM` | Título do artigo |
| `scenario` | enum | `realista` | Cenário: `pessimista`, `realista`, `otimista` |

## Exemplos de Uso

### 1. Imagem Default (Cenário Realista)
```
https://siriuscrm.com.br/api/og
```

### 2. Cenário Pessimista (R$ 50.000)
```
https://siriuscrm.com.br/api/og?roi=50000&scenario=pessimista
```

### 3. Cenário Otimista com Título Customizado
```
https://siriuscrm.com.br/api/og?roi=120000&scenario=otimista&title=ROI+de+CRM+em+60+Dias
```

### 4. Uso no Metadata do Blog
```typescript
const ogParams = new URLSearchParams({
  roi: resultado.ganhoMensal.toString(),
  title: post.title,
  scenario: 'realista',
})
const imageUrl = `https://siriuscrm.com.br/api/og?${ogParams.toString()}`
```

## Personalização por Usuário

Quando um usuário calcula ROI na calculadora e compartilha:

```typescript
// No componente CalculadoraROI
const handleShare = () => {
  const shareUrl = `/api/og?roi=${resultado.ganhoMensal}&scenario=${selectedScenario}`
  navigator.share({
    title: post.title,
    url: window.location.href,
    // A imagem será carregada dinamicamente pelos crawlers
  })
}
```

## Cores por Cenário

| Cenário | Background | Accent | Badge |
|---------|-----------|--------|-------|
| **Pessimista** | `#FEF3C7` (Yellow-100) | `#F59E0B` (Amber-500) | Conservador |
| **Realista** | `#DBEAFE` (Blue-100) | `#3B82F6` (Blue-500) | Mediana de Mercado |
| **Otimista** | `#D1FAE5` (Green-100) | `#10B981` (Emerald-500) | Top Performers |

## Especificações Técnicas

- **Runtime:** Edge (Vercel Edge Functions)
- **Biblioteca:** @vercel/og (Satori + Resvg)
- **Dimensões:** 1200×630px (padrão OG)
- **Formato:** PNG
- **Cache:** Automático via Vercel (1 ano)

## Limitações do Satori

- ❌ Não suporta `display: grid`
- ❌ Não suporta `position: absolute` complexo
- ❌ Imagens externas adicionam latência
- ✅ Suporta Flexbox completo
- ✅ SVG inline renderiza instantaneamente
- ✅ Custom fonts via `fetch` de buffers

## Performance

- **Geração:** ~50-150ms (Edge Runtime)
- **Cache hit:** <10ms (CDN)
- **Tamanho:** ~30-50kb (PNG otimizado)

## Validação

Testar a imagem:
1. Abra no navegador: `http://localhost:3000/api/og?roi=100000&scenario=otimista`
2. Use o [Facebook Debugger](https://developers.facebook.com/tools/debug/)
3. Use o [Twitter Card Validator](https://cards-dev.twitter.com/validator)
