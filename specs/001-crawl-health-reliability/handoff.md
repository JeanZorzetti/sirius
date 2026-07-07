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

**⚠️ DECISÃO PENDENTE — rotas EN dinâmicas 404 (6+)**: `/en/help/*` e `/en/tools/roi-calculator-*` retornam **404**, mas o `sitemap.ts` as anuncia via alternate `hreflang`. Confirmado por curl: PT `200`, EN `404`. Os dados EN **existem** (`help-articles.ts` tem `titleEn`/`contentEn`) → é **bug de rota**, não "não construído". Dois caminhos:
- **(A) Construir** as rotas `/en/help/[category]/[slug]` e `/en/tools/[calc]` (usa o conteúdo EN que já existe) — feature real, fora do escopo de crawl-health.
- **(B) Parar de anunciar** os alternates EN no `sitemap.ts` até (A) existir — mata os 404 agora (cidades já fazem isso: só pt-BR+x-default).

Recomendo **(B) já** (para o crawl budget) e agendar **(A)** como feature separada. **Aguardando decisão do Jean.**

## Decisões de infra (2026-07-07)

- **T002 recursos EasyPanel**: Jean confirmou CPU/RAM **adequados** → **descarta falta de recurso** como causa-raiz de maio. Reforça a hipótese de código/query (`maybeRefreshSession` + pool) — casa com os ~1,2 s de SSR medidos.
- **T008 CDN**: Hostinger **não** oferece CDN para VPS (só para hospedagem gerenciada) — precisa de Cloudflare ou outro 3º. Como o header de cache no origin já entrega o MVP e a causa-raiz vai no código, **Cloudflare é reforço opcional**, não bloqueante.
- **T013 Sentry**: **descartado** por decisão do Jean — não usar.

## Próximos passos (deploy)

1. Commit + push do diff de código (auto-deploy EasyPanel).
2. Pós-deploy, rodar `quickstart.md` §1–§2 e §5 contra prod (curl) → validar `robots.txt` 200 cacheável < 500 ms e `/ano`,`/mês` = 301.
3. Config do monitor externo (T012, UptimeRobot) e da EasyPanel (T002 recursos).

## Pendências — precisam de acesso/infra/tempo (NÃO feitas)

**Feitas 2026-07-07** (✅): T001, T006, T007, T012, T014, T016, T017, T019, T020, T021, T022, T024 + T002 (recursos ok) + 6 redirects de T018.

| Task | Bloqueio / status |
|---|---|
| T003, T004 | Ferramenta de load test + **ambiente de staging** |
| T005, T009 | Carga concorrente (50 req) contra prod — precisa de `hey`/`k6` |
| T008 | **Cloudflare opcional** (Hostinger não tem CDN p/ VPS) — reforço, não bloqueante |
| T010 | Reproduzir causa-raiz — **ou** ataque code-first no `maybeRefreshSession` (pista dos ~1,2 s), medindo por curl em prod, sem staging |
| T011 | Mitigação — depende de T010 |
| T013 | ~~Sentry~~ **descartado** por decisão do Jean |
| T015 | Runbook da causa-raiz — depende de T010 |
| T018 (parcial) | 6 redirects feitos; 3 `[category]` = 404 intencional; **6 rotas EN 404 = decisão (A) construir vs (B) tirar alternates** |
| T023 | `npm run indexnow` — pós-deploy |
| T026 | Reextração GSC **após ≥ 14 dias** |
| T017, T018 | Lista real de 404 do **GSC** + correção por URL |
| T023 | `npm run indexnow` — pós-deploy |
| T026 | Reextração GSC **após ≥ 14 dias** |

## Gotchas

- **`.includes()` no middleware é largo**: `'/mesa'.includes('/mes')` = true → `/mesa`, `/mensal` etc. caem no redirect a home. Bug pré-existente, fora do escopo desta spec; se `/mes`/`/month` não forem URLs reais, considerar remover o bloco inteiro.
- **`redirects()` roda antes do `middleware`** no Next — por isso o `/mês` do next.config vence; o do middleware já era efetivamente morto p/ o path exato.
- Headers de robots/sitemap **somam** com o catch-all `/(.*)` (que não seta `Cache-Control`) → security headers continuam aplicados. Sem conflito.
- Verificação desta feature é **operacional** (curl/GSC), não unit test — por isso não há test file além do self-check da lógica de data.
