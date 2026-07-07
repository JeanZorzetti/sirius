# Handoff — Crawl Health (siriuscrm.com.br) · spec 001

**Data**: 2026-07-07 · **Branch**: `main` · **Spec**: [spec.md](./spec.md) · [tasks.md](./tasks.md)

## Feito (código, mergeável já)

Todas as tasks **de código** foram implementadas e passam no `npm run typecheck` (tsc --noEmit, exit 0):

- **T006** `next.config.ts › headers()` — `/robots.txt` e `/sitemap.xml` agora servem `Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400` (antes: `max-age=0`). Blinda o 200 rápido mesmo com o Node saturado (causa-raiz do incidente 18/05–08/06). **Value é o botão de calibração** — alargar `s-maxage` quando houver CDN na frente.
- **T016** `next.config.ts › redirects()` — `/ano` e `/mês` (`/m%C3%AAs`) mudaram de `permanent:false` (302) → `permanent:true` (301) → `/pricing`.
- **T016** `middleware.ts` — removido `/mês` de `malformedPatterns` (ficou `['/mes','/month']`). Antes havia **duplicidade**: middleware mandava `/mês` → home e o next.config manda → `/pricing`. Agora o next.config é a única fonte (301 → /pricing).
- **T020** `app/sitemap.ts` — `lastSiteUpdate` deixou de ser a data fixa `2026-03-20` e passou a ser derivada do **conteúdo mais recente** (blog/help/calculadoras), com clamp em "agora" p/ nunca emitir `<lastmod>` futuro. Auto-check da lógica: `scratchpad/lastmod_check.mjs` (4 asserts OK).
- **T007** (invariante) — confirmado que os **corpos** de `app/robots.ts` (governança de bots) e os **alternates hreflang** de `app/sitemap.ts` **não** foram alterados. Só header (T006) e a data (T020).
- **T001** (baseline) — snapshot do GSC Crawl Stats 2026-07-07 registrado em [quickstart.md §7](./quickstart.md) como referência de antes/depois.

**Já satisfeito, sem mudança**: `app/api/health/route.ts` já cumpre o contrato **C3** (200 `{status,db,latency_ms}` / 503 no DB down). É o alvo pronto do monitor externo (C6).

## Decisões

- **Cache via `next.config` primeiro, CDN depois** (T008): o header já entrega o MVP (T006). Cloudflare é reforço não-bloqueante.
- **`/mês` → `/pricing`** (não home): o contrato C5/FR-006 pede consolidação de link para o destino canônico.
- **T025 (vault Obsidian) não se aplica a este repo**: o Sirius CRM usa `docs/` flat, não `Docs/Obsidian/80-dev/` (essa regra é do monorepo roilabs). Este handoff cobre o changelog da entrega. O **runbook de incidente** depende da reprodução da causa-raiz (T010) — ainda não há.

## Verificado em prod (2026-07-07, pós-deploy)

- ✅ `robots.txt` → `200` + `Cache-Control: public, max-age=300, s-maxage=3600, stale-while-revalidate=86400`.
- ✅ `sitemap.xml` → `200` + mesmo cache; `<lastmod>` = `2026-04-27` (era `2026-03-20`, agora deriva do conteúdo).
- ✅ `/ano`, `/mês` → **308** → `/pricing`. **308 é o correto**: `redirects()` do Next emite 308 p/ `permanent:true`, e o GSC conta como "301 permanente" (os outros redirects do arquivo já aparecem assim no baseline). Não trocar por `statusCode:301` — quebraria a consistência com os 15 redirects irmãos por uma distinção que o Google apaga.

## Monitor externo — T012 (ativo 2026-07-07)

UptimeRobot free, 2 monitores tipo **Keyword** (pega não-200 **e** corpo errado), alerta por e-mail:

| Monitor | URL | Keyword (alerta se sumir) | Intervalo | Timeout |
|---|---|---|---|---|
| Sirius robots.txt | `/robots.txt` | `Sitemap:` | 5 min | 8 s |
| Sirius health | `/api/health` | `"status":"ok"` | 5 min | 5 s |

**Truque do timeout baixo** = alarme de latência de graça: como o free não alerta por response-time, o timeout curto transforma "lento/saturado" em "down". O `/api/health` bate no DB, então timeout 5 s dispara quando o pool satura (a assinatura da causa-raiz R0/maio). **Limitação**: degradação "lenta mas < timeout" (ex.: 3 s sustentado) não é pega — pra isso, Better Stack free (alerta de latência) ou UptimeRobot Pro.

Ambos **Up** na criação. **Teste de fogo (T014) feito 2026-07-07**: Keyword do `health` trocada p/ valor inexistente → e-mail chegou em **~5 min** (SC-009 exige ≤ 15 min ✅). Revertido, monitor voltou a *Up*.

## Verificações operacionais por curl — feitas 2026-07-07

- ✅ **T019** redirects: `/cadastro`,`/contato`,`/agradecimento`,`/calculadora-roi-spin`,`/ano` → **308** permanente → destino canônico → final `200`, sem loop.
- ✅ **T021** assets: `/_next/static/*.css` → `public, max-age=31536000, immutable` + ETag/Last-Modified; re-request condicional (If-None-Match e If-Modified-Since) → **304**. Re-crawl não re-baixa (C4/SC-007).
- ✅ **T022** paridade mobile: `/`, `/pricing`, `/solucoes/corretores-de-imoveis`, `/solucoes/energia-solar`, `/ferramentas/calculadora-roi`, `/blog` → **200** no desktop e no Googlebot-Smartphone. Sem regressão mobile (SC-010).
  - Slugs reais de nicho: `corretores-de-imoveis`, `energia-solar`, `agencias-de-marketing`, `consultores-empresariais`, `representantes-comerciais` (NÃO existe `/solucoes/imobiliarias` — 404 em ambos, é slug inválido, não bug mobile).

> ⚠️ **Dado p/ T010/T011**: páginas públicas SSR respondem em **~1,1–1,3 s** (bem acima do alvo de 300 ms do SC-001). Não é o incidente (4.745 ms), mas é elevado — candidato à causa-raiz: `maybeRefreshSession` roda no `middleware` p/ TODA rota (inclusive pública) + pool Prisma. Medir isso é o T010.

## 404 hygiene — T017/T018 (2026-07-07)

Fonte: `docs/SEO/siriuscrm.com.br-Coverage-Drilldown-2026-07-07/` (15 URLs 404, todas descobertas via sitemap).

**Aplicado (6 redirects 301 em `next.config.ts`)**: `/ajuda`→`/help`, `/en/automated-sales`→`/en/automatic-sales`, `/year`+`/mo`→`/pricing`, `/features/anamnese-digital`→`/features`, `/blog/follow-up-vendas-guia-completo`→`/blog/poder-do-follow-up`.

**404 intencional (3)**: `/en/help/[category]/{deals-perdidos,permissoes-equipe,troubleshooting}` — leak do segmento dinâmico `[category]` de um sitemap ANTIGO. O sitemap atual já usa `article.categorySlug` real → são stale, saem do GSC no próximo re-crawl. 404 é a resposta correta (C5).

**Rotas EN dinâmicas 404 (6) — RESOLVIDO via (B) 2026-07-07**: `/en/help/*` e `/en/tools/roi-calculator-*` davam 404 enquanto o `sitemap.ts` os anunciava via `hreflang`. Jean escolheu **(B) tirar os alternates EN**: `withAlternates(..., includeEn=false)` em `helpArticlePages` e `calculatorPages`. Escopo confirmado por curl — só help+tools EN dão 404; `/en/blog`, `/en/solutions`, `/en/about`, `/en/pricing` são `200` (mantidos).
**Feature separada agendável (A)**: construir as rotas `/en/help/[category]/[slug]` e `/en/tools/[calc]` (o conteúdo EN já existe em `help-articles.ts`: `titleEn`/`contentEn`). Fora do escopo de crawl-health.

## Runbook causa-raiz — T010/T011/T015 (investigação code-first, 2026-07-07)

Decisão do Jean: atacar a causa por código+medição em prod em vez de montar staging. Resultado da investigação **derrubou a hipótese** e concluiu que **não há regressão viva**:

- **`maybeRefreshSession` NÃO é o custo do crawler.** 1ª linha: `if (!session) return` — requisição sem cookie de sessão (Googlebot, monitor, curl) retorna imediatamente. Nenhum decrypt/encrypt. Editar o middleware não reduziria latência de crawl → **nenhuma mudança feita** (evita fix confiante-porém-errado).
- **TTFB atual é saudável.** Medido em prod: `/`, `/pricing` e `/api/health` (um `SELECT 1`) têm **TTFB ~0,55 s idêntico** → o servidor renderiza a página no mesmo tempo de um health trivial. O `~1,2 s` de total é **download do HTML grande + latência geográfica** (curl dos EUA → server BR), não compute/saturação. Googlebot (infra do Google, conexão mais quente/próxima) vê menos.
- **Conclusão**: a saturação de 18/05–08/06 foi **transitória** (bate com `research.md`: surto de features DB-pesadas 18–22/05), já **mitigada pelos fixes de query de 02–09/06** — o tempo de resposta voltou a ~90–135 ms nos períodos saudáveis do baseline. Não há código novo a aplicar hoje.
- **Proteção contra recorrência = o monitor (T012)** com timeout curto no `/api/health`: se o pool voltar a saturar, o alerta dispara em minutos (provado no teste de fogo, ~5 min).

> Se a saturação **voltar** (alerta do UptimeRobot): 1) olhar `latency_ms` do `/api/health`; 2) correlacionar com deploy/feature recente (git log); 3) suspeitos = pool Prisma (`lib/prisma.ts`) e queries pesadas em rota pública; 4) alavancas = ajustar pool, cache de query, ou recursos EasyPanel. Aí sim vale reproduzir em staging (T004/T010 originais).

## Decisões de infra (2026-07-07)

- **T002 recursos EasyPanel**: Jean confirmou CPU/RAM **adequados** → **descarta falta de recurso** como causa-raiz de maio. Reforça a hipótese de código/query (`maybeRefreshSession` + pool) — casa com os ~1,2 s de SSR medidos.
- **T008 CDN**: Hostinger **não** oferece CDN para VPS (só para hospedagem gerenciada) — precisa de Cloudflare ou outro 3º. Como o header de cache no origin já entrega o MVP e a causa-raiz vai no código, **Cloudflare é reforço opcional**, não bloqueante.
- **T013 Sentry**: **descartado** por decisão do Jean — não usar.

## Próximos passos (deploy)

1. Commit + push do diff de código (auto-deploy EasyPanel).
2. Pós-deploy, rodar `quickstart.md` §1–§2 e §5 contra prod (curl) → validar `robots.txt` 200 cacheável < 500 ms e `/ano`,`/mês` = 301.
3. Config do monitor externo (T012, UptimeRobot) e da EasyPanel (T002 recursos).

## Pendências — precisam de acesso/infra/tempo (NÃO feitas)

**Feitas 2026-07-07** (✅ 20/26): T001, T002, T006, T007, T010, T011, T012, T014, T015, T016, T017, T018, T019, T020, T021, T022, T024. T013 descartado; T025 N/A (repo sem vault).

| Task | Status |
|---|---|
| T003, T004 | Load test + staging — **moot** (sem regressão viva; só se o monitor apitar) |
| T005 | Inventário prod — coberto pelos curls das verificações |
| T008 | **Cloudflare opcional** (Hostinger não tem CDN p/ VPS) — reforço, não bloqueante |
| T009 | Carga concorrente (50 req) — precisa de `hey`/`k6`; opcional |
| T023 | `npm run indexnow` — pós-deploy, opcional |
| T026 | Reextração GSC **após ≥ 14 dias** — única pendência temporal real |
| T017, T018 | Lista real de 404 do **GSC** + correção por URL |
| T023 | `npm run indexnow` — pós-deploy |
| T026 | Reextração GSC **após ≥ 14 dias** |

## Gotchas

- **`.includes()` no middleware é largo**: `'/mesa'.includes('/mes')` = true → `/mesa`, `/mensal` etc. caem no redirect a home. Bug pré-existente, fora do escopo desta spec; se `/mes`/`/month` não forem URLs reais, considerar remover o bloco inteiro.
- **`redirects()` roda antes do `middleware`** no Next — por isso o `/mês` do next.config vence; o do middleware já era efetivamente morto p/ o path exato.
- Headers de robots/sitemap **somam** com o catch-all `/(.*)` (que não seta `Cache-Control`) → security headers continuam aplicados. Sem conflito.
- Verificação desta feature é **operacional** (curl/GSC), não unit test — por isso não há test file além do self-check da lógica de data.
