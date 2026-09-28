# Feature Specification: Todo contato entra por uma porta, e o lead novo vai para o rodízio

**Feature Branch**: `015-registrar-contato`

**Created**: 2026-09-27

**Status**: Implemented (PR)

**Input**:

- Decisão do dono de 27/09/2026: o round-robin do Business passa a existir.
- Ação 6 da revisão de CRM de 25/09 (relatório local).

## Contexto

Hoje o contato entra por mais de dez portas, e cada uma grava o telefone num formato. O mesmo número chega com e sem
+55, com e sem o nono dígito, e vira dois contatos.

O rodízio de leads do plano Business existe, mas nada o chama. A tela de configuração busca a equipe numa rota que
não existe, por isso a lista de vendedores nunca aparece.

## User Stories

### US1 - O lead novo vai para o próximo vendedor (P1)

Numa conta Business com o rodízio ligado, o lead que chega pelo formulário do Facebook, pelo WhatsApp ou pela API
ganha um responsável na ordem do rodízio, e o vendedor recebe aviso.

**Independent Test**: com o rodízio ligado, um contato novo sem dono vindo de uma porta de lead recebe responsável.
Um contato criado por uma pessoa não recebe.

### US2 - O mesmo número é o mesmo contato (P1)

O lead que chega com um número já cadastrado, em qualquer formato, reusa o contato existente. A origem do primeiro
contato é guardada e nunca é sobrescrita.

**Independent Test**: "(11) 8765-4321" e "+55 11 98765-4321" têm a mesma chave. A porta de lead devolve o contato
que já existe.

### US3 - A tela do rodízio mostra a equipe e pula quem está ausente (P2)

A configuração lista os membros da conta. "Pular usuários inativos" deixa de fora quem não abriu o Sirius nas últimas
24 horas. Se ninguém abriu, o rodízio segue com todos.

## Requirements

- **FR-001**: `registrarContato` MUST gravar `phoneKey` (`chaveTelefone`), o e-mail aparado e em minúsculas, e o
  `source` de primeiro toque.
- **FR-002**: As portas de lead (webhook do Facebook, WhatsApp de entrada, `POST /api/v1/contacts`) MUST distribuir o
  contato novo sem dono pelo rodízio.
- **FR-003**: As portas de lead Facebook e WhatsApp MUST reusar o contato com a mesma chave ou o mesmo e-mail.
  - A API v1 mantém o 409 para e-mail repetido, que é o seu contrato público.
- **FR-004**: A criação por uma pessoa MUST criar o contato mesmo que pareça duplicado, e MUST NOT distribuir.
- **FR-005**: Importação, onboarding, Omie, prospecção e exemplos MUST preencher `phoneKey` e MUST NOT distribuir.
- **FR-006**: O backfill de `phoneKey` MUST dar a mesma chave que `chaveTelefone`. Conferido em 8.219 de 8.219
  telefones.
- **FR-007**: "Pular inativos" MUST usar `User.lastSeenAt`, gravado no máximo uma vez por hora quando o painel abre.
- **FR-008**: O negócio criado pelo lead do Facebook MUST ficar com o responsável que o rodízio escolheu.

## Success Criteria

- **SC-001**: Conta Business com o rodízio ligado: 100% dos leads novos das portas de lead ficam com responsável.
- **SC-002**: A tela do rodízio lista os membros da conta (hoje não lista nenhum).
- **SC-003**: Nenhum contato novo vindo de porta de lead duplica uma chave já existente na conta.

## Fora do escopo

- Merge dos duplicados que já existem (93 grupos, 122 contatos a mais). A chave permite sugerir o merge depois.
