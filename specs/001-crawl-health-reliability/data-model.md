# Phase 1 — Data Model: Crawl Health

Esta feature não altera schema de banco. O "dado" relevante são os **sinais de saúde de rastreamento** e seus **limiares** — a base para o monitor (FR-005) e a verificação (FR-012). Modelado aqui como referência de configuração/observabilidade.

## Entidade: Sinal de Saúde de Crawl (`CrawlHealthSignal`)

Série temporal derivada do GSC Crawl Stats + monitor externo. Não persistida em DB próprio (fonte = GSC/UptimeRobot); modelada para definir limiares e alertas.

| Campo | Tipo | Origem | Baseline saudável | Limiar de alerta |
|-------|------|--------|-------------------|------------------|
| `response_time_ms` | int (média diária) | GSC / monitor | 90–160 ms | > 1.000 ms (crítico); alvo sustentado ≤ 300 ms |
| `robots_available` | bool | monitor `/robots.txt` | 200 sempre | qualquer não-200 |
| `ok_ratio` | float | GSC respostas | ≥ 0,97 | < 0,95 |
| `not_found_ratio` (404) | float | GSC respostas | ≤ 0,01 | > 0,02 |
| `temp_redirect_ratio` (302) | float | GSC respostas | ≤ 0,005 | > 0,01 |
| `failed_ratio` | float | GSC respostas | ≤ 0,015 | > 0,03 |
| `discovery_ratio` | float | GSC finalidade | ≥ 0,18 | < 0,10 (info) |
| `host_status` | enum | GSC | `sem problemas` | `problemas` |
| `db_latency_ms` | int | `/api/health` `latency_ms` | baixo (<50 ms) | > 500 ms (proxy da causa-raiz R0) |

**Regras de validação / uso**:
- `robots_available == false` → alerta imediato (pausa de crawl no host).
- `response_time_ms > 1000` por 1 dia OU `p95 monitor > limiar` por N min → alerta.
- `host_status == problemas` → gate de "não concluído" para FR-012.

## Entidade: Contrato de Recurso Rastreável (`CrawlableResource`)

Ver [contracts/crawl-health.md](./contracts/crawl-health.md) para os contratos HTTP concretos (robots.txt, sitemap.xml, /api/health, assets estáticos). Atributos-chave por recurso: `status`, `content_type`, `cache_control`, `response_time_ms`.

## Estados / transições (host status)

```
sem problemas ──(resp>limiar sustentada OU robots indisponível)──▶ problemas no passado
problemas no passado ──(≥14 dias saudáveis: SC-001..SC-006)──▶ sem problemas
```

O objetivo da feature é forçar a transição de volta para `sem problemas` (SC-006) e impedir a transição de saída via monitor (FR-005) + causa-raiz eliminada (FR-004).
