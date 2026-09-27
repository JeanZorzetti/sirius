# Implementation Plan: WhatsApp pelo integrador que o cliente já contrata

**Branch**: `012-whatsapp-integradores` (trabalho em `main`, como as specs 005–011) | **Date**: 2026-09-27 | **Spec**: [spec.md](spec.md)

## Summary

O dono cola as credenciais da Z-API, da uazapi ou da Evolution API. O Sirius confere as credenciais, grava o aceite e
liga sozinho o aviso do integrador num endereço com segredo próprio da conexão. As mensagens passam a entrar e sair
pelo inbox que já existe.

- **Adaptadores e rotas**: um adaptador por integrador traduz os avisos para um evento único e faz as chamadas de
  saída. As rotas que hoje respondem `410` (`connections`, `send-message` e `send-media`) voltam a funcionar para
  integrador.
- **Entrada única**: uma entrada só (`lib/whatsapp/entrada.ts`) serve a API oficial e o integrador, com dedup por
  `create` + P2002, estado só para frente e processamento depois da resposta (`after`).
- **Travas e queda**: as travas da seção 6.5 saem das mensagens que já existem, sem coluna nova. Um cron de 5 minutos e
  uma função única de mudança de estado avisam a queda uma vez só.
- **Banco WA**: ganha migration formal pela primeira vez, com linha de base, porque hoje nenhum caminho aplica mudança
  nele.

## Technical Context

**Language/Version**: TypeScript 5.9, Next.js 16.3 (App Router), React 19.2, Node 20

**Primary Dependencies**: todas já instaladas:

- Prisma 5.19, com dois clientes: CRM e `client-wa`;
- `zod` 4, para o corpo das rotas;
- `lib/url-publica.ts`, com `fetchPublico` e `garantirUrlPublica`;
- `lib/encryption.ts`, `lib/storage.ts` (MinIO), `lib/auditoria.ts` e `lib/visibilidade.ts`;
- `after` de `next/server`.

Nenhum SDK de integrador: são poucos endpoints por integrador, chamados com `fetchPublico`.

**Storage**:

- **Banco WA**: `prisma/whatsapp.prisma` muda para `prisma/wa/schema.prisma`. Entram a linha de base `0_init` e uma
  migration aditiva, com colunas novas em `WhatsAppConnection`, `erro` em `WhatsAppMessage` e os enums
  `WhatsAppIntegrador` e `SUSPENDED` ([data-model.md](data-model.md)).
- **Banco CRM**: sem mudança de schema.
- **Mídia**: no storage que já existe, com chave por conta.

**Testing**: vitest, com Prisma simulado no padrão de `__tests__/isolamento/`, fixtures reais de cada integrador e
`tsc --noEmit`. O contrato com instância real roda antes do push de código ([quickstart.md](quickstart.md) §2).

**Target Platform**: servidor Node no container do EasyPanel. Push em `main` é deploy (~2 min), e as migrations rodam
no start do container.

**Project Type**: web app (Next.js monolito)

**Performance Goals**:

- 95% das mensagens no inbox em até 10 s (SC-003). O inbox já busca a cada 5 s, e o processamento em `after` leva
  menos de 2 s sem mídia;
- queda visível em até 15 min (SC-005), com o cron a cada 5 min.

**Constraints**:

- produção com dado vivo;
- repositório público: commits e documentos descrevem o comportamento novo;
- nada de `db execute` manual nem `db push`;
- o build de produção só vale no Docker;
- o banco WA não é acessível da máquina local (o gate do quickstart §0 roda no console do container);
- credencial de integrador nunca em resposta, log ou exportação.

**Scale/Scope**: 3 integradores, 8 operações por adaptador, 9 rotas (7 alteradas e 2 novas), 1 cron, 8 componentes de
tela e ~24 arquivos de texto público.

## Constitution Check

`.specify/memory/constitution.md` é o modelo não preenchido, então não há princípio a checar. Valem as regras do repo:

- **`CLAUDE.md`**: Prisma singleton (`prisma` e `prismaWa`), `getSession()`, migration formal com `prisma migrate` e a
  doc do Next em `node_modules/next/dist/docs/` lida antes do código. O `after` foi conferido em
  `01-app/03-api-reference/04-functions/after.md`.
- **Guarda estática da spec 011**: toda consulta por id com a conta no `where`, ou justificada.
- **Termos seção 6**: aceite antes da ativação (6.2) e travas no código (6.5).

**Pós-desenho**: sem violação. O plano cumpre melhor a regra de migration formal do que o estado de hoje, em que o
banco WA não tem migration nenhuma.

## Project Structure

### Documentation (this feature)

```text
specs/012-whatsapp-integradores/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md · handoff.md
├── contracts/rotas.md · contracts/adaptador.md
├── checklists/requirements.md
└── tasks.md            # speckit-tasks
```

### Source Code (repository root)

```text
prisma/wa/schema.prisma                                  # MOVIDO de prisma/whatsapp.prisma, com os campos novos
prisma/wa/migrations/0_init/                             # NOVO: linha de base, nunca roda em produção
prisma/wa/migrations/20260928000000_integradores/        # NOVO: aditiva, IF NOT EXISTS
docker/entrypoint.sh                                     # migrate deploy do banco WA, com a linha de base na 1ª vez
package.json · Dockerfile · playwright.config.ts         # caminho novo do schema no generate
.github/workflows/ci.yml                                 # idem, nos 6 jobs que geram o client-wa

lib/whatsapp/integradores/{index,tipos,zapi,uazapi,evolution}.ts   # NOVOS: adaptadores (contracts/adaptador.md)
lib/whatsapp/integradores/travas.ts                      # NOVO: seção 6.5, função pura
lib/whatsapp/integradores/estado.ts                      # NOVO: mudarEstado() e notificação única
lib/whatsapp/integradores/conexao.ts                     # NOVO: carregar a conexão com credenciais decifradas, ConexaoPublica,
                                                         #   conexão da conversa, numeroJaConectado()
lib/whatsapp/telefone.ts                                 # NOVO: chave do telefone, JID, grupo/status/canal
lib/whatsapp/entrada.ts                                  # NOVO: registrarEntrada(), avancarStatus(), mídia, whatsapp.message.in
lib/entitlements.ts                                      # chat no Starter e no Pro, 1/2/5 conexões, limite = plano + add-on
app/[locale]/dashboard/chat/page.tsx                     # plano efetivo; escopo inclui conexões de integrador em qualquer estado
app/[locale]/dashboard/page.tsx                          # hasWhatsApp conta conexão por integrador
app/[locale]/dashboard/settings/integrations/page.tsx    # cartão "WhatsApp por integrador"; o oficial indica Business
lib/chat/queries.ts                                      # a última mensagem traz o connectionId da conversa

app/api/whatsapp/connections/route.ts                    # GET seguro, POST conectar
app/api/whatsapp/connections/[id]/route.ts               # GET, DELETE desconectar
app/api/whatsapp/connections/[id]/qr-code/route.ts       # QR por consulta (sai o SSE do gateway)
app/api/whatsapp/connections/[id]/{status,sync,disconnect}/   # APAGADAS (gateway)
app/api/whatsapp/send-message/route.ts · send-media/route.ts  # envio pelo integrador
app/api/webhooks/whatsapp-integrador/[segredo]/route.ts  # NOVA
app/api/webhooks/whatsapp-official/route.ts              # passa a usar entrada.ts e after()
app/api/integrations/whatsapp-official/settings/route.ts  # recusa número que já está numa conexão por integrador
app/api/cron/whatsapp-integradores/route.ts              # NOVA

components/chat/new-connection-dialog.tsx                # escolha do integrador, credenciais, <AceiteIntegrador>
components/chat/qr-code-dialog.tsx                       # consulta a cada 3 s em vez do SSE
components/chat/connection-manager.tsx                   # estado, motivo, reconectar, desconectar, só leitura
components/chat/chat-interface.tsx                       # aviso de queda no topo; sai a chamada a /sync
components/chat/message-area/use-send-message.ts         # rota pela conexão da conversa; a falha fica como "não enviada"
components/chat/message-area/*                           # bolha com erro; trava "SAIR" na conversa; escolha do número
components/chat/contact-sidebar.tsx · components/contacts/contact-profile-modal.tsx   # "completar cadastro" do LID
scripts/dead-code-allowlist.json                         # sai AceiteIntegrador

messages/pt-BR/marketing.json · lib/help-articles.ts · lib/faq-schema.ts · lib/blog/posts/*   # FR-030

__tests__/whatsapp-integrador/*.test.ts + fixtures/{zapi,uazapi,evolution}/   # NOVOS (quickstart §1)
```

**Structure Decision**: monolito que já existe. O que é de integrador fica em `lib/whatsapp/integradores/`, e o que
serve os dois caminhos fica em `lib/whatsapp/`. As rotas reusam os endereços que o chat já chama (`connections`,
`send-message` e `send-media`), então o chat muda pouco.

## Entrega

Cada push vai para produção depois de `tsc` e `vitest` verdes.

| Push | O que leva | Condição |
|---|---|---|
| **A: banco WA** | schema movido, `0_init`, migration e entrypoint. O app não muda de comportamento. | depois do gate do quickstart §0. A subida mostra a migration aplicada. |
| **B: US1, US2 e US4** | adaptadores, rotas de conexão, aviso, envio, entrada única, travas 6.5 e liberação nos planos (FR-029) | depois do contrato com instância real (§2). As travas vão junto com o envio, porque os Termos já prometem. |
| **C: US3** | cron, `mudarEstado`, notificação e aviso no inbox | no mesmo dia do B, antes de anunciar o recurso. O cron é registrado no agendador. |
| **D: US5** | textos públicos (FR-030), documentos da spec e handoff | por último |

## Complexity Tracking

Sem violações. A interface `Adaptador` tem três implementações reais (Z-API, uazapi e Evolution), então ela não é
abstração especulativa.
