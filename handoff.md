# Handoff: home "Carta de Bayer" + marca nova do Sirius (2026-09-23)

> **Atualização 23/09 (noite):** passo 1 parcialmente feito. A spec 005 cortou as mensagens do client
> (HTML −37% em toda rota), mas o LCP é das fontes e da hidratação. Ver passo 1.

## Estado em uma linha
A home nova e a marca de pingos estão **no ar** (commit `4e915dc`, verificado em produção no desktop e no celular em
23/09, console limpo, fontes e CSS carregando). Falta espalhar a marca pelo resto do site e baixar o LCP, que é
problema do app inteiro e não da home.

## Contexto
Pedido: `/art-direction` na home. A cara anterior (indigo→roxo→rosa, Geist, glass, badge pílula, avatares em
degradê) era **herdada do gerador**: o Jean confirmou que podia matar. Ele também pediu `logo-design` **antes**
da direção e referências do próprio setor além das de fora. Nesta ordem: marca → pesquisa → 3 direções → escolha →
construção → gates → prova → deploy.

## Feito

### 1. Marca (aprovada)
- **Wordmark "sirius"** em [components/brand/wordmark.tsx](components/brand/wordmark.tsx): Bricolage Grotesque
  (OFL), wght 800, opsz 96, wdth 92, desenhada como path. Os pingos dos dois "i" são **Sirius A e Sirius B**, a
  estrela binária:
  - pingo A = 1,5× o pingo da fonte;
  - pingo B = A ÷ √(2,063/1,018) = A ÷ 1,42 (razão de massa real).
  Três leituras: "pôr os pingos nos is", estrela binária, e a relação entre dois corpos (o "R" de CRM).
- **Símbolo** = os dois pingos soltos, em [components/brand/pingos.tsx](components/brand/pingos.tsx). É para
  favicon, ícone do app e avatar.
- O pingo A é um path próprio com `fill="var(--marca-pingo, currentColor)"`. A direção pinta de vermelhão; fora
  dela, a marca é de uma cor só.
- [public/icon.svg](public/icon.svg): favicon com cor fixa e dark mode interno. **Ainda não está ligado.**
- A receita de regeração está no comentário de cada componente. O script gerador era descartável e não existe mais.
- Descartadas:
  - estrela de 5 raios, um por etapa (lia como distintivo de xerife);
  - cometa de 5 cartas (lia como queda);
  - "i" com o pingo A (a 16px vira ícone de "informação").

### 2. Direção "Carta de Bayer" (aprovada e publicada)
- `custom:derivada-uranometria`, eixos **pigmento · scroll · clara**. Registro em [.art/log.json](.art/log.json).
- Recusadas na trinca: *Planisfério* (disco de lata que gira) e *O Pingo* (o pingo atravessa a página).
- Referências abertas:
  - 6 CRMs (Pipedrive, Attio, RD, Kommo, HubSpot, folk), só como lista do que evitar. Lugar-comum do setor: print
    da UI flutuando, banda pastel, ✨ de IA;
  - a *Uranometria* de Bayer (1603, prancha do Cão Maior);
  - o Philips' Planisphere.
- **Raio**: a home saiu de `(marketing)` para um grupo próprio, [app/[locale]/(carta)/](app/[locale]/(carta)/), com
  `layout.tsx` (fontes com escopo, nav que é só a marca e a entrada) e `carta.css` (tudo sob
  `[data-art="carta"]`). **As outras páginas públicas não mudaram.** O `<Footer />` do site foi re-tintado só
  nesta rota, via tokens com escopo.
- **Prancha I**: os negócios de exemplo desenhados como prancha de atlas.
  - x = etapa, y = prazo em dias, com uma linha do "hoje" e hachura no passado;
  - área da estrela = valor, e a letra grega vai do maior (α) para o menor;
  - quadro de magnitude, como nas pranchas de Bayer;
  - hover, foco ou toque na estrela abre a ficha com a nota real do negócio.
- **Seções**: Prancha II (catálogo α→ζ), Prancha III (O que é o Sirius + 8 instrumentos), Prancha IV (planos),
  Leituras (3 posts do blog) e Colofão com o CTA. Metadata e os 4 JSON-LD foram mantidos iguais.
- **Coreografia** com um verbo só, "gravar": a retícula é desenhada, as estrelas são carimbadas, as letras são
  cortadas a buril no scroll e a régua de cada folha é gravada na transição. `prefers-reduced-motion` mostra o
  estado final.
- **Tokens (OKLCH com fallback hex)**:

  | Token | Uso | Contraste |
  |---|---|---|
  | `--papel` | fundo | — |
  | `--mesa` | fundo da página | — |
  | `--tinta` | texto | 14,9:1 |
  | `--tinta-suave` | texto secundário | 6,6:1 |
  | `--vermelhao` | α, pingo A, texto grande | 4,46:1 |
  | `--vermelhao-tinta` | botão e texto pequeno | 5,7:1 |
  | `--vermelhao-fundo` | hover do botão | 7,4:1 |
  | `--aguada` | só a coreografia | — |

### 3. Fonte única do pipeline padrão
[lib/pipeline-defaults.ts](lib/pipeline-defaults.ts) exporta `DEFAULT_STAGES` (Lead, Prospecção, Qualificação,
Proposta, Fechamento) e `DEMO_DEALS` (os 6 negócios de exemplo). Quem lê:
- [app/auth/actions.ts](app/auth/actions.ts) (cadastro);
- [lib/seed-demo-data.ts](lib/seed-demo-data.ts) (seed);
- [components/carta/](components/carta/) (a prancha).

Se o seed mudar, a home muda junto. **A prancha não pode mentir.**

### 4. Removido da home
- Os 3 depoimentos (Carlos Silva/TechFlow, Mariana Souza/GrowHub, Rafael Alves/ScaleUp), que pareciam inventados.
- O "+100 empresas" com avatares em degradê.

## Medido (build de produção local, Playwright + CDP, 4G lento 150ms/1,6 Mbps, CPU 4×, mediana de 3)
| | Home nova | Home antiga (mesmo perfil) |
|---|---|---|
| JS transferido | 122 kb (o design novo soma **3,2 kb** gz) | 297 kb |
| CSS da direção | 5,6 kb gz | n/a |
| LCP | **4,9s** (alvo 2,5s) | 3,2 a 5,2s |
| CLS | 0 | 0 |

- INP não medido.
- Gates da art-direction: **34/35**. O **G29 (LCP) segue aberto**, e a causa está fora da direção (ver passo 1).

## Próximos passos (em ordem)
1. **LCP, com `web-performance`.**
   - ✅ **Mensagens: FEITO na spec 005** ([specs/005-trim-client-messages/](specs/005-trim-client-messages/)).
     O provider recebe só `CLIENT_MESSAGE_PATHS` ([i18n/client-messages.ts](i18n/client-messages.ts)), e
     [\_\_tests\_\_/i18n/client-messages.test.ts](__tests__/i18n/client-messages.test.ts) segue o grafo de imports
     dos `'use client'` e falha se um namespace de client ficar fora da lista. Resultado: mensagens de 104 kb
     para 25 kb, e HTML da home de 65,4 para **41,1 kb gz** (−37%, vale para toda rota).
     **Componente client novo com namespace novo = acrescentar o caminho na lista**, senão o teste quebra.
   - ❌ **O LCP não mudou** (mediana de 7: 3,9s antes, 4,5s depois, com ruído de 2,6 a 6,4s). As mensagens
     **não** eram o gargalo. O diagnóstico está na tabela de resultado do `tasks.md` da 005. FCP = LCP, e a
     primeira pintura espera por:
     1. **Fontes x CSS.** Seis woff2 pré-carregados (~287 kb: Bricolage `opsz`+`wdth` = 128 kb, EB Garamond
        latin+greek × normal+italic, e Geist do root layout, que a home talvez nem use) roubam banda do CSS
        global bloqueante (53 kb), que termina aos 1,8s em vez de ~0,6s. **Mexe na tipografia aprovada:
        decidir com o Jean** (tirar o preload do que está abaixo da dobra, subset, cortar eixo).
     2. **Tarefa longa de ~2,5s** (hidratação, CPU 4×): PostHog, Theme, PWA×3, Toaster, AiTrafficMonitor e
        GTM hidratam em toda página. Quando a tarefa cai antes da pintura, o LCP vai a ~5s.
   - Scripts de medição: `measure.cjs` (mediana de N) e `diag.cjs` (recursos × tarefas longas), no scratchpad
     da sessão de 23/09. Não versionados. O método está na 005.
2. **Espalhar a marca** (a direção vem depois, se o Jean quiser):
   - header das outras páginas: [app/[locale]/(marketing)/layout.tsx:23-33](app/[locale]/(marketing)/layout.tsx#L23-L33)
     ainda usa `/logo.png` e `<span className="font-bold tracking-tight">Sirius CRM</span>`. Trocar por
     `<Wordmark />`;
   - favicon: `app/icon.png`, `app/apple-icon.png` e `favicon.ico` ainda são a estrela antiga. Trocar por
     `icon.svg` e gerar o `apple-icon` 180×180 com fundo sólido `--papel` e ~12% de margem;
   - OG: o root layout usa `/logo.png`, e a home aponta para `/og-image.png`, que **não existe** em `public/`.
     Gerar um OG de 1200×630 com a marca ocupando ≥25% da altura;
   - PWA e app: ícones em `public/logos/*.png`, `public/manifest.json` e o ícone Android em `android/`;
   - outros usos de `logo.png` (verificados em 23/09):
     - `components/dashboard/sidebar.tsx`;
     - `components/marketing/download-instructions.tsx`;
     - o campo `logo` dos JSON-LD em `app/[locale]/layout.tsx`, `lib/geo/schema-generator.ts`,
       `(carta)/page.tsx`, about, community, `blog/[slug]` e `help/[categoria]/[slug]`. O schema pede PNG
       quadrado; gerar a partir de `pingos.tsx`.
3. **Texto, com `conversion-copy` / `ux-writing`.**
   - O h1 e o subtítulo da primeira dobra ainda são os antigos ("Transforme Leads em Receita Recorrente").
   - Os textos novos da home (INSTRUMENTOS, Prancha II, colofão) estão escritos direto em
     [app/[locale]/(carta)/page.tsx](app/[locale]/(carta)/page.tsx). Mover para `messages/pt-BR/marketing.json`,
     se for manter o padrão de i18n.
4. **Prova social real.** Pedir depoimentos aos 6 pagantes: Cartopel, 3A3, Wordseg, VOE, London Finance e Boxer.
5. **Verificar os números de `marketing.home.about.description`** ("100 empresas, 110 usuários, 950 negócios")
   contra o banco. A leitura de 22/09 deu 108 contas.
6. **Código morto.** A home antiga deixou sem importador `components/marketing/hero.tsx`, `bento-grid.tsx`,
   `logos.tsx`, `kanban-preview.tsx`, `sticky-cta.tsx` e, possivelmente, `components/agi/AgiPreview.tsx`.
   Confirmar com `node scripts/audit-dead-code.js` antes de apagar.

## Pendências / decisões em aberto
- Levar a direção (papel, tinta, vermelhão) para as outras páginas de marketing? **Só se o Jean pedir.** Nesse
  caso, promover os tokens de `(carta)/carta.css` para o global, e `design-systems` formaliza.
- Ainda existe `/pt-BR` → 308 (commit `8c6dff1`, de outra sessão). Não mexi.

## Gotchas do ambiente
- **`[locale]` num pathspec do git é glob** e o `git add` falha com "did not match any files". Usar
  `git --literal-pathspecs add -A "<caminhos>"` e conferir `git diff --cached --stat`.
- **`npm run build` roda `prisma migrate deploy` contra o banco.** Para testar build local, usar `npx next build`.
  O build fecha em ~80s neste Windows.
- **`next dev` 16.3 acrescenta ao `CLAUDE.md` um bloco `<!-- BEGIN:nextjs-agent-rules -->`** a cada execução. Está
  não-commitado no working tree; decidir se commita ou ignora.
- Matar o `next dev` pode deixar `.next/dev/types` corrompido, e aí o `tsc -p tsconfig.build.json` falha em
  `validator.ts`. Resolver com `rm -rf .next/dev/types`. É o mesmo gate que o Docker do EasyPanel roda.
- O servidor local avisa de `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` ausentes, mas serve as páginas.
- **Push em `main` = deploy.** Desta vez o HTML novo apareceu em ~120s. Conferir a TELA, não só o HTTP 200.
- **O working tree tem mudanças de outras pessoas/sessões** (specs em `e2e/`, arquivos novos em `.specify/`,
  `docs/whatsapp/`, `scripts/reset-onboarding.ts`, o bloco do CLAUDE.md). Nunca usar `git add -A` sem pathspec.
- Os scripts de prova e medição (Playwright com throttling, gerador da marca) viviam no scratchpad da sessão e não
  foram versionados. O método está descrito acima para reproduzir.
