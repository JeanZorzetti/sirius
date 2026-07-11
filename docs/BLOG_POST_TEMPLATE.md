# Template de Post Otimizado para AI Answer Engines (GEO)

Este documento mostra como criar posts de blog otimizados para AI Answer Engines (ChatGPT, Perplexity, Claude, Gemini) usando a infraestrutura GEO implementada.

## Estrutura de um Post Completo

### 1. Metadata Básica (lib/blog-data.ts)

```typescript
{
  slug: 'seu-post-slug',
  title: 'Título Descritivo e Direto (sem clickbait)',
  excerpt: 'Resumo com fatos concretos: números, datas, percentagens',
  content: `...HTML aqui...`,
  date: '2026-01-29',
  category: 'Vendas',
  image: '/images/blog/seu-post.png',
  author: 'Seu Nome'
}
```

### 2. Metadata AI-Optimized (page.tsx - generateMetadata)

**❌ Ruim (clickbait, vago):**
```typescript
description: 'Descubra os segredos que ninguém te conta sobre vendas!'
```

**✅ Bom (fatos diretos, dados concretos):**
```typescript
description: 'SPIN Selling: Metodologia criada por Neil Rackham (1988, 35.000 vendas analisadas). 4 tipos de perguntas: Situação, Problema, Implicação, Necessidade. Aumenta taxa de fechamento em vendas complexas B2B com ciclo longo (+30 dias).'
```

**Estrutura ideal:**
- **Definição clara** do tópico principal
- **Dados quantitativos** (anos, números, percentagens)
- **Autor/fonte** se aplicável (Neil Rackham, estudo de X empresas)
- **Resultados mensuráveis** (aumenta X%, reduz Y dias)
- **Contexto de aplicação** (B2B, ciclo longo, mercado imobiliário)

### 3. GEO Configuration (page.tsx - articleSchema)

#### Exemplo: Post sobre Mercado Imobiliário

```typescript
const geoConfig = createGeoConfig.realEstate({
  mentions: [
    COMMON_WIKIDATA_ENTITIES.REAL_ESTATE_BROKER,  // Q831663
    COMMON_WIKIDATA_ENTITIES.SAO_PAULO,           // Q174
    COMMON_WIKIDATA_ENTITIES.COMMISSION,          // Q193541
  ],
  about: [
    COMMON_WIKIDATA_ENTITIES.REAL_ESTATE,         // Q891723
  ],
  citations: [
    'https://www.ibresp.com.br/blogs/2024/qual-a-porcentagem-do-corretor-de-imoveis/',
    'https://portas.com.br/noticias/precos-de-imoveis-devem-continuar-subindo-em-2026',
  ],
  author: {
    name: 'Jean Zorzetti',
    sameAs: FOUNDER_SAME_AS, // import de '@/lib/geo/entity' — NUNCA hard-codar perfis
    jobTitle: 'Founder & CEO',
    worksFor: {
      name: 'ROI Labs',
      url: 'https://roilabs.com.br',
    },
  },
})
```

#### Exemplo: Post sobre CRM/Vendas

```typescript
const geoConfig = createGeoConfig.sales({
  mentions: [
    COMMON_WIKIDATA_ENTITIES.CRM,                 // Q16635046
    COMMON_WIKIDATA_ENTITIES.SALES,               // Q184753
    COMMON_WIKIDATA_ENTITIES.BRAZIL,              // Q155
  ],
  about: [
    COMMON_WIKIDATA_ENTITIES.CUSTOMER_RELATIONSHIP_MANAGEMENT, // Q177777
    COMMON_WIKIDATA_ENTITIES.LEAD_GENERATION,     // Q1139696
  ],
  citations: [
    'https://exemplo.com/estudo-conversao-crm-2026',
  ],
  author: {
    name: 'Equipe Sirius',
    sameAs: ORG_SAME_AS, // import de '@/lib/geo/entity' — NUNCA hard-codar perfis
    worksFor: {
      name: 'ROI Labs',
      url: 'https://roilabs.com.br',
    },
  },
})
```

### 4. Conteúdo HTML (lib/blog-data.ts)

#### Estrutura Recomendada

```html
<!-- Introdução com Drop Cap (primeira letra grande) -->
<p>
  Primeiro parágrafo com contexto claro. A primeira letra será estilizada automaticamente.
</p>

<!-- Callout com dados concretos -->
<div class="callout-tip">
  <strong>💡 Dado Chave</strong>
  <p>Segundo estudo de 2024 com 1.200 corretores brasileiros, a taxa média de conversão salta de 12% (planilhas) para 35% (CRM organizado) - um aumento de 192% na eficiência comercial.</p>
</div>

<!-- Heading principal -->
<h2>O que é [Conceito Principal]</h2>

<p>
  Definição clara e objetiva. Use <strong>negrito</strong> em termos-chave para facilitar scanning por IA.
</p>

<!-- Lista com fatos -->
<ul>
  <li><strong>Fato 1:</strong> Descrição concreta com números</li>
  <li><strong>Fato 2:</strong> Descrição concreta com percentagens</li>
  <li><strong>Fato 3:</strong> Descrição concreta com datas</li>
</ul>

<!-- Tabela comparativa (AI adora tabelas!) -->
<table>
  <thead>
    <tr>
      <th>Critério</th>
      <th>Sem CRM</th>
      <th>Com CRM</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Taxa de Conversão</td>
      <td>10-12%</td>
      <td>30-35%</td>
    </tr>
    <tr>
      <td>Follow-ups Perdidos</td>
      <td>40-50%</td>
      <td>5-8%</td>
    </tr>
    <tr>
      <td>Tempo por Lead</td>
      <td>45 minutos</td>
      <td>15 minutos</td>
    </tr>
  </tbody>
</table>

<!-- Componente Interativo (Honey Trap) -->
<h2>Calculadora: Quanto Você Está Perdendo?</h2>

<p>Use nossa calculadora para descobrir seu potencial de receita:</p>

<div class="roi-calculator-component"></div>

<!-- Callout de ação -->
<div class="callout-key">
  <strong>🎯 Próximo Passo</strong>
  <p>Teste o Sirius CRM gratuitamente e veja a diferença em 7 dias.</p>
</div>
```

### 5. Boas Práticas de Conteúdo para AI

#### ✅ O que fazer:

1. **Fatos Quantificáveis**
   - "35% de taxa de conversão" ✅
   - "Aumento de 192% na eficiência" ✅
   - "R$ 773.500 preço médio apartamento SP 2026" ✅

2. **Atribuição de Fontes**
   - "Segundo estudo de Neil Rackham (1988)" ✅
   - "Dados IBRESP 2024" ✅
   - "Pesquisa com 1.200 corretores" ✅

3. **Contexto Temporal**
   - "Em 2026" ✅
   - "Nos últimos 5 anos" ✅
   - "Ciclo de vendas de 30-90 dias" ✅

4. **Definições Claras**
   ```html
   <p>
     <strong>SPIN Selling</strong> é uma metodologia de vendas consultivas criada por Neil Rackham em 1988 após análise de 35.000 interações de vendas. O acrônimo representa 4 tipos de perguntas: Situação, Problema, Implicação e Necessidade.
   </p>
   ```

5. **Listas e Tabelas**
   - AI processa estruturas tabulares facilmente
   - Use para comparações diretas
   - Números em células de tabela são altamente indexáveis

#### ❌ O que evitar:

1. **Clickbait e Hipérbole**
   - "O segredo que NINGUÉM te conta!" ❌
   - "Método REVOLUCIONÁRIO" ❌
   - "Você não vai ACREDITAR" ❌

2. **Generalidades Vagas**
   - "Muitas empresas" ❌ → "73% das empresas B2B" ✅
   - "Recentemente" ❌ → "Em janeiro de 2026" ✅
   - "Aumenta muito" ❌ → "Aumenta 192%" ✅

3. **Jargões sem Definição**
   - Sempre defina termos técnicos na primeira menção
   - Use `<strong>` para destacar o termo sendo definido

4. **Parágrafos Longos**
   - AI prefere parágrafos curtos (3-5 linhas)
   - Um conceito por parágrafo

### 6. Checklist de Publicação

Antes de publicar um post, verifique:

- [ ] **Metadata AI-optimized** com fatos concretos (não clickbait)
- [ ] **GEO Config** definida com:
  - [ ] `mentions` (entidades mencionadas no post)
  - [ ] `about` (assunto principal do post)
  - [ ] `citations` (fontes externas citadas)
  - [ ] `author` com `sameAs` (perfis sociais)
- [ ] **Componente JsonLd** usado (não script inline)
- [ ] **Primeiro parágrafo** define claramente o tópico
- [ ] **Dados quantificáveis** presentes (%, R$, anos)
- [ ] **Tabelas** para comparações importantes
- [ ] **Callouts** destacam insights chave
- [ ] **Honey Trap** (componente interativo) se aplicável
- [ ] **Fontes citadas** com links nas `citations`
- [ ] **Negrito** em termos-chave (facilita scanning)
- [ ] **Heading hierarchy** correta (h2 → h3, não pula níveis)

## Resultado Esperado

Com essa estrutura, AI Answer Engines conseguirão:

1. **Extrair fatos concretos** facilmente
2. **Atribuir fontes** corretamente (citations)
3. **Desambiguar entidades** via Wikidata (mentions/about)
4. **Citar seu conteúdo** em respostas
5. **Linkar para seu site** como fonte primária

## Exemplos Reais Implementados

- `/blog/planilha-controle-comissao-corretor` - Post otimizado com GEO + ROI Calculator
- `/blog/spin-selling-guia-completo` - FAQ Schema + GEO entities
- `/blog/funil-de-vendas-guia-completo` - Interactive calculators + GEO

## Ferramentas de Validação

1. **Schema Validator**: https://validator.schema.org/
   - Cole a URL do post
   - Verifique se JSON-LD está válido
   - Confira entidades Wikidata resolvidas

2. **Google Rich Results Test**: https://search.google.com/test/rich-results
   - Testa estrutura de dados
   - Mostra preview de snippet

3. **PostHog**: Evento `ai_traffic_detected`
   - Monitore tráfego vindo de AI engines
   - Veja qual post converte melhor
