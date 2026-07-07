# Implementation Plan: Saúde de Rastreamento (Crawl Health) — siriuscrm.com.br

**Branch**: `001-crawl-health-reliability` | **Date**: 2026-07-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-crawl-health-reliability/spec.md`

## Summary

Restaurar e blindar a saúde de rastreamento do siriuscrm.com.br. A causa-raiz do incidente 18/05–08/06 (resposta ao Googlebot de ~100 ms → média 4.745 ms, pico 15,4 s; crawl estrangulado de 103→26 req/dia; `robots.txt` indisponível 1,01%) é **saturação do processo Node de origem** — sem cache de edge, cada hit (inclusive `robots.txt`, servido com `Cache-Control: max-age=0`) atinge o mesmo processo. A abordagem tem 4 frentes:

1. **Blindar** `robots.txt`/`sitemap.xml` para serem 200 rápidos mesmo com o app saturado (cache headers via `next.config.ts` + camada de edge/CDN).
2. **Diagnosticar por correlação** a saturação (surto de features DB-pesadas 18–22/05 vs fixes de query 02–09/06) e mitigar (pool DB, custo de `maybeRefreshSession` em páginas públicas, migração no boot, recursos do container).
3. **Vigiar** com monitor externo de uptime+latência (independe do app) + retenção de logs/métricas.
4. **Higiene**: 302→301 onde permanente, reduzir 404, cache longo de assets versionados, frescor de sitemap, paridade mobile.

## Technical Context

**Language/Version**: TypeScript / Node 20 (Next.js 16.1.1, App Router, `output: 'standalone'`)

**Primary Dependencies**: next-intl (middleware i18n), Prisma (Postgres), Sentry (`@sentry/nextjs`, condicional a `SENTRY_ORG`), Resend (email). Metadata routes nativas do Next para `robots.ts`/`sitemap.ts`.

**Storage**: PostgreSQL via Prisma (DB principal + schema `whatsapp.prisma`). Não há mudança de schema nesta feature.

**Testing**: Jest (`npm test`), Playwright E2E (`npm run test:e2e`). Verificação primária desta feature é **operacional** (curl de headers/latência, load test, releitura de Crawl Stats no GSC) — ver [quickstart.md](./quickstart.md).

**Target Platform**: Container Linux único na EasyPanel (Traefik na frente; **sem CDN** — confirmado por headers em 2026-07-07). Domínio `siriuscrm.com.br`.

**Project Type**: Web application (Next.js) + camada de infra/ops. Sem novo projeto/estrutura.

**Performance Goals**: Resposta média ao Googlebot ≤ 300 ms sustentado; 0 dias > 1.000 ms; `robots.txt`/`sitemap.xml` 200 em < 500 ms sob carga.

**Constraints**: Alavancas de **infra + código liberadas** (recursos do container, config EasyPanel, adicionar CDN/monitor). **Sem dados retidos** do incidente → causa-raiz por correlação + reprodução em staging. Preservar governança de bots e alternates i18n existentes.

**Scale/Scope**: Site institucional/marketing + app CRM autenticado. ~sitemap gerado dinamicamente (estáticas + blog + help + calculadoras + soluções/nichos + cidades). Crawl atual ~30–110 req/dia.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` está com os princípios **em placeholder** (não ratificados). Não há gates formais a impor. Princípios implícitos aplicáveis do repo/CLAUDE.md global: (a) env vars primeiro no debug; (b) sem features preguiçosas/genéricas; (c) verificação antes de concluir. Nada nesta feature os viola. **PASS** (pré e pós-design).

## Project Structure

### Documentation (this feature)

```text
specs/001-crawl-health-reliability/
├── plan.md              # Este arquivo (/speckit-plan)
├── research.md          # Fase 0: causa-raiz por correlação + decisões técnicas
├── data-model.md        # Fase 1: sinais monitorados + limiares (o "dado" da feature)
├── quickstart.md        # Fase 1: guia de validação executável (curl/load/GSC)
├── contracts/
│   └── crawl-health.md  # Fase 1: contratos HTTP de robots/sitemap/health + monitor
└── tasks.md             # Fase 2 (/speckit-tasks — NÃO criado aqui)
```

### Source Code (repository root)

```text
next.config.ts            # headers() → Cache-Control p/ /robots.txt e /sitemap.xml; auditoria redirects 302→301
app/robots.ts             # conteúdo preservado (governança de bots); cache via next.config
app/sitemap.ts            # lastmod real + inclusão de conteúdo novo (frescor)
app/api/health/route.ts   # alvo do monitor externo (já existe; garantir leveza/latência reportada)
middleware.ts             # medir/reduzir custo de maybeRefreshSession em rotas públicas
lib/prisma.ts             # pool/limites de conexão (contenção durante o incidente)
docker/entrypoint.sh      # migração no boot (migrate deploy) — custo de cold start em deploys frequentes
Dockerfile                # sizing/heap do runner se recursos forem o gargalo
# Infra (fora do repo): EasyPanel (recursos do container, CDN/edge opcional), UptimeRobot/BetterStack (monitor)
# Docs de operação: Docs/Obsidian/80-dev/ (handoff, runbook do incidente) — por regra global do vault
```

**Structure Decision**: Web app existente (Next.js) — a correção é majoritariamente **config + poucos arquivos + infra/monitor externo**, sem nova estrutura de código nem mudança de schema. Docs de operação nascem no vault Obsidian (`Docs/Obsidian/80-dev/`) conforme regra global do projeto ROI Labs.

## Complexity Tracking

> Sem violações de constituição a justificar (constituição em placeholder). Nenhuma nova abstração, dependência de código ou projeto introduzido. A única adição externa é um monitor de uptime SaaS (UptimeRobot/BetterStack), justificado por FR-005/SC-009 e mais simples que instrumentar alerta próprio.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (nenhuma) | — | — |
