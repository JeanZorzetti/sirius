# Tasks: Todo contato entra por uma porta

- [x] T001 Migration: `Contact.phoneKey` + índice `(organizationId, phoneKey)` com backfill; `User.lastSeenAt`
- [x] T002 `lib/contacts/registrar-contato.ts` + teste
- [x] T003 Portas de lead: webhook Facebook (dono do negócio = rodízio), WhatsApp de entrada, API v1
- [x] T004 Criação por pessoa: `/api/contacts` e a tela
- [x] T005 Importação, onboarding, Omie, prospecção (dedupe pela chave) e exemplos do cadastro: `phoneKey`
- [x] T006 Rodízio: `lastSeenAt` no "pular inativos"; tela chama `/api/org/members`; texto do site
- [ ] T007 Depois do deploy: com a conta de teste Business e o rodízio ligado, criar contato via API v1 e conferir o responsável
