# Handoff: revisão de CRM do sistema inteiro (crm-review) (2026-09-25)

## Estado em uma linha
Revisão completa pelas 9 disciplinas do harness de CRM, com números medidos no banco (queries só de leitura). Nenhum
código mudou. O relatório com as 10 ações priorizadas está **fora do repo**, porque o repo é público:
`ROI Labs\CRM\sirius-crm-review-2026-09-25.md`. O handoff da spec 010 está em `git show 8d04d42:handoff.md`.

## Feito nesta sessão
- **`crm-review` na ordem canônica.** As camadas foram, em sequência: modelo de dados, conta e segurança, pipeline,
  leads, automação, integrações, IA, relatório e adoção. Cada achado traz trecho de código ou número do banco.
- **As ações se agrupam em quatro frentes:**
  - isolamento e segurança: vêm primeiro, e o detalhe fica só no relatório local;
  - caminho único: uma função para mover negócio e uma para registrar contato, com histórico, status, telefone
    normalizado e origem;
  - o que roda sozinho: agenda dos crons e snapshot do pipeline;
  - a fila Hoje: o grupo "sem retorno marcado".

## Próximos passos (em ordem)
1. **`speckit-specify` a partir do relatório local.**
   - Primeiro, a spec de isolamento, escrita como requisito e critério de aceite, sem listar rotas nem descrever
     falhas. O repo é público.
   - Depois, a spec do caminho único. As ações 5, 6 e 9 do relatório dividem a mesma migração.
   - Por fim, as ações 7, 8 e 10.
2. **Constituição do Spec Kit.** `.specify/memory/constitution.md` ainda é o modelo em branco. O relatório sugere três
   princípios: busca por (conta, id); a IA sugere e o humano grava; uma função por mudança de estado.
3. **Herdados da spec 010** (continuam valendo):
   - o Jean olha o app no ar, nos dois temas;
   - contraste restante: 31 na amostra e 66 no admin;
   - desempenho do dashboard: tirar do HTML os contatos que não estão em negócio;
   - defeitos vistos: a chave `components.contacts.addContactDesc` aparecendo no subtítulo e a caixa de 44 px vazia
     no celular;
   - marca da `/IA`, "Novo Deal" → "negócio", PostHog sem chave e o depoimento da `/register`.

## Gotchas do ambiente
- **O repo é público** (`gh repo view` → `PUBLIC`). Achado de segurança não entra em commit, spec, handoff nem mensagem
  de commit antes de o conserto estar no ar.
- **O `DATABASE_URL` do `.env` local aponta para o banco de produção.** Consulte só dentro de
  `SET TRANSACTION READ ONLY` e imprima agregados. Os scripts desta sessão estão no scratchpad
  `c196a71b-…/scratchpad/`: `sanidade.cjs`, `sanidade2.cjs`, `crons.cjs`, `emails.cjs`, `orfaos.cjs` e `admins.cjs`.
- **O `.env` local não tem `DATABASE_URL_WA`**, então o banco do WhatsApp não é consultável daqui.
- **Quem chama `/api/cron/*` não está no repo.** O `vercel.json` saiu em 28/04, mas algo de fora segue chamando parte
  das rotas.
- **Herdados:**
  - `GIT_LITERAL_PATHSPECS=1` e caminhos explícitos no commit;
  - push em `main` = deploy (~2 min);
  - a árvore tem mudanças de outras sessões (`CLAUDE.md`, `e2e/i18n-*`, `.specify/*` não rastreados).
