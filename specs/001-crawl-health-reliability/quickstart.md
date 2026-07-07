# Quickstart — Validação da Saúde de Rastreamento

Guia executável para provar que a feature funciona. Não contém código de implementação — só como verificar os contratos ([contracts/crawl-health.md](./contracts/crawl-health.md)).

## Pré-requisitos

- `curl` disponível.
- Acesso ao painel EasyPanel (recursos do container) e ao Google Search Console (Crawl Stats + Índice › Páginas).
- Acesso à conta do monitor externo (UptimeRobot/BetterStack).

## 1. Contrato de robots.txt / sitemap (C1, C2)

```bash
# Status, Content-Type e Cache-Control (NÃO pode ser max-age=0)
curl -sSI -A "Googlebot" https://siriuscrm.com.br/robots.txt   | grep -iE "^(HTTP|content-type|cache-control|age|x-cache)"
curl -sSI -A "Googlebot" https://siriuscrm.com.br/sitemap.xml  | grep -iE "^(HTTP|content-type|cache-control|age|x-cache)"

# Conteúdo preservado (governança de bots + Sitemap:)
curl -s -A "Googlebot" https://siriuscrm.com.br/robots.txt | grep -E "Sitemap:|Disallow: /dashboard|PerplexityBot"
```

**Esperado**: `200`; `Cache-Control` cacheável; `robots.txt` cita `Sitemap:` e as regras de bot; `sitemap.xml` é XML válido com `<lastmod>` recente.

## 2. Latência sob carga (C1, C2, US1)

```bash
# Baseline (sem carga)
curl -s -o /dev/null -w "robots: %{http_code} %{time_total}s\n" -A "Googlebot" https://siriuscrm.com.br/robots.txt

# Carga concorrente contra rota pública SSR + medição paralela de robots.txt
# (usar hey/ab/k6; exemplo com um loop simples de fundo)
for i in $(seq 1 50); do curl -s -o /dev/null -A "Googlebot" https://siriuscrm.com.br/solucoes/imobiliarias & done
curl -s -o /dev/null -w "robots sob carga: %{http_code} %{time_total}s\n" https://siriuscrm.com.br/robots.txt
wait
```

**Esperado**: `robots.txt` responde `200` em `< 0,5 s` mesmo com as 50 requisições SSR concorrentes.

## 3. Health endpoint / proxy da causa-raiz (C3, R0)

```bash
curl -s https://siriuscrm.com.br/api/health | grep -oE '"status":"[a-z]+"|"latency_ms":[0-9]+'
```

**Esperado**: `"status":"ok"` e `latency_ms` baixo (< ~50 ms). `latency_ms` alto = pool DB sob pressão (o sinal da causa-raiz).

## 4. Reprodução da causa-raiz em staging (US2 / R0)

1. Em staging, rodar carga concorrente contra rota pública SSR **enquanto** dispara a query do padrão introduzido em 18–22/05 (contacts/segments/permissions).
2. Medir latência com pool Prisma default vs ajustado, e com/sem o custo de `maybeRefreshSession`.
3. **Esperado**: identificar a combinação que reproduz > 1 s e confirmar que o ajuste (pool/query/recursos) a derruba para < 300 ms. Registrar no runbook.

## 5. Redirects (C5)

```bash
for u in /ano /mês /cadastro /contato; do
  curl -s -o /dev/null -w "$u -> %{http_code} %{redirect_url}\n" "https://siriuscrm.com.br$u"
done
```

**Esperado**: `/ano` e `/mês` retornam `301` para `/pricing` (não `302`); demais permanentes `301`.

## 6. Monitor externo (C6, FR-005/SC-009)

- Confirmar 2 checks ativos (`/robots.txt`, `/api/health`) a cada 1–5 min com alerta configurado.
- **Teste de fogo**: pausar/derrubar o alvo em staging (ou baixar o limiar) e cronometrar o alerta → deve chegar em `≤ 15 min`.

## 7. Verificação final em produção (FR-012, SC-001..SC-010)

### Baseline de comparação — GSC Crawl Stats extraído em 2026-07-07

Fonte: `docs/SEO/siriuscrm.com.br-Crawl-stats-2026-07-07/`. Estado **antes** da feature (referência para o antes/depois):

| Sinal | Baseline (2026-07-07) | Alvo (SC) |
|---|---|---|
| Host status | **Problemas no passado** (6.557 req) | sem problemas (SC-006) |
| Tempo de resposta médio | saudável ~90–135 ms; **incidente 18/05–08/06: média 4.745 ms, pico 15,4 s** | ≤ 300 ms; 0 dias > 1.000 ms (SC-001/002) |
| OK (200) | 93,46% | ≥ 97% (SC-004) |
| Não encontrado (404) | 2,67% | ≤ 1% (SC-005) |
| Movido temporariamente (302) | 1,62% | ≤ 0,5% (SC-007) |
| robots.txt indisponível | 1,01% | 0% (SC-003) |
| Não foi possível acessar | 0,76% | falhas ≤ 1,5% |
| Movido permanentemente (301) | 0,31% | ↑ (consolidação) |
| Não modificado (304) | 0,14% | ↑ em assets versionados (SC-007) |
| Finalidade: Detecção | 12,92% | ≥ 18% (SC-008) |
| Finalidade: Atualização | 87,08% | — |
| Tipo: HTML | 12,57% | ↑ share |
| Tipo: JavaScript | 26,31% | ↓ (mais 304) |

Após deploy, aguardar ≥ 14 dias e reextrair o GSC Crawl Stats:

- [ ] Resposta média ≤ 300 ms; **0 dias > 1.000 ms** (SC-001, SC-002).
- [ ] `robots.txt indisponível` = 0% (SC-003).
- [ ] 200 OK ≥ 97%; 404 ≤ 1%; 302 ≤ 0,5%; falhas ≤ 1,5% (SC-004, SC-005, SC-007).
- [ ] Host status = **sem problemas** (SC-006).
- [ ] Detecção ≥ 18% OU nova página publicada rastreada em ≤ 7 dias (SC-008).
- [ ] Sem regressão do Googlebot Smartphone (SC-010).

Comparar com o CSV baseline em `docs/SEO/siriuscrm.com.br-Crawl-stats-2026-07-07/`.
