# Quickstart: validar a 011

Tudo roda no diretório do projeto (`CRM/crm-project`).

## 1. Suíte

```bash
npx tsc --noEmit -p tsconfig.json
npx vitest run __tests__/isolamento
npx vitest run
```

- A **guarda estática** (`__tests__/isolamento/guarda-estatica.test.ts`) passa com 0 pontos.
- **Prova de que ela pega**: acrescente numa rota qualquer `await prisma.deal.findUnique({ where: { id: x } })`, sem
  conferência. A guarda falha e nomeia arquivo e linha. Desfaça.
- **Testes de comportamento**: a sessão da conta B com o id da conta A é recusada nos pontos corrigidos, e o registro de
  A não muda.

## 2. Depois do deploy (produção)

1. **App Secret da conta de teste da equipe.** Abra `/dashboard/settings/integrations/whatsapp-official`. A tela avisa
   que falta o App Secret. Cole a chave do app da Meta (Configurações do app → Básico → Chave secreta do app). Mande
   uma mensagem para o número: ela aparece no chat.
2. **Webhook sem assinatura.** Rode `curl -X POST <app>/api/webhooks/whatsapp-official -d '{"object":"whatsapp_business_account","entry":[]}'`.
   A resposta esperada é `401`.
3. **Facebook Leads e Instagram.** Confira no EasyPanel que `FACEBOOK_APP_SECRET` e `INSTAGRAM_APP_SECRET` estão
   definidos. Sem eles, os avisos dessas integrações são recusados, e hoje só a conta da equipe as usa.
4. **IA.** Na conta da equipe, com um agente ligado, mande uma mensagem com "apartamento". A ação aparece em `/IA` como
   "aguardando aprovação", com o texto do rascunho, e nada sai para o cliente até aprovar.
5. **Visibilidade.**
   - Numa conta de teste, restrinja um vendedor a um pipeline. Entre como ele (sessão de teste) e confira: o analytics
     com `?pid=<outro>` não mostra o outro pipeline, a exportação é recusada, e tarefa "só administradores" não
     aparece.
   - Entre como dono e confira em `/dashboard/settings/auditoria` as exportações e as entradas da equipe.

## 3. Medir no banco (só leitura)

```sql
SELECT count(*) FROM "AgentAction" WHERE status = 'SUCCESS' AND "reviewedBy" IS NULL AND "createdAt" > '<deploy>';  -- 0
SELECT acao, count(*) FROM "AuditLog" GROUP BY 1;
```

## Resultado (26/09/2026)

**Seção 1, suíte** (depois da US3, commit `e2e16eb`):

- `tsc --noEmit`: sem erro.
- `vitest run`: 41 arquivos, 463 testes passando, 1 pulado.
- Guarda estática: 0 pontos.
- `scripts/audit-dead-code.js --check`: sem código morto.
- Prova de que a guarda pega: uma rota temporária com `prisma.deal.findUnique({ where: { id: x } })` fez a guarda falhar
  com `app/api/zz-prova-guarda/route.ts:4 deal.findUnique — busca por id sem conta`. A rota foi apagada em seguida.

**Seção 3, banco** (transação só de leitura, só contagens):

| Medida | Resultado |
|---|---|
| Migração `20260925000000_isolamento_contas` | aplicada |
| Ações de IA `SUCCESS` sem revisor desde o deploy da US2 (25/09 13h40) | **0** |
| Ações ainda em `PENDING` | 0 (a migração passou todas para `NEEDS_APPROVAL`) |
| Registros em `AuditLog` | 0: a US3 acabou de subir e ninguém exportou ainda |
| Contas com App Secret do WhatsApp | 0: falta colar na conta de teste da equipe |

O único passo que falta para a conta da equipe voltar a receber mensagens pelo WhatsApp oficial é o item 1 da seção 2:
colar o App Secret.
