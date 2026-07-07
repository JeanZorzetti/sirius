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

## Próximos passos (deploy)

1. Commit + push do diff de código (auto-deploy EasyPanel).
2. Pós-deploy, rodar `quickstart.md` §1–§2 e §5 contra prod (curl) → validar `robots.txt` 200 cacheável < 500 ms e `/ano`,`/mês` = 301.
3. Config do monitor externo (T012, UptimeRobot) e da EasyPanel (T002 recursos).

## Pendências — precisam de acesso/infra/tempo (NÃO feitas)

| Task | Bloqueio |
|---|---|
| T002 | Limite CPU/RAM do container — **painel EasyPanel** |
| T003, T004 | Ferramenta de load test + **ambiente de staging** |
| T005, T009, T019, T021, T022 | Curl/carga contra **prod já deployada** (verificação operacional) |
| T008 | Provisionar **Cloudflare** free na frente da origem |
| T010 | Reproduzir causa-raiz em **staging** |
| T011 | Mitigação — **depende de T010** (não aplicar pool/middleware/entrypoint/recursos às cegas) |
| T012, T013, T014 | **UptimeRobot** + Sentry Performance + teste de fogo do alerta |
| T015 | Runbook da causa-raiz — depende de T010 |
| T017, T018 | Lista real de 404 do **GSC** + correção por URL |
| T023 | `npm run indexnow` — pós-deploy |
| T026 | Reextração GSC **após ≥ 14 dias** |

## Gotchas

- **`.includes()` no middleware é largo**: `'/mesa'.includes('/mes')` = true → `/mesa`, `/mensal` etc. caem no redirect a home. Bug pré-existente, fora do escopo desta spec; se `/mes`/`/month` não forem URLs reais, considerar remover o bloco inteiro.
- **`redirects()` roda antes do `middleware`** no Next — por isso o `/mês` do next.config vence; o do middleware já era efetivamente morto p/ o path exato.
- Headers de robots/sitemap **somam** com o catch-all `/(.*)` (que não seta `Cache-Control`) → security headers continuam aplicados. Sem conflito.
- Verificação desta feature é **operacional** (curl/GSC), não unit test — por isso não há test file além do self-check da lógica de data.
