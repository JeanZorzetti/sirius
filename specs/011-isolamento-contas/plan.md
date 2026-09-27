# Implementation Plan: Cada conta só alcança o que é dela, e cada pessoa só o que pode ver

**Branch**: `011-isolamento-contas` (trabalho em `main`, como as specs 005–010) | **Date**: 2026-09-25 | **Spec**: [spec.md](spec.md)

## Summary

Quatro frentes, cada uma entregável sozinha:

- **P4 (webhooks)**: os avisos da Meta só entram com assinatura válida, conferida com o App Secret (da conta, no
  WhatsApp oficial; do app da Sirius, no Facebook Leads e no Instagram). Toda chamada do servidor a endereço configurado
  pela conta passa por uma guarda de IP público, aplicada na conexão.
- **P2 (IA)**: nada executa sozinho. O gatilho grava proposta e rascunho aguardando aprovação, e o executor carrega a
  entidade pela conta e aplica só o aprovado. Os agentes de perfil e empresa nunca gravam no contato.
- **P1 (acesso por id)**: uma guarda estática no CI exige conta em toda consulta por id. Os 244 pontos de hoje são
  corrigidos ou justificados, e cada falha corrigida ganha teste de comportamento.
- **P3 (visibilidade)**: a regra sai de dentro do quadro para `lib/visibilidade.ts` e vale em todas as leituras de
  negócio e de tarefa. Exportar fica só para dono e gerente, e a exportação e a "entrada como" viram `AuditLog`, que o
  dono consulta.

## Technical Context

**Language/Version**: TypeScript 5.9, Next.js 16.3 (App Router), React 19.2, Node 20+

**Primary Dependencies**:

- já instaladas: Prisma 5.19 (com `where` único estendido), `typescript` (AST da guarda) e `lib/encryption.ts`;
- `undici` 7.21 passa a ser declarado (já está no `node_modules`, como dependência transitiva).

**Storage**:

- PostgreSQL via Prisma;
- 1 migration aditiva: `Organization.wabaAppSecret`, tabela `AuditLog`, e o `UPDATE` das ações pendentes.

**Testing**: vitest (guarda estática, testes de comportamento com Prisma simulado, no padrão de
`__tests__/multi-tenant/deal-isolation.test.ts`) e `tsc --noEmit`.

**Target Platform**: servidor Node no container do EasyPanel. Push em `main` é deploy (~2 min), e a migration roda no
start do container.

**Project Type**: web app (Next.js monolito)

**Performance Goals**: nenhuma consulta nova por página além de `carregarAcesso` (1 `findUnique` por usuário, que troca
o `$queryRaw` de hoje no quadro).

**Constraints**:

- produção com dado vivo;
- repositório público: commits descrevem o comportamento novo, não a falha antiga;
- nada de `db execute` manual;
- o build de produção só vale no Docker (o Windows não gera o standalone).

**Scale/Scope**: 92 arquivos acusados pela guarda, 4 rotas de exportação, 3 webhooks, 5 clientes de saída, 10 agentes.

## Constitution Check

`.specify/memory/constitution.md` é o modelo não preenchido, então não há princípio a checar. Valem as regras do repo
(`CLAUDE.md`):

- Prisma singleton;
- `getSession()`;
- migration formal (`prisma migrate`), gerada por `migrate diff` sem tocar o banco e aplicada por `migrate deploy`.

**Pós-desenho**: sem violação.

## Project Structure

### Documentation (this feature)

```text
specs/011-isolamento-contas/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md · tasks.md
├── contracts/webhooks-e-saida.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
prisma/schema.prisma                                   # + Organization.wabaAppSecret, + AuditLog
prisma/migrations/20260925000000_isolamento_contas/    # NOVA (aditiva)

lib/meta-assinatura.ts                                 # NOVO: HMAC X-Hub-Signature-256
lib/url-publica.ts                                     # NOVO: fetchPublico (undici, lookup que recusa IP não público)
lib/visibilidade.ts                                    # NOVO: carregarAcesso, escopoNegocio/Pipeline/Tarefa, podeExportar
lib/auditoria.ts                                       # NOVO: registrar()
app/api/webhooks/whatsapp-official/route.ts            # assinatura antes de gravar
app/api/webhooks/facebook-leads/route.ts               # idem
app/api/instagram/webhook/route.ts                     # idem
app/api/integrations/whatsapp-official/settings/route.ts + página   # campo App Secret + aviso
lib/automations/actions.ts · lib/integrations/n8n-client.ts · lib/integrations/retry-handler.ts
lib/scraping/crawler/simple-crawler.ts · cliente Evolution           # fetchPublico
lib/agaas-agent-trigger.ts · lib/agaas-executor.ts     # rascunho/aplicar, entidade pela conta, dono, trava
app/api/v1/agents/actions/route.ts                     # entidade da conta
components/ia/* · app/[locale]/(ia)/IA/setup/page.tsx  # sai o limiar, entra a frase
app/api/export/{contacts,deals}/{xlsx,pdf}/route.ts    # papel + escopo + auditoria
app/[locale]/(admin)/admin/actions.ts                  # impersonateUser → auditoria
app/[locale]/dashboard/settings/auditoria/page.tsx     # NOVA (só OWNER)
~92 arquivos acusados pela guarda                      # conta no where, conferência ou `// isolamento:`
__tests__/isolamento/guarda-estatica.test.ts           # NOVO (+ varredura.ts e fixtures)
__tests__/isolamento/*.test.ts                         # comportamento: assinatura, url, IA, falhas corrigidas, visibilidade
```

**Structure Decision**: monolito existente. Os helpers novos ficam em `lib/`, e os testes em `__tests__/isolamento/`.

## Entrega

Cada história vai para produção num push próprio, depois de `tsc` e `vitest` verdes, na ordem **P4 → P2 → P1 → P3**:
primeiro a porta aberta para quem está de fora, e por último a que só pesa em conta com time. Os documentos da spec vão
no último push, junto com o handoff.

## Complexity Tracking

Sem violações.
