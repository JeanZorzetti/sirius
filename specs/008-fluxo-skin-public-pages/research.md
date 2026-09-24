# Research: As páginas públicas vestem a pele da home

Tudo medido no código de 24/09 (`fc041f1`) e na folha CSS de produção.

## R1 — Onde a pele entra: o atributo da home no layout público

**Decision**: o `div` raiz de `app/[locale]/(marketing)/layout.tsx` ganha `data-art="fluxo"` e as classes das duas
fontes, como o layout da home. Os **tokens** (primitivos, mapeamento para as variáveis do shadcn e regras gerais da
página) saem de `(fluxo)/fluxo.css` para um arquivo novo, `app/fluxo-pele.css`, importado por `app/public.css`. O
`fluxo.css` fica só com o que é da home (abertura, campo, faixas, planos, fecho, coreografia).

**Rationale**: a pele é a mesma direção; a home é a pele mais o gesto. Um atributo só evita dois nomes para a mesma
coisa. `public.css` já é a folha de toda rota pública (007), então os tokens chegam à home e às 38 páginas sem import
novo em cada página. O app nunca tem `data-art`, então não é afetado.

**Alternatives considered**:
- *Remapear a paleta do Tailwind (`--color-purple-600` → vermelho) no escopo*, como no quadro da escolha: zero edição
  de página, mas é token mentiroso (o nome diz roxo, a tela mostra vermelho); a skill `design-systems` trata isso como
  dívida, e a próxima pessoa que escrever `text-blue-600` não entende o que vê. Rejeitado.
- *`:root` em `public.css`*: `public.css` também carrega no app (é importada no root layout), então mudaria o app.

## R2 — Camadas de token

**Decision**: primitivo → semântico, sem camada de componente.
- **Primitivos** (valores da home, sem mudança): `--gelo`, `--grafite`, `--grafite-suave`, `--fio`, `--fio-forte`,
  `--pulso`, `--pulso-escuro`, `--campo-cinza`. **Um primitivo novo**: `--gelo-escuro`, superfície um degrau abaixo
  do gelo, porque o shadcn precisa de `muted`/`secondary`/`accent` (hover, painel, selo) e a home não tem superfície
  secundária.
- **Semântico**: as variáveis do shadcn, que os componentes já leem, apontam para os primitivos dentro de
  `[data-art="fluxo"]` (tabela em `data-model.md`). É o mesmo mapeamento que o rodapé da home já faz em
  `.fluxo-rodape`, subindo para a página inteira.
- **Acento como utilitário**: `--color-destaque: var(--pulso-escuro)` no `@theme inline` de `theme.css`, para
  `text-destaque`, `bg-destaque`, `border-destaque`. O `pulso-escuro` passa AA em texto pequeno (6,16:1); o `pulso`
  (4,79:1) fica para texto grande e linhas, como na home.

**Rationale**: "componente lê semântico" (design-systems). O botão do shadcn já pinta `bg-primary`; mapear
`--primary` para grafite pinta todos os botões públicos de uma vez, sem tocar no componente que o app também usa.

## R3 — As 440 cores fixas: limpeza no arquivo, não no token

**Decision**: trocar as classes de matiz fixa por classes semânticas nos arquivos que as páginas públicas alcançam,
seguindo a tabela abaixo. Inventário: 321 usos em 23 páginas de `(marketing)`, 30 em `components/marketing` (1
arquivo), 47 em `components/blog` (4), 26 em `components/calculadora-roi.tsx`, 12 em `config/` (city-data,
niche-data). `lib/ml/*` tem 3 arquivos com matiz, mas é código do app que só entra na folha porque o `@source "../lib"`
é amplo: fica fora.

| Hoje | Vira |
|---|---|
| `text-{matiz}-500…900` em ícone, texto, link | `text-foreground`; destaque de verdade (selo "popular", palavra-chave) → `text-destaque` |
| `text-{matiz}-300/400` (texto sobre fundo escuro) | `text-muted-foreground` |
| `bg-{matiz}-50…200`, `bg-{matiz}-500/5…/20` (selo, caixinha de ícone, faixa) | `bg-muted` |
| `bg-{matiz}-500…700` (botão, selo cheio) | `bg-primary text-primary-foreground` |
| `border-{matiz}-*` | `border-border`; borda de destaque → `border-foreground` |
| `bg-gradient-*`/`bg-linear-*` + `from/via/to-{matiz}` (fundo) | sem gradiente: `bg-muted` ou nada |
| `bg-clip-text` + gradiente (texto) | `text-foreground` (a palavra de destaque, se houver, `text-destaque`) |
| manchas `blur-2xl/3xl` decorativas | apagar o elemento |
| `rounded-full` em chip/selo (não em avatar, ponto ou interruptor) | `rounded` (4 px) |
| verde de enfeite (check de lista, selo "grátis") | `text-foreground` / `bg-muted` |
| verde/vermelho de estado (sucesso, erro de formulário) | fica, com ícone e texto (FR-012) |

**Rationale**: é o único caminho em que o nome da classe diz a cor da tela. A guarda (R8) impede a volta.

## R4 — Sombra, raio, pílula: regra de escopo para o que é compartilhado com o app

**Decision**: em `app/fluxo-pele.css`, dentro de `[data-art="fluxo"]`:
- `[class*="shadow"] { --tw-shadow: 0 0 #0000 }`. A sombra do Tailwind v4 mora inteira em `--tw-shadow` no próprio
  elemento (conferido na folha de produção: `.shadow-sm{--tw-shadow:0 1px 3px…;box-shadow:…,var(--tw-shadow)}`).
  Zerar só essa variável tira a sombra e **mantém o anel de foco**, que é `--tw-ring-shadow`.
- `--radius: 4px` e `:is(.rounded-xl, .rounded-2xl, .rounded-3xl) { border-radius: var(--radius) }`. Os raios são
  `calc(var(--radius) + 4/8/12px)`; sem a regra, o cartão do shadcn (`rounded-xl`) ficaria com 8 px.

**Rationale**: o `Card`, o `DropdownMenu` e o `Input` do shadcn são os mesmos do app; trocar a classe neles mudaria o
dashboard (FR-010). A regra só vale dentro do atributo. As regras de `fluxo-pele.css` entram na camada `public`
direto (não numa subcamada), e por isso vencem os utilitários do Tailwind (`public.utilities`) sem `!important`.

**Alternatives considered**: `* { box-shadow: none }` (o quadro da escolha): mata o anel de foco do teclado. Rejeitado.

## R5 — Sempre clara: a variante `dark:` ignora o escopo público

**Decision**: em `app/theme.css`, `@custom-variant dark (&:is(.dark *):not(:where([data-art] *)));`, e
`color-scheme: light` no escopo. As variáveis do shadcn já são redefinidas no próprio escopo (R2), então vencem as do
`.dark` no `<html>` por herança.

**Rationale**: 22 das 38 páginas têm classes `dark:`; elas pintam escuro para quem salvou o tema escuro no app. Uma
linha na variante resolve todas, e as que vierem depois. O `:where()` mantém a especificidade das classes `dark:`
igual à de hoje (zero a mais), então nada muda no app, que não tem `data-art`.

**Consequência aceita**: o rodapé da home, no tema escuro, deixa de pegar os `dark:` dele e fica claro como o resto da
home. Hoje é o único pedaço da home que escurece.

## R6 — Fontes: um módulo, duas páginas, a mesma instância

**Decision (revista na implementação)**: `components/fluxo/fontes.ts` tem a Schibsted e a DM Mono **sem preload**, e é
o que o layout `(marketing)`, o menu do celular e os 404 importam. A home **mantém as instâncias dela** em
`(fluxo)/layout.tsx`, com a Schibsted pré-carregada (o h1 dela é o LCP).

O plano original (um módulo, preload da Schibsted em todo lugar) foi medido e reprovado: o `next/font` **pré-carrega
toda fonte declarada num módulo importado**, então pôr uma instância sem preload no mesmo arquivo não adianta (a
`/pricing` seguiu recebendo `Link: …woff2; rel=preload` e passou a baixar as duas instâncias, 106 kb). Com preload,
`/pricing` +14% e `/blog` +38% de LCP (a fonte divide o 4G lento com o CSS bloqueante). Sem preload fora da home:
`/pricing` +1%, `/blog` −9%, home −10% (o CSS público ficou menor). Custo aceito: quem navega da home para outra página
baixa a Schibsted duas vezes (instâncias diferentes, ~40 kb).

No `theme.css`,
`--font-mono: var(--fonte-mono-base, var(--font-geist-mono))`: dentro do escopo, `font-mono` é a DM Mono; no app, onde
a variável da DM Mono não existe, continua a Geist Mono dos números do dashboard.

**Rationale**: `font-mono` hoje compila para `font-family: var(--font-geist-mono)` (conferido); a indireção é a menor
troca que dá a DM Mono aos rótulos públicos sem mexer no app.

## R7 — Menu

**Decision**: o menu completo fica. Muda só a pele: fundo gelo sólido (sai o `bg-background/80 backdrop-blur-sm`), o
link "Indique e Ganhe" deixa de ser azul (`text-primary` já vira grafite pelo mapeamento), o botão "Começar grátis"
fica grafite pelo mapeamento.

## R8 — Guarda de paleta

**Decision**: um `describe` novo em `__tests__/styles/public-css-guard.test.ts`, reusando o `importGraph` que já
percorre os imports a partir das rotas públicas. Falha e diz o arquivo quando um arquivo alcançado (fora de
`components/ui`, que é do app também) tem classe de matiz proibida (`purple|violet|indigo|blue|fuchsia|pink|sky|cyan`),
gradiente (`bg-gradient-to-*`, `bg-linear-to-*`) ou mancha (`blur-2xl`, `blur-3xl`).

**Rationale**: o mesmo percorredor da guarda da 007; a lista de arquivos é a das páginas públicas de verdade, não uma
pasta inteira (o `lib/ml` fica fora sozinho).

Na implementação a guarda ganhou um segundo teste: os posts (`lib/blog/posts`) não podem ter cor em hex no HTML
(branco é a exceção). E passou a pegar gradiente arbitrário (`bg-[radial-gradient(…)]`).

(A "exceção do `Progress`" desta seção estava errada: o `table-of-contents` não usa o componente; o grep tinha achado
o comentário `{/* Reading Progress */}`.)

## R10 — O que a limpeza de classes não alcançava (achado na implementação)

- **Cor inline no HTML dos posts**: 45 dos 46 posts, ~5.000 cores em `style=""` (tabelas, caixas, CTAs). Um codemod
  percorre o HTML tag a tag, leva o fundo original de pai para filho, e troca cada cor pela variável da pele conforme
  a propriedade e a luminosidade (OKLCH): fundo claro → `--muted`, fundo cheio → `--primary`, texto → `--foreground`
  ou, sobre fundo escuro, `--primary-foreground`; só o vermelho vivo vira pulso.
- **`.prose` do `base.css`** (compartilhado com o app): h3 e marcadores azuis com `!important` e 8 caixas `callout-*`
  com gradiente e sombra. Sobrescritos em `fluxo-pele.css` **dentro de `@layer utilities`**: para `!important` a
  cascata inverte a ordem das camadas, e fora dessa subcamada a regra perderia.
- **Cinza do `@tailwindcss/typography`** (gray-700/900, croma .034): variáveis `--tw-prose-*` no escopo.
- **Foco verde**: `base.css` desenha todo `:focus-visible` em `#00a884` (verde do WhatsApp). No escopo, `outline-color`
  vira o pulso escuro.
- **Gradiente que era o fundo de texto branco**: ao tirar o gradiente, o texto ficava branco sobre gelo. Os 13 casos
  ganharam `bg-primary` (ou `bg-destaque` quando o gradiente era vermelho/laranja).

## R11 — Como medir no Windows + OneDrive (achado na implementação)

A régua da 007 medida em momentos diferentes não compara: a home, idêntica pixel a pixel, variou de 1.8 a 3.7 s no
mesmo dia. E um `next start` servido de dentro do OneDrive saiu ~2× mais lento que o mesmo build servido de
`C:\Users\…` (o `.next` recém-gerado sincronizando). O método que valeu: os dois builds **fora do OneDrive**, lado a
lado (3998 antes, 3999 depois), 5 rodadas intercaladas alternando a ordem, terceiros bloqueados (`BLOQUEIA=1`).

## R9 — Medição

**Decision**: régua da 007 (build de produção local, `npx next build` + `next start`, CDP 4G lento 150 ms / 1,6 Mbps,
CPU 4×, 390×844, mediana de 3) em `/`, `/pricing` e `/blog`, **antes** (medido de novo no começo, mesma máquina) e
depois. Retratos 1366 e 390 da amostra da US1, antes e depois, com a folha B ao lado.
