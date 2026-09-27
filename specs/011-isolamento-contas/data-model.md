# Data Model: 011 isolamento

Uma migration: `prisma/migrations/20260925000000_isolamento_contas/migration.sql`.

- **Como se gera**: com `prisma migrate diff --from-schema-datamodel <schema anterior> --to-schema-datamodel
  prisma/schema.prisma --script`. Ela não toca o banco.
- **Quando se aplica**: pelo `prisma migrate deploy` do container.
- **O que ela faz com dado vivo**: só acrescenta. Não apaga nem renomeia coluna, e toda coluna nova é anulável ou tem
  valor padrão.

## Organization (alterada)

| Campo | Tipo | Regra |
|---|---|---|
| `wabaAppSecret` | `String? @db.Text` | App Secret do app da Meta da conta, cifrado com `lib/encryption.ts`. Nunca volta para a tela: a tela recebe só `temAppSecret: boolean`. |

## AuditLog (nova)

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `String @id @default(uuid())` | |
| `organizationId` | `String` | conta onde o fato aconteceu. FK com `onDelete: Cascade` |
| `autorUserId` | `String?` | quem fez; `SetNull` se o usuário for apagado |
| `autorEmail` | `String` | cópia do e-mail, que sobrevive à exclusão do usuário |
| `autorTipo` | `String` | `USUARIO` (da conta) ou `EQUIPE` (ROI Labs) |
| `acao` | `String` | `EXPORTACAO` ou `ENTRAR_COMO` |
| `alvo` | `String` | o quê: `contatos`, `negocios`, ou o e-mail do usuário visitado |
| `formato` | `String?` | `xlsx` ou `pdf` |
| `linhas` | `Int?` | quantidade exportada |
| `ip` | `String?` | origem |
| `createdAt` | `DateTime @default(now())` | |

Índice `@@index([organizationId, createdAt])`. Não existe atualização nem exclusão pela aplicação.

## AgentAction (dados)

- Sem mudança de esquema.
- A migration faz `UPDATE "AgentAction" SET status = 'NEEDS_APPROVAL' WHERE status = 'PENDING'`, porque nada mais
  executa sozinho.
- O rascunho do agente vive em `output`: `{ rascunho: {...}, modo: 'rascunho' }` até a aprovação, e passa a
  `{ ..., aplicado: {...} }` depois dela.

## Regras que não viram coluna

- **Visibilidade de tarefa**: "só administradores" vale para `OWNER` e `GERENTE`. "Privada" vale para criador,
  responsável, `OWNER` e `GERENTE`. Os demais papéis, com `MEMBER` normalizado para `VENDEDOR`, veem só as públicas e
  as privadas em que são criador ou responsável.
- **Restrição de pipeline**: com `pipelineRestricted = true`, o usuário vê os negócios de `pipelineId IN
  allowedPipelineIds`. Lista vazia significa nenhum.
