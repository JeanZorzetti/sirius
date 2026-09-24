# Handoff: CSS público (spec 007) e GA4/PostHog (2026-09-24, manhã)

## Estado em uma linha
As quatro decisões do handoff anterior foram executadas. O CSS das páginas públicas caiu de 53,2 para 32,3 kb gz,
e a Geist deixou de ser baixada à toa (spec 007, `85f4706`): o LCP local caiu 320 ms na home e ~500 ms em
`/pricing` e `/blog`. O "950 negócios" virou "650". **A troca do GA4 pelo PostHog foi desfeita**, porque o PostHog
nunca teve chave em produção.

## Feito

### 1. GA4 → PostHog: feito e desfeito (`6bed4bc`, `6ade6a2`)
- O Jean escolheu trocar o GA4 pelo PostHog "que já está no ar". **Não estava**: `NEXT_PUBLIC_POSTHOG_KEY=""` no
  `.env.easypanel`, e em produção o `window.posthog` é o mock do `app/providers.tsx`, que não envia nada. A
  premissa veio do handoff anterior, e eu a repeti na pergunta sem conferir.
- O GTM saiu às ~05:49 e voltou às ~06:00. Foram **~11 min sem nenhuma analytics**. A volta foi conferida no navegador
  (`g/collect` a frio).
- **Ficou do `6bed4bc`** (inerte até o PostHog ter chave): a fila em `lib/posthog.ts` (`getPostHog()` enfileira,
  `flushQueue()` repassa no `loaded`). Sem ela, o PostHog perderia tudo o que dispara na montagem: o `$pageview`
  de entrada de **toda** visita, `sign_up`, `login`, `identify` e o evento de tráfego de IA. Teste em
  `__tests__/lib/posthog-queue.test.ts`.
- **Para concluir a troca**: (1) criar o projeto no PostHog; (2) pôr a chave e o host no EasyPanel. O Dockerfile
  não declara `ARG` para nenhuma `NEXT_PUBLIC_*`, então conferir como o EasyPanel entrega env ao build; (3)
  conferir no navegador que o `window.posthog` não é o mock; (4) reaplicar as mudanças de layout, CSP, `llms.txt`,
  política de privacidade e `lib/analytics.ts` do `6bed4bc`.

### 2. "950 negócios" → "650" (`6bed4bc`)
- **Correção do handoff anterior**: o texto não estava no rodapé. Estava na seção "O que é o Sirius CRM?" da home
  (`marketing.home.about.description`). O rodapé usa `marketing.home.footer.about`, que não tem número.
- Agora diz "mais de 650 negócios criados pelos clientes". Conferido em produção.

### 3. Spec 007: página pública só baixa o CSS que usa (`85f4706`)
[specs/007-split-public-css/](specs/007-split-public-css/). Resumo:
- `app/public.css`: Tailwind só sobre as pastas que as rotas públicas importam, **inteiro numa cascade layer
  `public`**, declarada como a mais baixa nas duas folhas. `app/globals.css` (a folha do app) compila para
  **exatamente** a folha antiga mais `@layer public;`. O conteúdo antigo foi movido sem edição para
  `app/theme.css` (diretivas) e `app/base.css` (tokens e camadas).
- O root layout carrega a pública. Dashboard, `(admin)`, `(ia)`, `admin/`, `checkout` e `debug` acrescentam a do
  app. A camada existe porque o Next não remove a folha de uma rota quando se navega para fora dela. Sem a camada,
  dashboard → `/pricing` → voltar deixaria a pública por último, e um `p-6` dela venceria um `md:p-2` que só existe
  na do app.
- **Guarda**: `__tests__/styles/public-css-guard.test.ts` falha se uma rota pública importar arquivo com classe
  fora dos `@source` do `public.css`, ou se uma página do app ficar sem o `globals.css`. O teste foi visto falhar
  antes de passar.
- Geist com `preload: false`: ver achados.

| Medido (build local, 4G lento, CPU 4×, 390×844) | Antes | Depois |
|---|---|---|
| Folha das páginas públicas | 53,2 kb gz | **32,3 kb gz** |
| LCP home (mediana de 7) | 2.276 ms | **1.956 ms** |
| LCP `/pricing` / `/blog` (mediana de 3) | 2.276 / 2.096 ms | **1.700 / 1.640 ms** |
| Fontes: home / `/pricing` / `/blog` | 99 / 30 / 30 kb | 68 / 0 / 0 kb |
| Retratos (12 telas × 2 larguras, com o dashboard sob sessão) | ruído entre duas bases: 0 px | 22 idênticos |
| Ida e volta público ↔ app na mesma aba (6 casos) | | 6 idênticos ao aberto a frio |
| `tsc` / vitest / auditoria | 0 / 355 + 1 skip / exit 0 | 0 / 359 + 1 skip / exit 0 |

As duas diferenças nos retratos: o 404 de primeiro nível passou a ter estilo (de propósito), e a `/IA` em 1366 teve
1 px com ±1 de RGB no blur do fundo.

**Produção conferida na tela** (24/09, ~07:00): `/`, `/pricing`, `/blog` e o 404, em 1366 e 390 px, pedem só a folha
pública (`17extfa8rjtkm.css`, 32,3 kb gz) e saem idênticos ao build local. A exceção é o `/blog` a 1366, onde
diferem só os pixels das fotos (o `/_next/image` do servidor), com a mesma grade e a mesma altura. Nenhuma fonte baixada
em `/pricing` e `/blog`. O dashboard em produção não foi aberto (exige sessão real).

## Achados
- **A Geist nunca desenhou o site.** `--font-geist-sans` fica no `<body>`, e a regra de fonte do Tailwind fica no
  `<html>`, onde a variável não existe. Todo o site, app incluído, sai na pilha do sistema
  (`ui-sans-serif, system-ui`). Só a área de IA e os elementos com `font-sans` explícito usam a Geist. Aplicá-la
  (pôr a variável no `<html>`) trocaria a fonte de todas as telas. **É decisão de design do Jean.**
- **O 404 de primeiro nível (`/qualquer-coisa`) estava sem CSS em produção.** O `app/not-found.tsx` fica fora do
  layout que importava o CSS. Corrigido na 007.
- **O evento `purchase` nunca dispara.** O `PurchaseTracker` espera `?session_id=` e está montado em
  `/dashboard/billing`, mas o Stripe devolve para `/checkout/sucesso?session_id=…` (`lib/stripe.ts:85`). E o
  valor é fixo em R$ 49, que não é preço de nenhum plano.
- **GA4**: o hit a frio sai com `en=All Pages`, e não com `page_view`. Vale conferir no GTM o nome do evento de
  página, agora que o GA4 é a única medição.
- **"+127 empresas"** na página do anuário (`marketing.json`, `anuario`): número não conferido.
- A conta de teste usada para ver o app foi a org **"ROI Labs"** (82 deals). O navegador de teste respondeu 204 a
  `/api/access/*` e `/api/push/*`, e nada foi gravado.

## Próximos passos (em ordem)
1. **PostHog**: configurar a chave e concluir a troca (roteiro no item 1 de Feito).
2. **Geist**: aplicar ao site ou tirar de vez. Tirar economiza a `@font-face` e o fallback, e a área de IA passaria
   para a pilha do sistema. Mostrar em imagem (as mesmas telas nas duas fontes) e pedir uma letra.
3. **A capa de `whatsapp-api-oficial-meta-crm` continua faltando** (herdado, é conteúdo).
4. **Marca** (herdado): header do marketing com `/logo.png`, favicon, `apple-icon`, OG (`/og-image.png` do JSON-LD
   não existe) e ícones de PWA. Escolha por imagem.
5. **Próxima alavanca de CSS**: a folha pública ainda leva todo o CSS próprio do `base.css`, com animações de chat,
   kanban etc., porque `@layer utilities` puro não é podado. Medir quanto disso só o app usa e movê-lo para uma folha
   do app.
6. **Dashboard não foi medido em desempenho**: agora ele baixa também a folha pública (32 kb gz, em cache depois
   da primeira visita).
7. Herdados: textos das 8 faixas → `marketing.json` só se o i18n valer a pena; depoimentos dos 6 pagantes.

## Gotchas do ambiente
- **Detector de deploy da 007**: o `@layer public` fica no byte ~4.300 da folha servida, depois das `@property`.
  Procurar só nos primeiros 4 kb dá falso "não entrou".
- **Git Bash converte argumento que começa com `/`** em caminho do Windows (`/pricing` → `C:/Program Files/Git/pricing`).
  Usar `MSYS_NO_PATHCONV=1` ao passar rotas para scripts.
- **Há um `next start -p 3100` órfão desde 00:17** (PID 8788, da sessão da 006). Ele serve 500 porque o `.next`
  mudou. Matar pelo dono da porta.
- O Tailwind recusa `@utility`, `@custom-variant` e `@theme` dentro de `layer()` (`cannot be nested`). Por isso o
  `tw-animate-css` e o `theme.css` ficam fora da camada no `public.css`.
- O compilador emite a declaração como `@layer public;` logo depois do bloco `properties`, que ele sobe para o topo.
- Herdados: `[locale]` em pathspec do git é glob (`--literal-pathspecs`); `npm run build` roda migrate (usar
  `npx next build`); push em `main` = deploy (~2 min); o working tree tem mudanças de outras sessões (`e2e/`,
  `.specify/`, `docs/`, `CLAUDE.md`, `scripts/reset-onboarding.ts`).
- Scripts no scratchpad desta sessão: `retrato.cjs` + `compara.cjs` (retratos e diff por pixel com o `sharp`),
  `ida-volta.cjs` (FR-004), `sessao.mjs` (cookie da conta de teste), `sc004.mjs` (folha do app contra a antiga),
  `grafo.cjs`, `folha.mjs`, `medir.cjs`, `fonte.cjs`, `ga4-prova.cjs`.
