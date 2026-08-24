# Handoff — Remoção de código morto (Sirius CRM)

**Feature**: `002-remove-dead-code` | **Escrito em**: 2026-08-24 (fechamento do Polish, Fase 10) | **Para**: quem for fechar as janelas de Sentry pendentes — a feature em si está implementada

## Estado: feature completa, só falta observação passiva

**Todas as tarefas executáveis estão `[X]` em [tasks.md](./tasks.md) — T001 a T078, exceto T054**, que depende de tempo (janela de 72h) e de acesso a uma ferramenta que esta sessão não tem. Nenhum código pendente, nenhuma decisão pendente. O que resta é **monitorar Sentry** pelas próximas ~72h de cada deploy e registrar o resultado aqui — ver seção própria abaixo.

## Fase 10 — Polish (o que esta sessão fez)

- **T074 (provar o gate, SC-006)**: PR descartável [#9](https://github.com/JeanZorzetti/sirius/pull/9) apagou `app/[locale]/dashboard/settings/integrations/logs/page.tsx` (única consumidora de `/api/integrations/logs`, confirmado por grep antes de tocar). Reproduzido **local** (`--check` saiu `1`) e **na CI real** (job `Dead Code Scan`, run `32758778659`, `conclusion: failure`, log: `--check: 1 item(ns) fora da allowlist: - /api/integrations/logs`). É a reprodução exata do padrão de `2d29773`. PR fechado sem merge, branch apagada — nada disso está em `main`.
- **T075 (medir contra baseline)**: `ARQUIVOS SEM IMPORTADOR: 0` (era 59/7.368 linhas), `ROTAS SEM CHAMADOR: 3/212` (era 32/247), todas as 3 na allowlist com motivo. `git diff --shortstat 7309f03 HEAD` (commit anterior ao início da spec, excluindo `package-lock.json`/`specs/`): **239 arquivos, 1.587 inserções, 34.451 deleções — líquido ~32.864 linhas**, acima do alvo de 24.000 da spec. 11 dependências a menos (não 12, divergência já registrada no handoff da US1 — `openai` continua em uso real). CI verde em `main` (`7ba137e`, `conclusion: success`). Tríade local: `tsc --noEmit` limpo; `vitest run` 349 passed/1 failed/1 skipped (mesma flakiness pré-existente de `deal-isolation.test.ts`, catalogada desde T019 em quase toda fase, não regressão desta).
- **T076 (docs órfãs, SC-008)**: apagados `docs/QUICK_START_GENUI.md` (guia dizendo `/dashboard/agi-genui` estar "em produção") e `scripts/COMO_TESTAR.md` + `scripts/test-genui-endpoint.js` (guia/script de teste de `/api/agi/chat-with-ui` contra `siriuscrm.com.br`) — os três inteiramente sobre o subsistema apagado na US6, achados fora de escopo do T062 e registrados para cá desde então. `roadmaps/roadmap_en.md` corrigido em 3 pontos (inventário de 17 componentes generative-ui, 6 rotas admin já mortas desde `2d29773` na tabela de rotas, 1 item da lista de gaps). `docs/AUDITORIA_OVER_ENGINEERING_2026-08-22.md` e `docs/ROADMAP_SECURITY_STABILITY.md` deixados como estão (descrevem o subsistema como candidato-à-remoção, não como em produção; o segundo já está `[x]`). `docs/ROADMAP_REFATORACAO_2026.md` menciona "generative-ui" só como nome de chunk numa nota histórica de bundle-splitting — deixado.
- **T077 (CHANGELOG)**: 3 entradas novas em `Removed` (US3 — 47 arquivos sem importador, `c1c5d3d`; US5 — 31 rotas + libs AGI + `lib/mercado-pago/`, `cbc3f32`; as 6 migrações one-shot viradas em scripts) e 1 em `Changed` (US7 — formatadores e `lib/entitlements.ts` consolidados, `0a68d8c`), cada uma com motivo e commit de origem.

Essas mudanças (docs + `CHANGELOG.md` + `tasks.md`) ainda **não foram commitadas** no momento em que este handoff foi escrito — ver "Como retomar" abaixo antes de continuar.

## T054 / SC-004 — janelas de Sentry: nenhuma fechou ainda, e não há acesso local

**Nenhuma das 8 janelas de 72h abriu tempo suficiente ainda** — hoje é 2026-08-24, e mesmo o deploy mais antigo (US0) só completa 72h em 2026-08-26. Tabela completa, para não recalcular:

| PR | História | Merge (UTC) | Janela de 72h fecha em |
|---|---|---|---|
| [#1](https://github.com/JeanZorzetti/sirius/pull/1) | US0 | 2026-08-23T12:26:05Z | 2026-08-26T12:26:05Z |
| [#2](https://github.com/JeanZorzetti/sirius/pull/2) | US1 | 2026-08-23T15:23:53Z | 2026-08-26T15:23:53Z |
| [#3](https://github.com/JeanZorzetti/sirius/pull/3) | US2 | 2026-08-23T16:10:11Z | 2026-08-26T16:10:11Z |
| [#4](https://github.com/JeanZorzetti/sirius/pull/4) | US6 | 2026-08-24T09:46:28Z | 2026-08-27T09:46:28Z |
| [#5](https://github.com/JeanZorzetti/sirius/pull/5) | US3 | 2026-08-24T10:31:52Z | 2026-08-27T10:31:52Z |
| [#6](https://github.com/JeanZorzetti/sirius/pull/6) | US4 | 2026-08-24T12:08:03Z | 2026-08-27T12:08:03Z |
| [#7](https://github.com/JeanZorzetti/sirius/pull/7) | US5 (T054 nomeada) | 2026-08-24T12:50:58Z | 2026-08-27T12:50:58Z |
| [#8](https://github.com/JeanZorzetti/sirius/pull/8) | US7 | 2026-08-24T17:31:48Z | 2026-08-27T17:31:48Z |

**A partir de 2026-08-27T17:31:48Z (a mais tardia) todas as 8 janelas podem ser fechadas de uma vez.**

**Verificado nesta sessão, não presumido**: não há credencial de Sentry utilizável nesta máquina. `.env.easypanel` e `.env.example` têm as chaves `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN`/`NEXT_PUBLIC_SENTRY_DSN` **declaradas mas vazias** (`=""`, confirmado linha a linha, não é um caso de "esquecido de olhar o .env" como outras vezes já catalogadas). `npx sentry-cli info` confirma `Method: Unauthorized`. Quem for fechar T054 precisa: (1) pegar as credenciais reais (dashboard do Sentry ou variável de ambiente de produção, não deste repo), (2) rodar `sentry-cli login` ou consultar a API (`GET /api/0/projects/{org}/{project}/issues/?query=is:unresolved&start=<merge>&end=<merge+72h>` por deploy), (3) registrar aqui: novo 404/500 por PR, ou "nenhum novo" por PR.

## ⚠️ Achado de segurança fora do escopo desta feature

`sirius-crm-483316-a2e815438069.json` (service account do Google, credenciais completas) **continua na raiz do repositório**, confirmado presente nesta sessão. Não foi tocado — está fora do escopo de "remoção de código morto". Pede duas ações numa passagem própria, não aqui: `/security-review` para confirmar o alcance do vazamento (há quanto tempo está commitado, se já foi usado por alguém fora da equipe) e rotação da credencial no Google Cloud Console assim que possível. Já estava catalogado em [[secrets_to_rotate]] antes desta sessão.

## Pendências herdadas de sessões anteriores, ainda sem fechamento (não bloqueiam a feature)

Nenhuma delas é T054 nem bloqueia o merge desta feature — ficam registradas para quem tiver o acesso que faltou:

1. **Acceptance US3-4** — app Capacitor num device/emulador real (navegação, bottom-nav, teclado, status bar, deep link). Sem device disponível em nenhuma sessão até agora.
2. **T044/Acceptance US4-3** — baixar e abrir de fato os 4 arquivos de export (XLSX/PDF de deals/contacts) e confirmar isolamento visual entre duas organizações reais.
3. **Acceptance US5-3** — abrir `/admin/knowledge-graph` num navegador de verdade (confirmado só estruturalmente: imports não dependem das libs AGI apagadas).
4. **Acceptance US7-1** — comparar visualmente valor/data/telefone nas telas de deals/contatos/dashboard antes/depois da consolidação de `lib/format.ts` (confirmado só pelos 22 testes de `format.test.ts`, que fixam a saída exata).

Todas as quatro têm a mesma causa raiz: **`31.97.23.166:5434` (Postgres remoto) segue inacessível desta máquina** — testado de novo nesta sessão (`/dev/tcp` direto), mesmo resultado de toda sessão anterior desde T044/US4. Se uma sessão futura tiver acesso a esse banco (ou a um ambiente com ele), essas quatro lacunas fecham juntas.

## Como retomar

1. **Primeiro, revisar e commitar o trabalho do Polish** (não commitado ainda nesta sessão): `git status` deve mostrar `tasks.md`, `CHANGELOG.md`, `roadmaps/roadmap_en.md` modificados, e `docs/QUICK_START_GENUI.md` + `scripts/COMO_TESTAR.md` + `scripts/test-genui-endpoint.js` apagados, mais este `handoff.md`. Seguindo o mesmo padrão de PR-por-fase usado em todas as histórias: branch, commit, push, `gh pr create`, acompanhar CI, **perguntar antes de mergear**.
2. Se a CI do PR de Polish ficar verde e o merge for aprovado: a feature `002-remove-dead-code` está funcionalmente fechada. O que resta depois disso é só T054, que se resolve sozinho com o tempo (ver tabela acima) mais o acesso ao Sentry.
3. **Não repetir T074** — já foi provado, no PR e no log da CI linkados acima. Não é preciso abrir outro PR descartável.
4. Ao fechar T054: atualizar a tabela acima trocando "não há acesso" pelo resultado real por PR, e marcar `- [ ] T054` como `[X]` em `tasks.md`.
5. Os dois `git stash` (`stash@{0}` "wip antes de speckit-implement...", `stash@{1}` "WIP on main: 0633e39...") e os arquivos não rastreados do Spec Kit (`.claude/skills/`, `.specify/{...}`, `docs/screenshots/image.png`) seguem exatamente como estavam nos handoffs anteriores — nenhuma sessão de código morto mexeu neles, e não é escopo desta feature decidir o destino deles.
