# Handoff: degrau 5 do mapa GSC (snippet) executado (2026-09-26)

## Estado em uma linha
As duas alavancas do degrau "5 · Snippet" do `hub.roilabs.com.br/gsc/mapa/sirius` (título e schema) foram
executadas, publicadas e marcadas como feitas (Jean, reler em 10/10/2026). O handoff do degrau 4 continua valendo e
está em `git show 992f1f26:handoff.md`.

## Feito nesta sessão
- **Título** (`e44cf62c`): 75 de 133 títulos passavam de 580 px. O crawl do hub no mesmo dia deu **0 de 133**.
  - Os posts ganharam o campo opcional `seoTitle` em `lib/blog-types.ts`. Ele vira o `<title>`; o H1 (`title`)
    e o título do OpenGraph continuam os mesmos.
  - Soluções, cidades, calculadoras, home, `/features`, `/pricing`, `/indique`, `/proposta`, `/help`, 4 artigos de
    ajuda e os 2 downloads HTML ganharam títulos mais curtos.
  - Todo título novo mantém um modificador de intenção. O degrau 3 não regrediu: 17 sem modificador antes e depois,
    todas utilitárias.
  - Onde o termo principal do Search Console cabia, ele foi para os primeiros 35 caracteres: 21 → 11 URLs fora.
- **Schema** (`e44cf62c`, `07599033`): 8 URLs indexadas sem resultado enriquecido (URL Inspection de 26/09).
  - As 5 calculadoras e a `/help` não tinham `BreadcrumbList`; agora têm.
  - As categorias "ferramentas" e "comparativos" tinham o breadcrumb desde março, e o Google nunca o detectou. A
    causa: 17 páginas injetavam o JSON-LD com `next/script`, que só chega depois da hidratação e fica fora do HTML
    do servidor. Viraram `<script>` nativo.
  - O layout do blog emitia o `CollectionPage` do `/blog` e um segundo breadcrumb em todo post e categoria. Os dois
    foram para `app/[locale]/(marketing)/blog/page.tsx`.

## O que ficou disparando, de propósito
- **Termo nos 35 primeiros caracteres: 11 URLs.** O termo principal delas é uma pergunta longa, uma busca de outro
  assunto ("comunicação automatizada com candidatos") ou uma busca de marca com 1 impressão.
  - `/help/automacoes/automacoes-email` passaria de 580 px com o sufixo "— Guia Sirius CRM" do template.
- **CTR Gap: os 3 alvos são URLs `/en/`**, que redirecionam 308 para o português desde 22/09 (spec 004). A janela do
  mapa, de 28/08 a 24/09, é quase toda anterior ao redirecionamento. Não há título EN para reescrever; os alvos saem
  da janela sozinhos até ~20/10.

## Decisão aberta (do dono)
- **Plano gratuito**: continua aberta, ver `git show 992f1f26:handoff.md`. Os títulos novos da `/pricing` e dos
  nichos mantêm o "Grátis" que já estava lá; não afirmam IA nem WhatsApp no plano gratuito.

## Próximos passos (em ordem)
1. **Pedir indexação** na UI do Search Console das 8 URLs sem resultado enriquecido: as 5 calculadoras, `/help`,
   `/blog/categoria/ferramentas` e `/blog/categoria/comparativos`. A API não faz esse pedido.
2. **10/10/2026**: reler os degraus 4 e 5 no mapa. A cobertura de schema e o CTR dependem de o Google recarregar
   as páginas.
3. Continuam valendo os passos 2 e 3 do handoff do degrau 4: reescrever `crm-gratuito-brasil-2026` e revisar as
   9 páginas vencidas.

## Gotchas
- Título novo: medir com `larguraDoTitulo`, `modificadoresDeIntencao` e `posicaoDoTermo` de `roihub/lib/pagina.mjs`
  antes do deploy. Cada caractere pesa diferente, então contar caracteres não basta.
- JSON-LD vai em `<script type="application/ld+json">` nativo, nunca em `next/script`.
- Schema posto em layout aparece em toda página filha.
- Substituição com `String.replace` em Node: um título com "R$" seguido de aspa vira o padrão `$'`. Passar uma
  função como segundo argumento.
- A cópia de trabalho está em CRLF; edição por substituição exata precisa respeitar isso.
