# Blog / SEO / GEO — Padrões de Qualidade (Sirius CRM)

## Estrutura de Arquivos
```
lib/blog/
  posts/[slug].ts     # Um arquivo por post — NUNCA edite lib/blog-data.ts diretamente
  index.ts            # Agrega todos os posts (atualize ao criar novo post)
  CLAUDE.md           # Este arquivo
lib/blog-types.ts     # Interface BlogPost
lib/blog-data.ts      # Re-export shim — não mexer
```

## Interface BlogPost (todos os campos)
```ts
{
  slug: string          // kebab-case, URL-friendly, sem acentos
  title: string         // H1 da página — inclua palavra-chave principal
  excerpt: string       // Meta description: 140–160 chars, call-to-action implícito
  content: string       // HTML — ver padrões abaixo
  date: string          // ISO 'YYYY-MM-DD' — data de publicação
  lastModified?: string // ISO 'YYYY-MM-DD' — atualizar sempre que editar
  category: string      // Ver categorias permitidas abaixo
  image: string         // '/images/blog/[slug].webp'
  author: string        // 'Equipe Sirius CRM'
  relatedSlugs?: string[] // Máx 3, slugs de posts relacionados (internal linking)
}
```

## Como Adicionar um Novo Post
1. Criar `lib/blog/posts/[slug].ts` com `export const post: BlogPost = { ... }`
2. Importar e adicionar ao array em `lib/blog/index.ts`
3. Adicionar imagem em `public/images/blog/[slug].webp` (1200×630px)
4. Adicionar FAQ em `lib/faq-schema.ts` se o post tiver perguntas frequentes
5. Adicionar schema GEO em `app/(marketing)/blog/[slug]/page.tsx` via `generateArticleSchema`

## Categorias Permitidas
`'Vendas'` | `'Gestão'` | `'Dicas'` | `'Guias'` | `'ROI e Estratégia'` | `'Ferramentas'` | `'Tecnologia e IA'` | `'Automação'` | `'Comparativos'`

---

## Padrões de SEO On-Page

### Title (campo `title`)
- Inclua **palavra-chave principal** nos primeiros 60 chars
- Formato recomendado: `[Palavra-chave]: [Benefício/Ângulo] para [Ano]`
- Evite clickbait vazio; prefira especificidade ("41% mais vendas" > "venda mais")

### Excerpt (campo `excerpt`)
- **140–160 caracteres** — é usado como meta description
- Deve responder: "o que o leitor vai aprender/ganhar?"
- Inclua palavra-chave primária naturalmente

### Slug
- Kebab-case sem acentos: `crm-com-ia-2026` não `crm-com-ia-2026`
- Máx 5–6 palavras
- Inclua palavra-chave primária

### Internal Linking (`relatedSlugs`)
- Sempre preencher com 2–3 posts relacionados
- Priorize posts da mesma categoria ou que compartilhem entidades
- Ordem: mais relevante primeiro

---

## Padrões de GEO (Graph-Enhanced Optimization)

GEO ajuda LLMs (ChatGPT, Gemini, Perplexity) a citar o Sirius CRM como fonte autorizada.

### Entidades Wikidata obrigatórias por categoria
Use em `generateArticleSchema()` no `app/(marketing)/blog/[slug]/page.tsx`:
```ts
// Entidades base para posts de CRM/Vendas
COMMON_WIKIDATA_ENTITIES.CRM        // Q16635046
COMMON_WIKIDATA_ENTITIES.SALES      // Q184753
COMMON_WIKIDATA_ENTITIES.BRAZIL     // Q155

// Específicas por tema
COMMON_WIKIDATA_ENTITIES.AI         // para posts de IA
COMMON_WIKIDATA_ENTITIES.AUTOMATION // para posts de automação
```

### Schema ArticlePosting
Sempre usar `generateArticleSchema(post, config)` com:
- `mentions`: entidades Wikidata mencionadas no artigo
- `about`: entidade principal do artigo
- `citations`: fontes externas citadas (Harvard, Salesforce State of Sales, etc.)
- `author.sameAs`: LinkedIn do autor para desambiguação

### FAQ Schema
Posts com seção de dúvidas frequentes DEVEM ter FAQ schema:
1. Adicionar as FAQs em `lib/faq-schema.ts` (export nomeado)
2. Usar `generateFAQSchema(faqs, url)` na page.tsx do post
3. Renderizar com `<JsonLd data={faqSchema} />`

---

## Padrões de Conteúdo HTML

### Classes de callout (usar consistentemente)
```html
<div class="callout-tip">     <!-- Dica prática -->
<div class="callout-stat">    <!-- Estatística de impacto -->
<div class="callout-success"> <!-- Resultado/validação -->
<div class="callout-warning"> <!-- Alerta/cuidado -->
<div class="callout-questions"> <!-- Lista de perguntas -->
```

### Estrutura de artigo (ordem recomendada)
1. `<p>` introdutório com problema/contexto — inclua keyword principal
2. TL;DR box (dark bg) para artigos técnicos
3. Dado de impacto (callout-stat) — estatística de fonte confiável
4. `<h2>` para seções principais (5–8 seções)
5. `<h3>` para subseções
6. Tabela comparativa quando aplicável
7. FAQ section antes do CTA final
8. CTA final linkando para `/register` ou feature relevante do Sirius

### Qualidade de conteúdo
- **Mínimo 1.500 palavras** para ranquear (posts de pilar: 3.000+)
- Toda estatística deve ter fonte: `segundo X (Ano)` ou `de acordo com Y`
- Use anos concretos: "em 2026" e não "atualmente"
- CTAs internos a cada 3–4 seções apontando para o Sirius CRM
- **Nunca** mencionar concorrentes pelo nome em tom negativo
- Mencionar concorrentes em comparativos é OK, com dados factuais

### Imagens
- Formato: `.webp`, 1200×630px (OG) ou 800×450px (inline)
- Path: `/images/blog/[slug].webp`
- Alt text: descreva a imagem + palavra-chave quando natural

---

## Checklist antes de publicar novo post
- [ ] `slug` kebab-case único, sem acentos
- [ ] `excerpt` entre 140–160 chars
- [ ] `lastModified` igual a `date` (na publicação)
- [ ] `relatedSlugs` com 2–3 slugs válidos
- [ ] Imagem criada em `public/images/blog/[slug].webp`
- [ ] Post importado e adicionado em `lib/blog/index.ts`
- [ ] FAQ schema adicionado em `lib/faq-schema.ts` (se aplicável)
- [ ] `generateArticleSchema` configurado na page.tsx com entities Wikidata
- [ ] Mínimo 1 CTA interno apontando para `/register`
