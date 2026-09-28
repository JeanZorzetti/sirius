# Feature Specification: Empresa com papel do contato, e campos personalizados

**Feature Branch**: `017-empresa-e-campos`

**Created**: 2026-09-27

**Status**: Implemented (PR)

**Input**: decisão do dono de 27/09/2026. O site promete a empresa com decisor, influenciador e champion, e campos de
texto, número, data, seleção e checkbox.

## User Stories

### US1 - Empresa e papel do contato (P1)

Na ficha do contato, o vendedor liga o contato a uma ou mais empresas e marca o papel em cada uma: decisor,
influenciador, champion ou outro. Digitar o nome de uma empresa que já existe na conta liga a ela, sem criar uma
segunda.

O texto que já estava em `Contact.company` vira Empresa no deploy: são 1.685 empresas e 1.770 vínculos em
27/09/2026. A coluna de texto continua como estava.

### US2 - Campos personalizados (P1)

O dono ou o gerente cria, em Configurações, campos para a ficha do contato e para a do negócio. São até 30 por ficha,
nos tipos texto, número, data, seleção ou sim/não. Qualquer pessoa que vê o registro preenche o campo na ficha. Cada
campo salva sozinho, e um valor inválido mostra o motivo abaixo do campo.

## Requirements

- **FR-001**: Toda tabela nova MUST ter `organizationId` obrigatório, e todo `unique` MUST incluir a conta ou um id
  que já pertence a ela.
- **FR-002**: Ler ou gravar um valor MUST conferir que o registro é da conta e que a pessoa o vê. No negócio, isso é
  `escopoNegocio` (spec 011).
- **FR-003**: Criar e apagar campo MUST ser do dono e do gerente (`podeVerTudo`).
- **FR-004**: Apagar um contato ou um negócio MUST apagar os valores dele, em qualquer caminho. Um trigger no banco
  garante isso.
- **FR-005**: O valor MUST ir para a coluna do tipo: número com vírgula decimal brasileira, data como dia e seleção só
  com opção da lista (`lib/campos-personalizados.ts`, com teste).
- **FR-006**: O texto do site MUST descrever só o que existe: sem "organograma", sem "filtro por campo" e sem "campo no
  card do kanban".

## Fora do escopo

- Filtrar, relatar ou disparar automação por campo personalizado. Campo que vira filtro, relatório ou gatilho deve
  virar coluna tipada (revisão de CRM de 27/09).
- A API pública dos campos.

## Verificação da migration

A migration foi aplicada com `prisma migrate deploy` sobre o schema de produção restaurado num Postgres 16
descartável, sem dados pessoais, junto com as migrations da 015 e da 016. Resultados:

- os backfills deram o esperado;
- o trigger apagou os valores do contato excluído;
- o CHECK de chance recusou 150.
