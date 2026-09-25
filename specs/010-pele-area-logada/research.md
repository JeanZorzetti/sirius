# Research: a área logada veste a pele do Pipeline (spec 010)

Inventário e decisões de 25/09/2026. Escopo: as rotas que carregam `app/globals.css` (dashboard, `(admin)`, `admin`,
`(ia)`, `checkout/sucesso`, `debug`) e os componentes que elas usam.

## R1 — Onde moram os tokens: `app/app-pele.css`, só na folha do app

**Decisão**: arquivo novo `app/app-pele.css`, importado só por `app/globals.css`, depois de `base.css`, sem camada.
Ele redefine no `:root` e no `.dark` as variáveis do shadcn e as variáveis da paleta do Tailwind.

**Por quê**: `base.css` e `theme.css` também entram na folha pública (`public.css`, camada `public`). A pele pública
(`fluxo-pele.css`) sobrescreve nas páginas públicas só as variáveis do shadcn que ela conhece. As da paleta
(`--color-zinc-*` e outras), as da barra lateral e as dos gráficos passariam para as páginas públicas, o que viola a
SC-006. Numa folha só do app, a página pública aberta direto não recebe nada.

Sem camada, a folha ganha da `@layer theme` do Tailwind (onde moram as variáveis da paleta) e da camada `public`
inteira. Isso também vale quando as duas folhas convivem depois de uma navegação no cliente.

**Alternativas recusadas**:
- editar `base.css` ou `theme.css`: vaza para as páginas públicas;
- um atributo de escopo no layout (`[data-art]` ou `[data-tela]`): o diálogo, o menu e a lista de opções saem por
  portal para o `<body>`, fora do escopo;
- `:root:has(...)`: foi tirado do dashboard em `fb4ec18`, porque a tela transmite e hidrata centenas de nós.

**Vazamento aceito**: depois de uma navegação no cliente do app para uma página pública (o "Indique e Ganhe" da barra
lateral, por exemplo), a folha do app continua no documento. É o que já acontece hoje com `base.css`. As páginas
públicas vestem a mesma família de pele, então o efeito é o gelo e o grafite do app no lugar dos da home, que são
iguais.

## R2 — As 6.227 cores fixas: remapear a paleta, não editar as classes

**Decisão**: `app-pele.css` redefine as variáveis da paleta do Tailwind:

| Grupo de matizes | Vira |
|---|---|
| `zinc`, `slate`, `gray`, `neutral`, `stone` | rampa gelo→grafite; 800–950 no matiz da noite |
| `indigo`, `violet`, `purple`, `blue`, `sky`, `cyan`, `fuchsia`, `pink`, `teal` (decorativas) | a mesma rampa neutra |
| `green`, `emerald`, `lime` | verde (matiz 152) |
| `amber`, `yellow`, `orange` | âmbar (matiz 75) |
| `red`, `rose` | pulso (matiz 29) |
| `white` | cartão |

**A luminosidade de cada degrau é a do Tailwind** para aquele degrau; só matiz e croma mudam. Assim todo par de
contraste que existe hoje (texto `zinc-500` sobre branco, por exemplo) fica igual ou melhora. As rampas de status em
luminosidade neutra também melhoram texto branco sobre `green-500` e `amber-500`, que hoje reprovam em AA.

**Por quê**: no Tailwind v4 as utilidades leem a cor por `var(--color-<matiz>-<degrau>)`. Redefinir a variável alcança
as 6.227 classes, as 1.301 variantes `dark:` e as classes montadas em tempo de execução (`bg-${cor}-100`), com zero
arquivo editado. A conferência é no CSS compilado (T002).

**Alternativa adiada**: trocar os nomes das classes por codemod pela AST (1.427 decorativas). O desenho sai idêntico
ao do remapeamento, e o diff fica enorme. Fica para quando alguém se confundir com "índigo que desenha grafite".
Enquanto isso, a guarda (R8) impede a porta que o remapeamento não fecha.

## R3 — Tokens semânticos

**Decisão**:
- **Claro**: os valores do Pipeline (`hoje.css`) no `:root`.
- **Escuro**: a noite do Pipeline no `.dark`: botão principal, item ativo e anel de foco em âmbar, e canto de 4 px.
- **Gráficos** (`--chart-1..5`): grafite, pulso, verde, âmbar e grafite suave; no escuro, gelo-quente, âmbar, verde,
  pulso e cinza.
- **Anel de foco**: grafite no claro e âmbar no escuro, nunca vermelho. O contorno verde do WhatsApp (`#00a884`) que
  `base.css` põe em todo foco de teclado é sobrescrito.

O `hoje.css` passa a usar o anel grafite, única mudança no Pipeline (FR-012 com essa exceção declarada).

## R4 — O que token não alcança: regras de pele em `app-pele.css`

- **Sombra zero**, exceto nas camadas que flutuam: `[data-slot$="-content"]` do diálogo, da gaveta, do popover, do menu
  e da lista de opções, e os avisos do sonner. A técnica é a de `fluxo-pele.css`: zerar `--tw-shadow` preserva o anel
  de foco.
- **Canto de 4 px** em `rounded-md` até `rounded-3xl`. `theme.css` deriva esses cantos de `--radius` com `calc()`, e
  sairiam 2/8/12/16 px. Pílula (`rounded-full` com `px-`) também vira 4 px; círculo continua redondo.
- **Sem vidro**: `backdrop-filter: none`. As manchas de brilho (`blur-[100px]` e similares) somem.
- **Gradiente achatado na cor de partida**: `background-image: none; background-color: var(--tw-gradient-from)`.
  Motivo: a memória da 008 registrou 13 casos de gradiente que era o fundo de um texto branco; tirar só o gradiente
  deixaria o texto sumir. Ficam de fora as sobreposições `from-black`, `from-transparent` e `from-white`, que dão
  legibilidade sobre imagem.

## R5 — Tipografia: as fontes do Pipeline no `:root`, via `<style>` nos layouts do app

**Decisão**: os layouts `dashboard`, `(admin)` e `(ia)` renderizam
`<style>{':root{--fonte-texto-base:…;--fonte-mono-base:…}'}</style>`, com `texto.style.fontFamily` e
`mono.style.fontFamily` do `fontes-hoje.ts`. Ficam valendo o `display: 'optional'` e a ausência de preload. O
`app-pele.css` aponta `--default-font-family` para a variável; o `theme.css` já aponta `--font-mono` para
`--fonte-mono-base`.

**Por quê**: a classe `.variable` do `next/font` só define a variável no elemento onde é posta, e o portal do
diálogo nasce no `<body>`, que pertence ao layout raiz compartilhado com as páginas públicas. Pelo `<style>` no
`:root`, a variável vale nos portais e some com o layout na navegação para fora do app.

**Custo**: as outras telas do app passam a baixar as mesmas duas fontes do Pipeline (63 kb). O login redireciona para
o Pipeline, então no uso normal elas já estão em cache.

## R6 — A moldura, à mão

- **Barra lateral**: deixa de flutuar (sem margem, vidro, sombra, brilho nem canto) e fica presa à borda com
  `bg-sidebar` e `border-r`. O item ativo passa de índigo para os tokens `sidebar-accent` e `sidebar-primary`. O
  gradiente do item ativo e o do "Modo IA" saem.
- **Barra inferior do celular**: a barra índigo do item ativo passa a `bg-primary` e o texto ativo a `text-primary`.
- **Barra do topo do celular e faixa do período de teste**: conferidas pelos retratos; recebem ajuste à mão só se
  sobrar cor fora da pele.
- **Botão do assistente**: `bg-primary text-primary-foreground` em todas as telas. Saem o `data-assistente="hoje"` e a
  regra especial em `hoje.css`.

## R7 — As 480 cores em hexadecimal: codemod pela AST com tabela de destino

**Decisão**: script pela AST do TypeScript (padrão da 008: StringLiteral, NoSubstitutionTemplateLiteral e partes de
template). Ele troca cada hex da tabela pela variável de destino, e simula antes de escrever. Pontos de risco:
- concatenação de hex com alfa (`${cor}20`);
- cor escrita em `<stop>` de gradiente SVG;
- o diff de cada arquivo com mais de 10 trocas, revisado à mão.

| Hex (uso) | Destino |
|---|---|
| `#111b21` | `var(--foreground)` |
| `#667781`, `#8696a0`, `#54656f`, `#3b4a54`, `#64748b`, `#71717a`, `#94a3b8` | `var(--muted-foreground)` |
| `#f0f2f5`, `#e9edef`, `#efeae2`, `#e2e8f0` | `var(--muted)` |
| `#d9fdd3`, `#c4edc0`, `#b8e6b4` (balão enviado) | `var(--secondary)` |
| `#00a884`, `#008f72` (acento do chat) | `var(--primary)` |
| `#3b82f6`, `#6366f1`, `#4f46e5`, `#8b5cf6`, `#a855f7`, `#06b6d4`, `#14b8a6`, `#ec4899` (séries) | `var(--chart-1)`…`var(--chart-5)`, na ordem de aparição no arquivo |
| `#22c55e`, `#10b981` | `var(--color-green-500)` |
| `#f59e0b`, `#fbbf24`, `#eab308`, `#f97316` | `var(--color-amber-500)` |
| `#ef4444`, `#f43f5e`, `#f87171` | `var(--color-red-500)` |
| `#334155`, `#1e293b` | `var(--foreground)` |

**Ficam como estão**:
- `#25d366`, o verde da marca WhatsApp, quando desenha o logo;
- as cores que o usuário escolhe (paleta de cor de projeto, etiqueta e etapa);
- os e-mails.

## R8 — Guarda

**Decisão**: `__tests__/styles/app-color-guard.test.ts`, com dois testes.

1. Nenhum literal de cor (hex, `rgb()`, `hsl()`, `oklch()`) nos arquivos do app fora de uma lista curta de exceções:
   logo de marca, paleta de dado do usuário e e-mails. O teste falha com o arquivo e a linha.
2. O `app-pele.css` remapeia todas as 22 matizes da paleta do Tailwind. Assim uma matiz nova no Tailwind não
   atravessa sem pele.

**Por quê**: com a paleta remapeada, classe decorativa não desenha mais cor. A única porta que sobra é o literal.

## R9 — Medição

- **Desempenho**: régua da 009, em produção, 390×844, 4G lento (150 ms, 1,6 Mbps), CPU 4×, cache desligado, terceiros
  bloqueados e mediana de 5. Rotas: `/dashboard/contacts`, `/dashboard/tasks` e `/dashboard`. O "antes" é medido
  antes do push.
- **Cor computada** (SC-001): script Playwright que percorre os elementos visíveis. Para cada `color`,
  `background-color` e `border-color` convertida a OKLCH, marca o que tem croma acima de 0,04 fora das faixas do
  verde (140–165), do âmbar (60–90) e do pulso (20–40). Imagem, `<video>`, `<svg>` de marca e itens com
  `data-cor-do-usuario` ficam de fora.
- **Contraste**: o mesmo script mede texto contra fundo efetivo.
- **Retratos**: 12 telas da spec × 2 larguras × 2 temas, antes e depois.
