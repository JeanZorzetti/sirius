# Handoff: home "Fluxo" (2026-09-23, noite)

## Estado em uma linha
A home trocou a Carta de Bayer pela direção **Fluxo**. Build, tipos, código morto, prova visual (3 larguras) e
métricas locais passaram, e o commit foi para `main`, que publica sozinho. Falta o que é do app inteiro: LCP no
campo, marca nas outras páginas e prova social.

## Contexto
- A Carta de Bayer foi recusada inteira no mesmo dia em que entrou no ar. O dono não soube dizer o motivo.
- Uma folha de contato com 7 variantes, cada uma mudando um eixo só (banda, temperatura, acento, fonte, estrutura,
  gesto, escala), deu **7× "igual"**. O problema era a ideia (um atlas de 1603 tirado do nome da marca), não o
  acabamento.
- Duas trincas foram mostradas **como imagem** (um quadro estático do hero por direção):
  - A Trilho, B Quadro da Sala, C Conversa: "quero mais 3";
  - D Contador, E Letreiro, F Fluxo: **F**.
- As cinco preteridas estão no [.art/log.json](.art/log.json). Quatro delas, e a Carta, encenavam o pipeline de
  exemplo; o Fluxo não usa dado nenhum.

## Feito

### 1. Direção Fluxo (`custom:recombinacao-campo`, eixos campo · scroll · clara)
- **O gesto:** cada lead é uma linha que entra embolada (WhatsApp, ligação, Google Maps, indicação, planilha) e sai
  penteada num pulso vermelho periódico, "receita, todo mês". O scroll avança o pente: em 60vh o embolado recua de
  60% para 18% da largura.
- **Estrutura "percurso":** caos no hero → as 8 faixas (O que é o Sirius) → planos → leituras → o pulso no fecho.
  Nav e rodapé do site foram mantidos por navegação e pelos links internos de SEO.
- **Arquivos**:
  - [app/[locale]/(fluxo)/](app/[locale]/(fluxo)/): `layout.tsx` (fontes com escopo), `page.tsx` (metadata e os 4
    JSON-LD **iguais**) e `fluxo.css` (tudo sob `[data-art="fluxo"]`);
  - [components/fluxo/geometria.ts](components/fluxo/geometria.ts): **fonte única** da geometria, usada pelo SVG de
    reserva e pelo canvas;
  - [components/fluxo/campo.tsx](components/fluxo/campo.tsx) (client de propósito: o SVG vai no HTML uma vez só, sem
    cópia no payload do RSC) e [components/fluxo/campo-vivo.tsx](components/fluxo/campo-vivo.tsx) (canvas; redesenha
    só quando o pente anda, então não há loop para pausar).
- **Camadas:**
  - entrada: o campo chega da esquerda;
  - scroll: o canvas penteia, as faixas são traçadas por `view()` e o pulso do fecho é desenhado;
  - ponteiro: faixa e botão viram vermelho. O canvas **não** responde ao ponteiro, porque redesenhar 190 linhas a
    60fps custaria INP;
  - transição: ausente, é uma página só.
- **Fallback:** o SVG do campo em repouso (24 linhas + pulso) está no HTML. Sem JS, a tela tem composição.
  `prefers-reduced-motion` desenha um frame e para.
- **Tokens:** OKLCH com hex de reserva, nomeados pela direção.

  | Token | Uso | Contraste no `--gelo` |
  |---|---|---|
  | `--gelo` | fundo | — |
  | `--grafite` | texto, botão | 16,1:1 |
  | `--grafite-suave` | texto secundário | 6,9:1 |
  | `--pulso` | h1 destacado, pulso, faixa sob o ponteiro | 4,8:1 (só texto grande) |
  | `--pulso-escuro` | texto pequeno vermelho, botão sob o ponteiro | 6,2:1 |
  | `--campo-linha` / `--campo-pulso` | cores do canvas, em rgba de propósito | — |

- **Fontes:** Schibsted Grotesk (texto e display, pré-carregada) e DM Mono (rótulos, sem pré-carga). Saíram da home a
  Bricolage e a EB Garamond grega. O wordmark é path SVG e não precisa de fonte.

### 2. Texto
- h1 em caixa de frase: "Transforme leads em **receita recorrente.**" (`hero.title_*`).
- Os CTAs exclusivos da home foram para caixa de frase: `hero.cta1`, `plans.startFree`, `cta.btnPrimary` e
  `cta.btnSecondary`.
- A chave nova `hero.ctaNav` alimenta o botão da nav. **`marketing.home.nav` não mudou:** é compartilhada com o
  layout `(marketing)` e com os menus.

### 3. Removido
O grupo `(carta)`, [components/carta/](components/carta/) (`prancha.tsx`, `estrelas.ts`), o texto sobre Bayer e o
colofão das fontes. [lib/pipeline-defaults.ts](lib/pipeline-defaults.ts) continua, lido pelo cadastro e pelo seed.

## Medido
Build de produção local, Playwright + CDP, 4G lento (150ms / 1,6 Mbps), CPU 4×, 390×844, mediana de 3.

| | Fluxo | Carta |
|---|---|---|
| LCP | **2,5s** (o h1; FCP = LCP) | 4,9s |
| CLS | 0 | 0 |
| JS da direção | **1,9 kb gz** | 3,2 kb gz |
| CSS da direção | 3,4 kb gz | 5,6 kb gz |
| HTML | 43,6 kb gz | 41,1 kb gz |
| Fontes transferidas | **99 kb** | ~287 kb |

- O perfil da Carta não registrou a viewport, então a comparação de LCP é indicativa.
- **JS total da página: 516 kb transferidos.** Os 17 chunks do HTML somam 228 kb gz; o resto chega depois do load
  (GTM, PostHog, o que o root layout hidrata em toda rota). O problema é do app, não da direção.
- **Gates da art-direction: 35/35.** Reprovou e foi corrigido: G8 (tokens `--fundo`, `--tinta` e `--vermelho` eram
  genéricos).
- **Prova:** 3 larguras × 4 posições de scroll, hover, movimento reduzido, sem JS e teclado. Console limpo, sem
  estouro horizontal, um h1 só.

## Próximos passos (em ordem)
1. **LCP e JS do app inteiro, com `web-performance`.** A home está no limite (2,5s). O que resta é a tarefa longa de
   hidratação do root layout (PostHog, Theme, PWA×3, Toaster, AiTrafficMonitor, GTM) e a Geist do root layout.
   Diagnóstico na spec 005.
2. **Espalhar a marca** (continua do handoff anterior):
   - o header de [app/[locale]/(marketing)/layout.tsx](app/[locale]/(marketing)/layout.tsx) ainda usa `/logo.png`;
   - favicon, `apple-icon` e OG (o `/og-image.png` da home **não existe** em `public/`);
   - os ícones de PWA.
   Ver o histórico deste arquivo no commit `3a9c6ed`.
3. **Texto, com `conversion-copy` / `ux-writing`:** as 8 faixas (`FAIXAS`) e o texto dos planos estão escritos
   direto em `page.tsx`. Mover para `messages/pt-BR/marketing.json` se for manter o padrão de i18n.
4. **Prova social real:** pedir depoimentos aos 6 pagantes (Cartopel, 3A3, Wordseg, VOE, London Finance e Boxer).
5. **Verificar os números de `about.description`** ("100 empresas, 110 usuários, 950 negócios") contra o banco. A
   leitura de 22/09 deu 108 contas. O texto é anterior a esta direção.

## Pendências / decisões em aberto
- **Levar o Fluxo para as outras páginas de marketing?** Só se o Jean pedir. Nesse caso, promover os tokens de
  `(fluxo)/fluxo.css` para o global, e `design-systems` formaliza.
- **360×640:** o texto do hero ocupa a primeira tela e o campo começa na dobra. Num celular de 844 de altura o campo
  aparece.
- **O texto do botão da nav** vem de `hero.ctaNav`. Se um dia a nav compartilhada virar caixa de frase, apagar essa
  chave.

## Gotchas do ambiente
- **`[locale]` num pathspec do git é glob.** Usar `git --literal-pathspecs add` e conferir `git diff --cached --stat`.
- **`npm run build` roda `prisma migrate deploy`.** Para build local, usar `npx next build` (~3 min neste Windows).
- **Apagar uma rota deixa `.next/types/validator.ts` apontando para ela.** O `tsc -p tsconfig.build.json` falha até
  o próximo `next build` regenerar o arquivo.
- **`TaskStop` no `npx next start` não mata o node filho.** O servidor velho continua na porta e serve o build novo
  sem CSS. Matar pelo dono da porta (`Get-NetTCPConnection -LocalPort <p>`).
- **`next dev` 16.3 acrescenta ao `CLAUDE.md`** um bloco `nextjs-agent-rules`. Está não-commitado no working tree.
- **Push em `main` = deploy.** Conferir a TELA, não só o HTTP 200.
- **O working tree tem mudanças de outras sessões** (`e2e/`, `.specify/`, `docs/`, `scripts/reset-onboarding.ts`).
  Nunca usar `git add -A` sem pathspec.
- Os scripts de prova (`prova.cjs`, `pente.cjs`, `medir.cjs`) e das folhas de contato vivem no scratchpad da sessão.
  O script da folha é da skill: `~/.claude/skills/art-direction/scripts/folha-de-contato.mjs`.
