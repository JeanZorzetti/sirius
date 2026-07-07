# Phase 1 — Contracts: Crawl Health (HTTP)

Contratos observáveis que a implementação deve satisfazer. Todos verificáveis por `curl`/monitor (ver [quickstart.md](../quickstart.md)). "Sob carga" = durante teste de carga equivalente ao pior dia do incidente.

## C1. `GET /robots.txt`

| Aspecto | Contrato |
|---|---|
| Status | `200` sempre (inclusive sob carga e durante reinício/deploy) |
| `Content-Type` | `text/plain` |
| `Cache-Control` | cacheável (ex.: `public, max-age=300, s-maxage=3600, stale-while-revalidate=86400`) — **não** `max-age=0` |
| Corpo | contém `Sitemap: https://siriuscrm.com.br/sitemap.xml` e as regras de bot existentes (Googlebot/OAI-SearchBot/PerplexityBot com acesso a áreas públicas; `/dashboard/`, `/api/`, `/admin/` bloqueados) — FR-011 |
| Latência | `< 500 ms` sob carga |

## C2. `GET /sitemap.xml`

| Aspecto | Contrato |
|---|---|
| Status | `200` independente do estado de renderização das páginas do app |
| `Content-Type` | `application/xml` |
| `Cache-Control` | cacheável (como C1) |
| Corpo | XML válido; inclui estáticas + blog + categorias + help + calculadoras + soluções/nichos + cidades; `<lastmod>` reflete data real (não fixa desatualizada) — FR-009; alternates `hreflang` pt-BR/en preservados |
| Latência | `< 500 ms` sob carga |

## C3. `GET /api/health` (alvo do monitor)

| Aspecto | Contrato |
|---|---|
| Status saudável | `200` com `{"status":"ok","db":"connected","latency_ms":<int>}` |
| Status degradado | `503` com `{"status":"error","db":"disconnected"}` quando o DB não responde |
| Uso | monitor externo alerta em `503` OU `latency_ms`/tempo de resposta > limiar (proxy da saturação de pool — causa-raiz R0) |

## C4. `GET /_next/static/*` (assets versionados)

| Aspecto | Contrato |
|---|---|
| `Cache-Control` | `public, max-age=31536000, immutable` (já configurado) |
| Re-crawl | recurso versionado → predominância de `304`/cache hit, não re-download (SC-007, FR-008) |

## C5. Redirects (FR-006/FR-007)

| Origem | Destino | Código exigido |
|---|---|---|
| URLs permanentemente movidas (ex.: `/ano`, `/mês` → `/pricing`; `/cadastro` → `/register`) | canônico | `301` (hoje `/ano`,`/mês` são `302` — corrigir) |
| URL de página inexistente sem substituto | — | `404` limpo e intencional |
| Malformadas (`/&`, `/$`) | `/` | `301` ou `302` (consolidar; sem loop) |

## C6. Monitor externo (config, não-HTTP do app)

| Check | Intervalo | Sucesso | Alerta |
|---|---|---|---|
| `/robots.txt` | 1–5 min | `200` + keyword `Sitemap:` | não-200 → alerta ≤ 15 min (SC-009) |
| `/api/health` | 1–5 min | `200` + `"status":"ok"` | `503` ou latência > limiar |

## Invariantes (não podem regredir)

- Governança de bots do `robots.ts` intacta (nenhum crawler legítimo bloqueado de área pública).
- Alternates `hreflang` do `sitemap.ts` intactos.
- Rotas protegidas (`/dashboard`, `/IA`) continuam exigindo sessão (middleware) — a otimização de `maybeRefreshSession` não pode afrouxar auth.
