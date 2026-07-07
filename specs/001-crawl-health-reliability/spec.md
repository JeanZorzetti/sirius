# Feature Specification: Saúde de Rastreamento (Crawl Health) — siriuscrm.com.br

**Feature Branch**: `001-crawl-health-reliability`

**Created**: 2026-07-07

**Status**: Draft

**Input**: User description: "Usar o Spec Kit para montar uma spec que corrija tudo que precisa, com base na análise dos dados do GSC Crawl Stats (siriuscrm.com.br, período 2026-04-18 a 2026-07-04)."

---

## Contexto / Evidência (não-normativo)

Análise do export **Google Search Console → Crawl Stats** (78 dias, 6.557 requisições, 338 MB). O problema não é budget de rastreamento — é **confiabilidade do servidor de origem**.

| Fase | Período | Resp. média | Requests | Leitura |
|------|---------|-------------|----------|---------|
| Saudável | 18/04–17/05 | **100 ms** | 3.094 (103/dia) | Normal |
| **Apagão** | 18/05–08/06 | **4.745 ms** (pico 15.442 ms) | **581 (26/dia)** | SSR saturado → Google estrangulou o crawl |
| Recuperado | 09/06–04/07 | **160 ms** | 2.882 (111/dia) | Voltou; pico de 1.742 req em 14/06 = recrawl de recuperação |

Sinais correlatos no mesmo período:
- **robots.txt indisponível: 1,01%** — como `app/robots.ts` e `app/sitemap.ts` são servidos pelo **mesmo processo Node standalone** (sem CDN/edge na frente), quando o SSR saturou o robots.txt travou junto. robots.txt indisponível **pausa todo o rastreamento do host**.
- Host status no GSC: **"Problemas no passado"**.
- Respostas: 200 OK 93,46%; **404 2,67%**; **302 1,62%**; "página inacessível" 0,76%.
- Finalidade: **87,08% Atualização vs 12,92% Detecção** (pouca descoberta de conteúdo novo).
- Googlebot: **Desktop 56,46% vs Smartphone 9,99%** (invertido para mobile-first indexing).
- Tipo de arquivo: só **12,57% é HTML**; JavaScript 26,31% + "outro" 48,71% (~75% do crawl gasto em recursos, não conteúdo); 4,48% de requisições com falha.

Objetivo desta feature: **restaurar e blindar a saúde de rastreamento** para que o Google mantenha taxa de crawl alta e o host volte a "sem problemas", sem regressões silenciosas futuras.

---

## Clarifications

### Session 2026-07-07

- Q: O que existe hoje na frente do container (CDN/proxy)? → A: Desconhecido pelo time; **verificação em produção (curl com User-Agent Googlebot, 2026-07-07) não detectou CDN** — sem `cf-ray`/`Server`/`Via`, HTTP/1.1 → provável apenas Traefik/nginx da EasyPanel. Além disso, `robots.txt` responde `Cache-Control: public, max-age=0, must-revalidate` e a home `private, no-cache, no-store` → **origem sem cache de edge; todo hit atinge o processo Node** (confirma por que o robots.txt caiu junto no apagão).
- Q: Há dados retidos da janela 18/05–08/06 para diagnóstico? → A: **Nada retido** — a causa-raiz será **inferida por correlação** (histórico de deploy/git + reprodução de hipóteses em staging); o escopo inclui **estabelecer retenção de logs/métricas** para que incidentes futuros sejam diagnosticáveis.
- Q: Quais alavancas estão liberadas? → A: **Infra + código** — pode ajustar recursos do container, config da EasyPanel e adicionar CDN/monitor.
- Q: Mecanismo de alerta de regressão? → A: **Monitor externo de uptime + latência** (ex.: UptimeRobot/BetterStack) batendo `robots.txt` e `/api/health`, alerta em minutos, independente do app estar vivo.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Origem sempre responde rápido ao Googlebot (Priority: P1)

Como responsável pelo SEO do Sirius, quero que o servidor responda ao Googlebot em tempo saudável (dezenas de ms, não segundos) mesmo sob carga, e que **robots.txt e sitemap.xml estejam sempre disponíveis (200)** independentemente do estado de renderização das páginas do app — para que o Google não estrangule o rastreamento nem pause por robots.txt indisponível.

**Why this priority**: É a causa-raiz do incidente de 18/05–08/06. Sem isso, todo o resto (limpeza de 404, discovery, etc.) é otimização sobre uma base instável. Sozinha, esta história já restaura a saúde de crawl (é o MVP).

**Independent Test**: Medível de forma isolada: (a) carga sintética contra páginas SSR + medição concorrente do tempo de resposta de `robots.txt`/`sitemap.xml`; (b) acompanhamento do Crawl Stats por ≥ 2 semanas após deploy confirmando resposta média < limiar e 0% de robots.txt indisponível.

**Acceptance Scenarios**:

1. **Given** o site sob carga equivalente ao pior dia do incidente, **When** o Googlebot (ou teste sintético) requisita `robots.txt`, **Then** a resposta é 200 em < 500 ms.
2. **Given** uma página SSR pesada sendo renderizada, **When** `sitemap.xml` é requisitado em paralelo, **Then** retorna 200 sem esperar a renderização da página.
3. **Given** o servidor em operação normal, **When** o Crawl Stats é reavaliado ao longo de 14 dias, **Then** nenhum dia apresenta resposta média > 1.000 ms.
4. **Given** um deploy/reinício de rotina, **When** o Googlebot rastreia durante a janela de reinício, **Then** `robots.txt` continua retornando 200 (não 5xx/timeout).

---

### User Story 2 - Causa-raiz identificada e regressão vigiada (Priority: P1)

Como operador, quero **identificar e eliminar a condição** que saturou o SSR entre 18/05 e 08/06, e ter **alerta automático** quando o tempo de resposta ou a disponibilidade do robots.txt degradarem de novo — para que o mesmo apagão não passe 3 semanas despercebido.

**Why this priority**: O incidente durou ~3 semanas sem detecção. Corrigir sem entender a causa arrisca recorrência; sem alerta, a próxima ocorrência também será silenciosa. Empatada em P1 porque a durabilidade da correção depende disso.

**Independent Test**: Como não há dados retidos do incidente (ver Clarifications), correlacionar o **histórico de deploy/git** da janela 18/05–08/06 com o início/fim da degradação, levantar hipóteses de causa (ex.: limite de recursos do container, rota lenta específica, timeout de DB/serviço externo, cold start) e **reproduzi-las em staging**. Confirmar que a correção neutraliza a hipótese confirmada. Disparar artificialmente a condição de degradação e confirmar que o alerta chega.

**Acceptance Scenarios**:

1. **Given** o histórico de deploy/git e a série temporal do Crawl Stats, **When** a investigação conclui, **Then** existe um documento com a causa-raiz (ou a hipótese mais provável, se inconclusivo) e a evidência de correlação que a sustenta.
2. **Given** a correção aplicada, **When** a condição de saturação é reproduzida em staging, **Then** o tempo de resposta permanece dentro do limiar saudável.
3. **Given** monitoramento ativo, **When** a resposta média excede o limiar ou o robots.txt fica indisponível, **Then** um alerta é emitido em minutos (não dias).

---

### User Story 3 - Higiene de respostas: menos 404 e 302 (Priority: P2)

Como responsável pelo SEO, quero reduzir a fração de 404 (2,67%) e converter 302 impróprios em 301 (1,62%), para não desperdiçar crawl budget em URLs quebradas e para consolidar sinais de link em redirects permanentes.

**Why this priority**: Melhora eficiência e transferência de autoridade, mas não bloqueia a saúde do host. Depende de uma origem estável (P1) para ser medível de forma limpa.

**Independent Test**: Extrair as URLs que geram 404 e 302 no GSC/logs, mapear destino correto, e reavaliar as proporções no Crawl Stats seguinte.

**Acceptance Scenarios**:

1. **Given** uma URL antiga movida permanentemente, **When** um crawler a acessa, **Then** recebe 301 para o destino canônico (não 302).
2. **Given** as URLs que hoje retornam 404 por links internos/externos, **When** revisadas, **Then** cada uma é corrigida (link atualizado), redirecionada (301) ou confirmada como 404 legítimo intencional.

---

### User Story 4 - Eficiência de crawl budget e descoberta (Priority: P3)

Como responsável pelo SEO, quero que o Googlebot gaste menos budget re-buscando JS/recursos e mais em conteúdo, e que **conteúdo novo seja descoberto rapidamente** (hoje só 12,92% do crawl é Detecção), incluindo garantir rastreamento saudável para o Googlebot Smartphone (mobile-first).

**Why this priority**: Ganho incremental de longo prazo. Faz sentido só depois que a origem está estável e limpa.

**Independent Test**: Comparar, entre dois exports de Crawl Stats, a fração de HTML vs recursos, a fração Detecção vs Atualização, e o tempo até uma página recém-publicada aparecer no GSC.

**Acceptance Scenarios**:

1. **Given** recursos estáticos versionados (JS/CSS/imagens), **When** o Googlebot os re-rastreia, **Then** predominam respostas 304/cache (não re-download integral).
2. **Given** uma nova página publicada e incluída no sitemap com lastmod correto, **When** o sitemap é reprocessado, **Then** a página é descoberta/rastreada em ≤ 7 dias.
3. **Given** o Googlebot Smartphone, **When** rastreia o site, **Then** obtém as mesmas respostas 200 e tempos saudáveis do Desktop (sem erros mobile-específicos).

---

### Edge Cases

- **Deploy/reinício do container**: `robots.txt`/`sitemap.xml` devem permanecer 200 durante a janela de indisponibilidade do app (servir de forma resiliente/cacheada, não depender do processo que reinicia).
- **`NEXT_PUBLIC_APP_URL` ausente/errada**: o robots/sitemap não pode emitir `localhost` nem apontar sitemap para host errado (já há fallback para `https://siriuscrm.com.br` — deve ser preservado e testado).
- **Pico de tráfego real** saturando o event loop: precisa degradar sem derrubar robots.txt e sem exceder o limiar de resposta.
- **Regra de bot quebrando crawler legítimo**: mudança em `robots.ts` não pode acidentalmente bloquear Googlebot/OAI-SearchBot/PerplexityBot das áreas públicas.
- **URL malformada** (`/&`, `/$`, fragmentos de billing) já redirecionada — garantir que a limpeza de 404 não reintroduza esses casos.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Disponibilidade de robots/sitemap)**: `robots.txt` e `sitemap.xml` MUST retornar 200 de forma independente do estado de renderização das páginas do app, inclusive durante reinício/deploy do processo de origem.
- **FR-002 (Tempo de resposta ao crawler)**: O sistema MUST manter o tempo de resposta ao Googlebot em nível saudável sob carga; nenhum dia pode ter resposta média > 1.000 ms, e o alvo sustentado é ≤ 300 ms.
- **FR-003 (Zero robots.txt indisponível)**: A fração de respostas "robots.txt indisponível" MUST ser 0% em regime normal.
- **FR-004 (Causa-raiz)**: A condição que causou a saturação de 18/05–08/06 MUST ser investigada e documentada com evidência, e eliminada ou mitigada. Como não há dados retidos do incidente, a identificação é **por correlação** (histórico de deploy/git + reprodução de hipóteses em staging); o escopo inclui **estabelecer retenção de logs/métricas** (CPU/RAM/latência por rota/restarts) para que incidentes futuros sejam diagnosticáveis diretamente.
- **FR-005 (Detecção de regressão)**: O sistema MUST ter um **monitor externo de uptime + latência** (independente do processo do app) batendo `robots.txt` e `/api/health`, que emite alerta em janela de minutos quando o tempo de resposta excede o limiar ou quando robots.txt/sitemap ficam indisponíveis.
- **FR-006 (Redirects permanentes)**: Movimentações permanentes de URL MUST usar 301; a fração de 302 MUST ser reduzida ao mínimo (apenas redirects genuinamente temporários).
- **FR-007 (Redução de 404)**: URLs que retornam 404 por links internos/externos conhecidos MUST ser corrigidas, redirecionadas (301) ou explicitamente confirmadas como 404 legítimo.
- **FR-008 (Cache de recursos estáticos)**: Recursos estáticos versionados (JS/CSS/imagens/fontes) MUST ser servidos com cache de longo prazo para que o re-rastreio resulte em 304/cache em vez de re-download integral.
- **FR-009 (Frescor do sitemap)**: O `sitemap.xml` MUST refletir `lastmod` real das páginas e incluir todo conteúdo indexável novo, para que a descoberta ocorra em ≤ 7 dias.
- **FR-010 (Paridade mobile-first)**: O site MUST responder ao Googlebot Smartphone com paridade de status e desempenho em relação ao Desktop.
- **FR-011 (Preservar governança de bots)**: As mudanças MUST preservar as regras existentes de allow/disallow por user-agent (áreas públicas liberadas para Search/Answer bots; `/dashboard/`, `/api/`, `/admin/` bloqueados), sem bloquear crawlers legítimos.
- **FR-012 (Verificação em produção)**: A correção MUST ser verificada com dados reais de Crawl Stats por ≥ 14 dias após o deploy, e o host status do GSC MUST retornar a "sem problemas".
- **FR-013 (Cache de robots/sitemap)**: `robots.txt` e `sitemap.xml` MUST ser servidos com política de cache que permita cache de edge/proxy/navegador (hoje `Cache-Control: public, max-age=0, must-revalidate` — sem cache), reduzindo a dependência do processo de origem a cada requisição. Servir de camada de edge/CDN é uma opção habilitada (alavancas de infra liberadas).

### Key Entities *(include if feature involves data)*

- **Recurso rastreável**: qualquer URL servida ao crawler (página HTML, `robots.txt`, `sitemap.xml`, asset estático). Atributos relevantes: código de resposta, tempo de resposta, tamanho, tipo de arquivo, tipo de Googlebot (Desktop/Smartphone/Imagem/recurso), finalidade (Atualização/Detecção).
- **Janela de saúde de crawl**: série temporal diária de (requisições, bytes, tempo de resposta médio) — base para os limiares e a detecção de regressão.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Tempo de resposta médio ao Googlebot ≤ 300 ms sustentado por 4 semanas (baseline saudável ~100–160 ms; incidente chegou a 4.745 ms).
- **SC-002**: 0 dias com resposta média > 1.000 ms na janela pós-correção.
- **SC-003**: Fração de "robots.txt indisponível" = 0% (era 1,01%).
- **SC-004**: Fração de 200 OK ≥ 97% (era 93,46%).
- **SC-005**: Fração de 404 ≤ 1,0% (era 2,67%) e de 302 ≤ 0,5% (era 1,62%).
- **SC-006**: Host status no GSC volta a "sem problemas" (era "Problemas no passado").
- **SC-007**: Requisições com falha ("desconhecido") ≤ 1,5% (era 4,48%).
- **SC-008**: Fração de Detecção ≥ 18% ou nova página publicada aparece no GSC em ≤ 7 dias (era 12,92% de Detecção).
- **SC-009**: Alerta do monitor externo de uptime+latência dispara em ≤ 15 min de uma degradação simulada.
- **SC-010**: Sem regressão de rastreamento do Googlebot Smartphone (paridade de status 200 e tempo com Desktop).

---

## Assumptions

- O site roda em container Node único (`output: 'standalone'`) na EasyPanel, **sem CDN/edge na frente** (confirmado por inspeção de headers em 2026-07-07: sem `cf-ray`/`Server`/`Via`, HTTP/1.1, `robots.txt` com `max-age=0`) — provável apenas o Traefik da EasyPanel.
- **Alavancas de infra + código liberadas**: é permitido ajustar recursos do container, config da EasyPanel e adicionar CDN/monitor externo.
- Há acesso ao Google Search Console para reextrair Crawl Stats; **não há logs/métricas retidos** da janela 18/05–08/06 — a causa será inferida por correlação (deploy/git) e reprodução em staging.
- `robots.ts`/`sitemap.ts` atuais já produzem conteúdo correto (fallback de domínio, regras de bot, alternates i18n) — o problema é de **entrega/confiabilidade**, não de conteúdo; a correção deve preservar esse conteúdo.
- **Fora de escopo**: estratégia de produção de conteúdo novo (volume/pauta) para elevar Detecção — aqui só garantimos a infraestrutura de descoberta (sitemap/cache/mobile). Redesenho de arquitetura de app além do necessário para os limiares de resposta também está fora de escopo.

---

## Próximos passos no fluxo Spec Kit

1. ~~`/speckit-clarify`~~ — **concluído em 2026-07-07** (ver seção Clarifications). Restou 1 item para o plano: confirmar o limite atual de recursos do container na EasyPanel.
2. `/speckit-plan` — desenhar o "como" (diagnóstico por correlação da causa-raiz, servir robots/sitemap com cache resiliente + edge, headers de cache, monitor externo de uptime+latência, correções de redirect, retenção de logs/métricas).
3. `/speckit-tasks` — quebrar em tarefas acionáveis.
4. `/speckit-analyze` + `/speckit-implement` — validar consistência e executar.
