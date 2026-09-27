# Quickstart: validar a 012

Tudo roda no diretório do projeto (`CRM/crm-project`), fora os passos marcados como "console do container", que rodam
no terminal do serviço no EasyPanel.

## 0. Antes do push da migration do banco WA (gate)

O banco WA não é acessível da máquina local, então esta checagem roda no console do container, com a imagem que está no
ar hoje.

1. **Variáveis**: `DATABASE_URL_WA` e `DATABASE_URL_WA_DIRECT` precisam estar definidas no serviço. O `migrate` usa a
   segunda.

   ```sh
   test -n "$DATABASE_URL_WA_DIRECT" && echo ok
   ```

2. **Diferença entre o banco real e o schema** (só leitura):

   ```sh
   node node_modules/prisma/build/index.js migrate diff \
     --from-url "$DATABASE_URL_WA" --to-schema-datamodel prisma/whatsapp.prisma --script
   ```

   - **Vazio, ou só itens que o app não usa**: pode subir a migration.
   - **Falta `WhatsAppConnection`, `WhatsAppMessage` ou o enum `WhatsAppStatus`**: não sobe. Volta ao research R1.

3. **Contagem das conexões antigas do gateway**, que ficam descontinuadas. Rode num `psql` apontado para
   `$DATABASE_URL_WA`:

   ```sql
   SELECT status, count(*) FROM "WhatsAppConnection" GROUP BY status;
   ```

   Anote o resultado no handoff. Ele substitui o "não medido" das Assumptions da spec.

## 1. Suíte

```bash
npx prisma generate --schema prisma/wa/schema.prisma
npx tsc --noEmit -p tsconfig.json
npx vitest run __tests__/whatsapp-integrador __tests__/isolamento
npx vitest run
```

| Teste | O que prova |
|---|---|
| `interpretar.test.ts` | as fixtures de cada integrador viram o evento certo: texto, mídia, `fromMe`, LID com e sem telefone; grupo, status e canal viram `[]` |
| `telefone.test.ts` | `+55 11 98765-4321`, `5511987654321`, `551187654321` e `11987654321` dão a mesma chave, e o DDD diferente dá outra |
| `travas.test.ts` | toda origem diferente de `'inbox'` é recusada; dois destinatários são recusados; "SAIR", "Parar." e "stop" travam; uma mensagem nova destrava; o 21º envio do minuto é recusado |
| `caminhos-de-envio.test.ts` | `forward`, `send-template`, `send-buttons`, `send-location`, `agaas-executor` e `/api/v1/whatsapp/send` não importam o envio pelo integrador (SC-006) |
| `webhook.test.ts` | segredo errado ou ausente dá `404` e nenhuma gravação (SC-007); o mesmo aviso três vezes dá uma mensagem (SC-004); conta suspensa dá `200` sem gravar |
| `conexoes.test.ts` | sem aceite dá `400` sem gravar; vendedor dá `403`; Free dá `403`; endereço interno ou `http://` é recusado antes de qualquer chamada; a resposta nunca contém credencial; a mesma instância em outra conta dá `409` |
| `estado.test.ts` | aviso e cron concorrentes na mesma queda geram uma notificação; a volta registra o tempo fora |
| `status-entrega.test.ts` | `READ` seguido de `DELIVERED` fica `READ`; `FAILED` não passa por cima de `DELIVERED` |

A guarda estática da 011 (`__tests__/isolamento/guarda-estatica.test.ts`) continua em 0 pontos com o código novo.

## 2. Teste de contrato com instância real (antes do push de código)

Uma instância de teste de cada integrador, com um chip de teste. Nunca use o número de um cliente.

1. Suba o app local com `npm run dev`.
2. Exponha o app com um túnel HTTPS (`cloudflared tunnel --url http://localhost:3000`) e ponha o endereço do túnel em
   `NEXT_PUBLIC_APP_URL`. Os integradores só aceitam aviso em HTTPS.
3. Em cada integrador, conecte pela tela e confira:
   - o aviso de mensagem de texto, foto e áudio chega e aparece no inbox;
   - o QR aparece e troca para "Conectado" depois de escanear;
   - a resposta pelo Sirius chega no celular;
   - a resposta pelo celular aparece como enviada pela empresa.
4. Os caminhos marcados com *(confirmar)* no research R2 viram fato ou são corrigidos no adaptador. Os corpos reais
   recebidos viram as fixtures de `__tests__/whatsapp-integrador/fixtures/`, com os tokens trocados por `REDACTED`.

## 3. Depois do deploy (produção)

1. **Migration**: no log da subida aparece `Running WhatsApp DB migrations...`. Na primeira vez aparece também a
   marcação de `0_init`, e depois a aplicação de `20260928000000_integradores`. O container fica saudável
   (`/api/health`).
2. **Cron**: no mesmo agendador dos outros `/api/cron/*`, registre
   `GET <app>/api/cron/whatsapp-integradores` a cada 5 minutos, com `Authorization: Bearer $CRON_SECRET`. Confira que
   a primeira chamada responde `200` com `conferidas`.
3. **Aviso sem segredo**:

   ```sh
   curl -X POST <app>/api/webhooks/whatsapp-integrador/x -d '{}'
   ```

   Esperado: `404`.
4. **Conta Starter de teste**: conecte a instância Z-API de teste pela tela e confira:
   - o aceite aparece em Configurações → Auditoria, com usuário, IP e a versão do aviso;
   - uma mensagem do celular do cliente aparece no inbox em até 10 s.
5. **Queda**: desconecte a sessão no celular. Confira:
   - em até 15 minutos, o dono recebe uma notificação e o inbox mostra "WhatsApp (Z-API) desconectado desde…";
   - reconectando pelo QR, o aviso some, e o motivo mostra quanto tempo a conexão ficou fora.
6. **Seção 6.5**:
   - mande "SAIR" do celular do cliente e tente responder pelo Sirius: a resposta é recusada com o motivo;
   - mande "oi" e responda: a resposta sai.
7. **SC-002**: rode num `psql` apontado para `$DATABASE_URL_WA` a consulta abaixo e cruze os resultados com
   `AuditLog` no banco CRM. Toda conexão precisa ter um aceite com `createdAt` anterior ao `connectedAt`.

   ```sql
   SELECT id, "organizationId", "connectedAt" FROM "WhatsAppConnection" WHERE provider IS NOT NULL;
   ```

8. **Textos (SC-008)**:

   ```bash
   rg -n -i "whatsapp[^\n]{0,60}(só|apenas|exclusiv)[^\n]{0,30}business" messages lib app
   ```

   Esperado: zero ocorrências que afirmem "WhatsApp só no Business" ou WhatsApp oficial no Starter ou no Pro.
