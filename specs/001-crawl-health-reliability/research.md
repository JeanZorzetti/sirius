# Phase 0 — Research: Crawl Health

Resolve os pontos em aberto e fixa as decisões técnicas. Como não há dados retidos do incidente (ver spec › Clarifications), a causa-raiz é tratada por **correlação + hipótese reproduzível**, não por prova direta.

---

## R0. Causa-raiz do apagão 18/05–08/06 (correlação)

**Evidência temporal (GSC + git):**

- Resposta ao Googlebot: ~100 ms até 17/05 → **1.056 ms em 18/05** → pico **15.442 ms em 29/05** → recuperação para ~90–160 ms a partir de **09/06**. Crawl caiu de 103→26 req/dia no mesmo intervalo (Google estrangulou por lentidão).
- Git na janela: surto de features DB-pesadas **18–22/05** (`feat(contacts): segment filter 100+ niches`, `feat(team): stage-level access restrictions`, `fix(prisma): auto-apply canViewDealClosings column on startup`, `admin migration route`). Alívio progressivo começa **02/06** (`fix(chat): flatten nested chatConversation include to kill INSUFFICIENT_PATH` — otimização de query Prisma) e conclui 05–09/06.
- Googlebot rastreia majoritariamente páginas **públicas** (blog/soluções/ferramentas), não o dashboard. Logo, o vetor precisa ser **compartilhado** entre público e privado.

**Decision (hipótese principal)**: Contenção de recurso compartilhado — **pool de conexões Prisma/DB saturado** por queries pesadas/N+1 introduzidas no surto de 18–22/05, degradando também o SSR das páginas públicas (que passam por `middleware.ts` a cada request, incluindo `await maybeRefreshSession`). Sem cache de edge, toda a carga cai no único processo Node.

**Rationale**: É o único fator que explica (a) início e fim coincidentes com deploys de query, (b) impacto em páginas públicas apesar de as features serem do dashboard (pool/CPU/event-loop compartilhados), (c) duração de semanas (degradação sustentada, não pico de deploy).

**Alternatives considered**:
- *Cold starts por deploys frequentes* (migrate deploy no `entrypoint.sh` a cada boot): contribui em picos, mas não sustenta 5 s por 3 semanas. → fator secundário.
- *Limite de recursos do container (CPU/RAM) na EasyPanel*: plausível amplificador; **confirmar o limite atual** (item deferido do clarify). → medir.
- *Timeout de serviço externo (Resend/Sentry/DB remoto)*: fixes de auth/Resend só aparecem em 09/06; possível mas menos aderente à curva. → descartar como principal.

**Validação exigida (US2)**: reproduzir em staging uma carga concorrente contra rota pública SSR + query do padrão introduzido em 18–22/05, medindo latência com pool default vs ajustado. Confirmar/refutar antes de fechar a causa.

---

## R1. Servir robots.txt / sitemap.xml resilientes

**Fato**: `app/robots.ts` e `app/sitemap.ts` são metadata routes do Next servidas pelo processo Node; hoje `robots.txt` responde `Cache-Control: public, max-age=0, must-revalidate` (sem cache). O matcher do `middleware.ts` **já exclui `.txt`/`.xml`** (não passam por middleware). A função `robots()`/`sitemap()` **não expõe headers** — o cache só se define fora dela.

**Decision**: Definir `Cache-Control` para `/robots.txt` e `/sitemap.xml` via `next.config.ts › headers()` com `public, max-age=300, s-maxage=3600, stale-while-revalidate=86400` (valores a calibrar). Isso permite que Traefik/CDN/navegador sirvam cache e blinda contra saturação momentânea da origem.

**Rationale**: Menor diff, sem tocar no conteúdo (governança de bots e alternates preservados por FR-011). `stale-while-revalidate` mantém 200 mesmo se a revalidação na origem falhar.

**Alternatives**: (a) mover para arquivo estático em `public/robots.txt` — perde a lógica dinâmica de domínio/bots do `robots.ts`; rejeitado. (b) só edge/CDN sem header — CDN precisa do header para cachear; complementar, não substituto.

---

## R2. Camada de edge/CDN (alavanca de infra liberada)

**Fato**: sem CDN hoje (headers sem `cf-ray`/`Via`, HTTP/1.1). Alavancas de infra liberadas.

**Decision**: Colocar **Cloudflare (plano free) na frente** com regra de cache para `/robots.txt`, `/sitemap.xml` e `/_next/static/*`; HTML público com cache curto/bypass conforme `Cache-Control`. Reduz carga na origem e dá HTTP/2 + retry. **Marcado como recomendado, não bloqueante**: se o time preferir não adicionar CDN agora, R1 (headers) + R0 (causa-raiz) já entregam o MVP (US1).

**Rationale**: Free, reversível, resolve tanto blindagem de robots quanto eficiência de assets (SC-007). Cloudflare é o padrão de menor atrito.

**Alternatives**: cache no próprio Traefik da EasyPanel (menos capacidade/observabilidade); nenhuma camada (mantém origem como ponto único). 

---

## R3. Monitor externo de uptime + latência (FR-005 / SC-009)

**Decision**: **UptimeRobot** (free) com dois checks a cada 1–5 min: `GET https://siriuscrm.com.br/robots.txt` (espera 200 + keyword `Sitemap:`) e `GET /api/health` (espera 200 + `"status":"ok"`), com alerta de latência > limiar. Alerta por email + (opcional) WhatsApp/Telegram.

**Rationale**: Externo ao app (mede o que o Googlebot sente), free, sem código. `/api/health` já existe e retorna `latency_ms` do DB — bom sinal de saúde do pool (liga direto à causa-raiz R0).

**Alternatives**: Sentry (mede de dentro, não pega origem down); cron-job.org→endpoint próprio (mais código). UptimeRobot vence por simplicidade.

---

## R4. Retenção de observabilidade (para diagnosticar o PRÓXIMO)

**Decision**: Habilitar **Sentry Performance/Tracing** (já há `@sentry/nextjs`, ativa só com `SENTRY_ORG`) para amostrar latência por rota, e logar `latency_ms` do `/api/health` na saída do container. Documentar runbook do incidente no vault.

**Rationale**: Fecha FR-004 (parte "estabelecer retenção") barato, reusando dependência já instalada (ladder: usar o que já está no projeto).

**Alternatives**: stack de métricas dedicada (Prometheus/Grafana) — over-engineering para o volume atual; rejeitado.

---

## R5. Higiene de redirects 302→301 e 404 (FR-006/FR-007)

**Fato**: `next.config.ts` já tem muitos `permanent: true` (301). Os `permanent: false` (302) atuais são: `/ano`, `/mês` (fragmentos de pricing), `/&`, `/$` (URLs malformadas). O `middleware.ts` também redireciona `/mês|/mes|/month` → `/`.

**Decision**: (a) `/ano` e `/mês` → destino `/pricing` são **permanentes** na prática → mudar para `permanent: true` (301). (b) `/&`, `/$` malformadas: manter, mas avaliar 301 para consolidar. (c) Extrair do GSC/logs a lista real de URLs 404 e mapear cada uma para correção de link, 301 ou 404 intencional. (d) Remover a duplicação: redirect de `/mês` existe em `next.config.ts` E no `middleware.ts` — consolidar em um lugar (config), já que middleware nem roda para `.xml/.txt` mas roda para essas.

**Rationale**: 301 transfere sinal de link e reduz recrawl; consolidar remove ambiguidade. Baixo risco.

**Alternatives**: deixar como está (302 continua desperdiçando budget e não consolida). Rejeitado.

---

## R6. Frescor de sitemap e paridade mobile (FR-009/FR-010)

**Decision**: (a) `app/sitemap.ts` — trocar `lastSiteUpdate` hard-coded (`2026-03-20`) por data derivada do conteúdo quando possível, garantindo que conteúdo novo entre com `lastmod` real; validar que todo tipo publicável (blog/help/soluções/cidades) está incluído (já está). (b) Mobile: confirmar que páginas públicas respondem 200 e rápido ao user-agent Smartphone (o desbalanço Desktop 56% vs Smartphone 10% é reflexo do crawl, não necessariamente de erro mobile) — validar no quickstart, sem mudança de código se não houver erro.

**Rationale**: Discovery (12,92%) sobe com `lastmod` confiável; mobile-first exige paridade de resposta. Ambos são verificação + ajuste pontual, não redesenho.

**Alternatives**: reescrever geração de sitemap — desnecessário; o atual já cobre as URLs.

---

## Unknowns restantes (não bloqueiam a implementação)

- **Limite de CPU/RAM do container na EasyPanel** — confirmar no painel (input para R0/R2). Deferido do clarify; medir na Fase de implementação.
- **Lista exata de URLs 404** — extrair do GSC (Índice › Páginas) / logs antes de finalizar R5.

Nenhum item marca `NEEDS CLARIFICATION` bloqueante — todos têm caminho de resolução operacional.
