# Research: Página pública só baixa o CSS que usa

Medições de 24/09 com o compilador do próprio projeto (Tailwind 4.1.18, `@tailwindcss/postcss`, minify), na régua
em que o `globals.css` de hoje dá 416,4 kb crus e 48,5 kb gz. O arquivo do build do Next dá 53,2 kb gz: o
minificador é outro, e a proporção se mantém. Scripts no scratchpad da sessão: `grafo.cjs`, `folha.mjs` e
`proto.mjs`.

## R1 — O que entra na folha pública

| Recorte | Tamanho | Nota |
|---|---|---|
| Hoje (detecção automática, repositório inteiro) | 416,4 kb / **48,5 kb gz** | |
| Só docs/specs/roadmaps fora | 415,9 kb / 48,5 kb gz | só 7 classes vêm de fora do código |
| Automático menos as rotas do app | 386,7 kb / 45,5 kb gz | o peso está nos componentes, não nas rotas |
| **Pastas que as rotas públicas importam** | 220,4 kb / **28,5 kb gz** | escolhido |
| Arquivo a arquivo (196 arquivos do grafo) | 211,6 kb / 27,3 kb gz | piso. Nenhuma classe dele falta no recorte por pastas |

- **Decision**: `@source` por pasta: os grupos `(marketing)` e `(fluxo)`, o root layout, o 404 e as páginas de erro,
  `components/{ui,marketing,blog,brand,fluxo,seo,analytics}`, os três componentes soltos que o grafo alcança
  (`calculadora-roi`, `theme-provider`, `pwa-register`), `lib` e `config`.
- **Rationale**: fica a 1,2 kb do piso. Uma classe nova numa pasta já listada entra sozinha (FR-007). Um teste
  de guarda percorre o grafo de imports das rotas públicas e falha se algum arquivo alcançado estiver fora das
  pastas listadas, e a mensagem diz qual arquivo é.
- **Alternatives considered**: lista gerada do grafo a cada build. Exigiria um passo antes do `next build`, e o
  Dockerfile chama o `next build` direto. Lista de exclusão: 45,5 kb, quase sem ganho.
- `[locale]` e `(marketing)` no `@source` funcionam como caminho, não como glob: 5 classes que só existem nas
  páginas públicas (`min-h-[80vh]`, `lg:text-[5rem]` etc.) estão na folha.

## R2 — Navegação entre as duas folhas na mesma aba

O Next (React 19) não remove a folha de uma rota quando o usuário sai dela. Se as duas folhas fossem Tailwind
comum, a ordem entre elas dependeria de qual chegou primeiro, e isso quebra a ordem das variantes. Exemplo: um
elemento do dashboard com `p-6 md:p-2`. Se o usuário abriu o dashboard, foi ao `/pricing` e voltou, a folha
pública (que tem `p-6`, mas não `md:p-2`) fica depois da do app, e o `p-6` dela vence o `md:p-2` da folha do app
em tela média.

- **Decision**: a folha pública inteira mora na camada `public`, e as duas folhas declaram essa camada antes das
  do Tailwind. A ordem fica `properties < public < theme < base < components < utilities`, qualquer que seja a
  folha que chegou primeiro. Quando a folha do app está presente, ela decide tudo, como hoje. A folha do app
  contém todas as classes da pública, porque varre o repositório inteiro.
- **Rationale**: conserta o problema pela cascata, não pela ordem de carga. Não move rota nenhuma.
- **Alternatives considered**:
  - **Root layouts separados** (público e app), com recarga completa entre os dois mundos: move ~40 pastas de
    rota e o 404, e a home e o `/pricing` só continuariam com navegação client se ficassem sob o mesmo root. É muita
    mudança para o mesmo efeito.
  - **Folha do app = pública + complemento**: quebra a ordem das variantes do mesmo jeito (`p-6` só no
    complemento, depois de um `md:p-2` da pública).

## R3 — Montagem dos arquivos

O Tailwind recusa `@utility`, `@custom-variant` e `@theme` dentro de camada (`cannot be nested`). O
`tw-animate-css` define `@utility`, e o `globals.css` usa `@custom-variant` e `@theme`.

- **Decision**: o `globals.css` vira três arquivos. O conteúdo é movido sem ser reescrito.
  - `app/theme.css`: `@custom-variant dark` e `@theme inline` (linhas 5–48 de hoje). São diretivas e não geram
    regra.
  - `app/base.css`: tokens `:root`/`.dark`, `@layer base` e `@layer utilities` (linhas 50–917 de hoje).
  - `app/globals.css` (folha do app): `@layer properties, public;`, depois os três imports de hoje, `theme.css` e
    `base.css`.
  - `app/public.css`: `@layer properties, public;`, `@import "tailwindcss" layer(public) source(none)`, os
    `@source`, `tw-animate-css` sem camada, o plugin de tipografia, `theme.css` e `@import "./base.css"
    layer(public)`.
- **Verificado no protótipo**: a folha do app compilada é **idêntica** à de hoje, tirando a declaração da camada.
  Na pública, o que fica fora da camada são 84 `@property`, 7 `@keyframes` (do Tailwind e do `tw-animate-css`) e a
  camada `properties`, que o Tailwind sobe para o topo. As três coisas são iguais nas duas folhas.

## R4 — Onde cada folha entra

- **Decision**: o root layout (`app/[locale]/layout.tsx`) troca `globals.css` por `public.css`. As rotas do app
  importam também o `globals.css`: `dashboard/layout.tsx`, `(admin)/layout.tsx`, `(ia)/layout.tsx` e as três
  páginas sem layout próprio (`admin/generative-ui-analytics`, `checkout/sucesso` e `debug`).
- **Rationale**: toda rota sob `[locale]` recebe a folha pública pelo root. Por construção, nenhuma fica sem
  estilo (FR-003), inclusive o 404 e as de erro. No app, a folha pública é inerte, porque a camada dela é a mais
  baixa.
- **Custo aceito**: quem abre o app a frio baixa também a folha pública (28,5 kb gz, em cache daí em diante), e o
  navegador casa ~200 kb de regras a mais. Quem chega pelo `/login` já tem a pública em cache.
- **Guarda**: um teste confere que toda `page.tsx` sob `[locale]` fora de `(marketing)` e `(fluxo)` tem, nela
  ou num layout acima, o import do `globals.css`.

## R5 — Geist

- Em produção (`/pricing`, 24/09): `html` e `body` resolvem para `ui-sans-serif, system-ui…`, e
  `--font-geist-sans` só existe no `body`. O preflight do Tailwind põe a fonte no `html`, que resolve a variável
  como vazia. Resultado: 1 woff2 da Geist baixado e nenhuma face em `document.fonts`.
- Usam a Geist de verdade: o layout `(ia)` (`font-[family-name:var(--font-geist-sans)]`) e os elementos com
  `font-sans`. Em página pública, o único candidato é `calculadora-roi.tsx`.
- **Decision**: `preload: false` na Geist do root layout. A `@font-face` continua declarada e a variável continua
  no `body`, então quem desenha com ela baixa a fonte quando precisa. Quem não desenha não baixa.
- **Rationale**: uma linha, e o visual não muda em nenhuma página. A área de IA perde o preload: pode haver troca
  de fonte na primeira visita, com o fallback ajustado do `next/font`.
- **Alternatives considered**: declarar a Geist por layout de grupo. Os portais (dialog, dropdown, toast)
  renderizam no `body`, fora do layout do grupo, e perderiam a variável.
- **Fora do escopo**: a Geist nunca foi aplicada ao site. Aplicá-la trocaria a fonte de todas as telas, e isso
  é decisão de design. Vai para o handoff.
