# Design Review — Páginas públicas (home + /pricing)

**Data:** 2026-08-22
**Alvo:** `app/[locale]/(marketing)/page.tsx` (home) e `app/[locale]/(marketing)/pricing/page.tsx`
**Objetivo do usuário na superfície:** decidir assinar o Sirius CRM (ou iniciar trial) sem falar com ninguém
**Restrição:** Next 15 App Router + Tailwind/shadcn, i18n `[locale]`, aquisição 100% SEO/GEO (sem Ads)
**Estado:** auditoria — **nenhum arquivo foi alterado**

Disciplinas rodadas, na ordem canônica: `conversion-copy` → `behavioral-design` → `art-direction` → `motion-design` → `seo-geo` → `responsive-design` → `web-performance` → `accessibility` → `ui-verification`.

---

## Como isto foi verificado

Tudo abaixo foi medido em **produção** (`https://siriuscrm.com.br`), não inferido do código.

| Ferramenta | O que mediu |
|---|---|
| `curl` (sem JS) | HTML servido — o que crawler de IA enxerga |
| Playwright 1.57 / Chromium | 360, 768 e 1440px: screenshots, overflow-x, console, rede |
| Playwright + `PerformanceObserver` | LCP, CLS, TTFB, peso de JS |
| Playwright + `keyboard.press('Tab')` | passagem de teclado real, com `:focus-visible` confirmado por elemento |
| Conversor oklch→sRGB próprio | contraste (necessário: `canvas.fillStyle` não parseia `oklch`) |

**Ressalva de método:** a primeira medição de contraste devolveu `1:1` para tudo — `canvas.fillStyle` não parseia `oklch()` e caía silenciosamente no valor anterior. Aqueles números foram descartados. A segunda medição usa conversor próprio, validado antes de rodar contra hex conhecidos do Tailwind v4 (`zinc-950`, `zinc-500`, `zinc-400`, `white`; desvio máximo 2/255) e contra a razão conhecida branco/preto = 21.00:1. **Só os números da segunda medição valem.**

Da mesma forma, a primeira medição de foco usou `element.focus()` programático — que **não** dispara `:focus-visible`. Foi refeita com Tab real e `el.matches(':focus-visible')` confirmado em cada parada.

---

## Diagnóstico

O site tem um problema de **credibilidade** e um de **entrega**, e os dois batem no mesmo canal — SEO/GEO é 100% da aquisição.

**A entrega:** nenhum structured data de página chega ao crawler. O HTML servido tem exatamente 1 `<script type="application/ld+json">` — o `@graph` do layout. FAQPage, Product, LocalBusiness, BreadcrumbList e a ItemList de ofertas existem só como string escapada dentro do payload RSC, porque `next/script` injeta depois da hidratação. GPTBot, PerplexityBot e ClaudeBot não executam JS. Todo o investimento de GEO está invisível justamente para quem ele foi escrito.

**A credibilidade:** o mesmo produto declara três notas diferentes (5.0/12, 4.8/127, 4.8/12) e quatro números de base incompatíveis (120+ empresas, 120+ times, 1.200 usuários, 127 reviews), com `aggregateRating` em página sem nenhuma review visível. Isso viola a política de review snippet do Google — e o handoff de 11/07 já tinha sinalizado o risco.

---

## Ações

Ordenadas por severidade × frequência. Severidade 0-4 (escala Nielsen).

### 1. Structured data de página nunca chega ao crawler — **Sev 4** · `seo-geo`

**Achado.** No HTML cru da home e do /pricing, `grep -c '<script type="application/ld+json">'` = **1**. Os `@type` presentes são só os do layout: `Organization`, `WebSite`, `SoftwareApplication`, `Person`, `ContactPoint`, `ImageObject`, `Offer`, `AggregateRating`.

Os schemas de página existem apenas escapados no payload RSC (`\"@type\":\"FAQPage\"`), ou seja: injetados client-side por `next/script` com estratégia `afterInteractive`.

Ficam invisíveis para crawler sem JS:

| Página | Schemas perdidos |
|---|---|
| home | `SoftwareApplication`, `Product`, `FAQPage` (5 perguntas), `LocalBusiness` |
| /pricing | `BreadcrumbList`, `FAQPage` (8 perguntas), `ItemList` de ofertas, `SoftwareApplication` |

**Correção.** Trocar `<Script id=… type="application/ld+json">` por `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: … }} />` — é a recomendação do próprio Google para JSON-LD em Next.js. 8 blocos no total:

- `app/[locale]/(marketing)/page.tsx:253-273`
- `app/[locale]/(marketing)/pricing/page.tsx:98-119`

Não exige tocar na arquitetura da página nem remover o `'use client'`.

---

### 2. Prova social fabricada e mutuamente contraditória — **Sev 4** · `conversion-copy` + `seo-geo`

**Achado.** Três notas diferentes para o mesmo produto:

| Onde | Valor | Chega ao crawler? |
|---|---|---|
| `app/[locale]/layout.tsx` (@graph) | `5.0` / `ratingCount 12` | **sim** |
| `page.tsx:70` e `:113` (home) | `4.8` / `reviewCount 127` | não |
| `pricing/page.tsx:92` | `4.8` / `ratingCount 12` | não |

Mais dois `Review` com nome próprio embutidos no `Product` da home (`page.tsx:120-134`), e **nenhuma review visível** em nenhuma das páginas onde o `aggregateRating` é declarado — violação direta da política de review snippet do Google (a nota precisa ser do conteúdo principal da página e visível ao usuário). Risco de manual action.

Os números de base também não fecham entre si:

| Afirmação | Origem |
|---|---|
| "120+ times vendendo agora" | `marketing.json` → `home.hero.socialProof` |
| "120+ Empresas ativas" | `components/marketing/logos.tsx:3` |
| "mais de 1.200 usuários" | `marketing.json` → `home.about.description` |
| "127 reviews" | `page.tsx:70` |
| "40% Aumento em conversão" | `logos.tsx:4` |
| "aumento médio de 35% na conversão" | `marketing.json` → `home.about.description` |

O bloco `about` é o **bloco GEO** — escrito especificamente para ser extraído e citado por LLM. É ele que carrega os dois números mais frágeis (1.200 usuários, 35%).

Somam-se 3 depoimentos com nome, cargo e empresa (`marketing.json` → `home.testimonials`), renderizados com avatares que são círculos de gradiente vazios.

**Correção.** Remover `aggregateRating` e `review` dos 3 schemas. Substituir os números por fato verificável ou remover — a home não precisa de número falso, precisa de **um** número.

> Nota de risco: além do Google, publicidade com dado inventado no Brasil cai no CDC art. 37 (publicidade enganosa). A decisão sobre quais números são reais é do Jean — este relatório só constata que eles se contradizem entre si e que a nota é declarada sem review visível.

---

### 3. Foco invisível nos CTAs primários — **Sev 4** · `accessibility`

**Achado.** Passagem de Tab real, `:focus-visible = true` confirmado em cada parada:

- **home:** 4 de 22 paradas sem indicador visível
- **/pricing:** **9 de 22** — incluindo o **"Começar Agora" de cada card de plano**, "Fale com Vendas", "Começar Grátis" do topo, "Começar grátis" do banner

Todos os que falham apresentam:

```
outline: solid 0px
box-shadow: rgba(0,0,0,0) 0px 0px 0px 0px, rgba(0,0,0,0) …, oklab(0 0 0 / 0) 0px …
```

— todas as 5 camadas em alpha 0. Os `<a>` puros com classes Tailwind **passam** (`solid 2px`). O que falha é sempre o que passa pelo `<Button>` do shadcn.

**Causa raiz — única.** `components/ui/button.tsx:8`: `outline-none` mata o fallback do browser e `focus-visible:ring-ring/50` resolve para cor transparente. Um ajuste no Button conserta todas as ocorrências do site.

WCAG 2.4.7 (AA), e está exatamente no caminho de compra.

---

### 4. `aria-label` cru + erro de console em toda página — **Sev 3** · `ux-writing` + `accessibility`

**Achado.** Dois sintomas, **um bug**:

1. O seletor de idioma anuncia `aria-label="common.language"` — a chave crua, não o texto.
2. `INSUFFICIENT_PATH` é lançado no console em **toda página, toda largura** (6/6 carregamentos medidos).

`INSUFFICIENT_PATH` é erro do next-intl: lançado quando a chave resolve para **objeto** em vez de string. E é o caso:

```js
// messages/pt-BR/common.json
"language": { "portuguese": "Português", "english": "English", "switchTo": "Mudar para" }
```

```tsx
// components/marketing/language-switcher.tsx:46
aria-label={t('language')}   // -> objeto -> INSUFFICIENT_PATH -> renderiza "common.language"
```

O rótulo visível ("🇧🇷 Português") está certo porque vem de `LOCALE_LABELS`, uma const hard-coded — não do i18n. Só o nome acessível quebrou.

**Correção.** Adicionar `"label": "Idioma"` dentro de `language` em `messages/pt-BR/common.json` e `messages/en/common.json`, e usar `t('language.label')` em `language-switcher.tsx:46`. Mata o erro de console junto.

---

### 5. Preços desalinhados em 141px — **Sev 3** · `usability-heuristics`

**Achado.** Medido em 1440px:

| Plano | Topo do preço (y) | Preço |
|---|---|---|
| Gratuito | 930 | Grátis |
| Starter | 873 | R$ 67 |
| Pro | 792 | R$ 147 |
| Business | 789 | R$ 397 |

**141px de desalinhamento.** A única função de uma tabela de 4 colunas é comparar lado a lado; os preços não compartilham linha de base. A causa é a descrição de cada plano ter 1, 2 ou 3 linhas e empurrar o preço para baixo.

**Correção.** `grid-template-rows: subgrid` nos cards, ou altura mínima fixa no bloco de descrição — `app/[locale]/(marketing)/pricing/page.tsx:160`.

---

### 6. Home escura, /pricing clara — **Sev 3** · `design-systems`

**Achado.** A home é `bg-zinc-950` hard-coded (`page.tsx:276`); o /pricing usa `bg-background` (token de tema, renderiza claro). O usuário clica "Preços" no menu e o site inteiro inverte de identidade. Na home, o header claro ainda flutua sobre o hero preto, criando uma emenda visível no topo da página.

**Correção.** Escolher uma régua: ou a home passa a consumir os tokens de tema, ou o /pricing recebe o mesmo tratamento escuro. Hoje as duas convivem e nenhuma vence.

**Conflito declarado:** `art-direction` quer o hero escuro com glow; `design-systems` quer uma régua só. Decisão: manter o escuro (é a identidade do produto) e **migrar o /pricing para ele**, não o contrário — inverter para claro custaria a única assinatura visual que a marca tem hoje.

---

### 7. Duas ofertas concorrentes no mesmo viewport — **Sev 3** · `conversion-copy`

**Achado.** No /pricing, acima do primeiro preço, empilhados:

- badge verde: "Teste grátis por **tempo ilimitado**"
- banner logo abaixo: "**7 dias** grátis com acesso PRO completo"

São dois fatos verdadeiros (plano Free permanente **e** trial de PRO por 7 dias), mas apresentados como se competissem. O visitante lê contradição antes de ver o preço.

**Correção.** Separar explicitamente: "Plano gratuito para sempre — e 7 dias de PRO completo para testar tudo." Uma frase, dois fatos, zero contradição.

---

### 8. Contraste abaixo de AA no texto que fecha a venda — **Sev 3** · `accessibility`

**Achado.** Medido com conversor validado (ver ressalva de método):

| Página | Razão | Mín. | Onde |
|---|---|---|---|
| home | **1.29:1** | 4.5 | AgiPreview, 12px — "💡 Experimente perguntas sobre BANT, SPIN…" |
| home | **2.63:1** | 4.5 | AgiPreview, 16px — "Sua consultora de vendas com IA…" |
| /pricing | **2.64:1** | 4.5 | badge do trial — "Teste grátis por tempo ilimitado" |
| /pricing | **3.22:1** | 4.5 | **"Garantia de 7 dias — 100% do seu dinheiro de volta"** |
| home | **4.00:1** | 4.5 | `text-zinc-500` 14px, **16 ocorrências**: descrição de plano, cargo dos depoimentos, labels das estatísticas |

**Correção.** Trocar `text-zinc-500` por `text-zinc-400` no tema escuro (sobe para 7.8:1) e escurecer o verde usado no /pricing. A linha da garantia é a que mais precisa ser lida e é a segunda pior da página.

*Descartados como falso positivo do método:* o headline em `bg-clip-text text-transparent` e os botões cujo próprio fundo é gradiente — a medição lê o fundo do pai, não o gradiente do elemento.

---

### 9. Hierarquia de headings quebrada no /pricing — **Sev 2** · `seo-geo`

**Achado.** Outline real da página:

```
H2  Preços Transparentes      <- antes do H1
H1  Pague apenas quando escalar
H3  Enterprise
H3  Calcule seu ROI
…
```

Um `<h2>` usado como eyebrow **antes** do `<h1>`, e depois salto H1→H3 sem nenhum H2 cobrindo a comparação de planos — que é o conteúdo principal da página.

**Correção.** Eyebrow vira `<p>`; promover um H2 "Planos" acima da grade de cards.

---

### 10. Hero sem produto — **Sev 2** · `art-direction`

**Achado.** Acima da dobra: badge, headline em gradiente, subtítulo, dois botões, linha de confiança, avatares. É o template padrão de SaaS-IA — nenhuma imagem do produto. Quem chega não vê o CRM. Os "+120" são círculos de gradiente vazios: prova social que se lê como placeholder.

**Correção.** Um screenshot real do Kanban acima da dobra vale mais que os quatro números inventados da ação #2. Custo de LCP é gerenciável — a página tem folga (ver abaixo).

---

## O que não achou nada

- **`web-performance`** — limpo, não mexer. LCP 1,63s (home) / 1,37s (/pricing), **CLS 0.000**, 293-302KB de JS, TTFB ~0,51-0,55s, 48-49 requests. Há folga de orçamento para a imagem de produto da ação #10.
- **`responsive-design`** — sem overflow-x em 360, 768 e 1440 nas duas páginas (`scrollWidth === clientWidth` em todas as 6 combinações). Único ponto fica em fora de escopo.
- **`behavioral-design`** e **`motion-design`** — nada acima da severidade dos itens listados.

---

## Fora de escopo agora

- **Alvos de toque de 19-20px** nos links do rodapé e da nav — WCAG 2.5.8 pede 24×24. Real, mas é rodapé; entra junto com a ação #8, não sozinho.
- **`llms.txt` desatualizado** — declara `URL: https://sirius.roilabs.com.br` (responde 301, aponta para o domínio secundário) e "Blog (10 Educational Articles)" quando o repo já está no post 46. Barato de arrumar, mas só rende depois da ação #1.
- **`/pricing` inteira é `'use client'`** por causa do toggle Mensal/Anual. Custa pouco hoje (LCP 1,37s); só virou relevante porque ajudou a esconder o schema — e a ação #1 resolve o schema sem tocar na arquitetura.
- **Página LinkedIn `roi-labs-curadoria` parada** (0 posts em 90d), herdado do handoff de 11/07 — afeta a força da entidade, não estas duas páginas.

---

## Apêndice — comandos para reproduzir

```bash
# 1. Quantos ld+json realmente chegam ao crawler
curl -s https://siriuscrm.com.br/ -o home.html
grep -c '<script type="application/ld+json">' home.html      # -> 1
grep -o '"@type":"[A-Za-z]*"' home.html | sort | uniq -c     # só os do layout

# 2. Os schemas de página só existem escapados no payload RSC
grep -o '\\"@type\\":\\"FAQPage\\"' home.html                # -> 1 (escapado, não é tag)

# 3. As três notas divergentes
grep -o 'aggregateRating[^}]*}' home.html
```

Os scripts de verificação (Playwright: foco via Tab, contraste com conversor validado, vitals, alinhamento dos cards) foram gerados em scratchpad de sessão e não versionados. Se valer manter como check recorrente, o candidato é o de foco + contraste — é o que pega regressão de token sem ninguém perceber.

---

## Próximo passo sugerido

Ações **1, 3 e 4** têm causa raiz única e diff curto — 8 tags de script, 1 classe no Button, 1 chave de i18n — e as três estão verificadas em produção. São o melhor retorno por linha alterada.
