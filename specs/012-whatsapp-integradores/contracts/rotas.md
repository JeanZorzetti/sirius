# Contrato: rotas do Sirius

Todas as rotas de conexão respondem só com os campos de `ConexaoPublica`. Credenciais, segredo e hash nunca saem
(FR-005). Os erros seguem o padrão do repositório, `{ error: string }` com o status HTTP.

```ts
type ConexaoPublica = {
  id: string
  provider: 'ZAPI' | 'UAZAPI' | 'EVOLUTION' | null   // null = conexão antiga do gateway, descontinuada
  instanceName: string
  baseUrl: string | null
  phoneNumber: string | null
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'FAILED' | 'SUSPENDED'
  statusMotivo: string | null
  statusMudouEm: string | null   // ISO
  connectedAt: string | null
}
```

## `GET /api/whatsapp/connections`

- **Quem**: qualquer usuário da conta.
- **200**: `{ conexoes: ConexaoPublica[], limite: number, usadas: number, podeGerenciar: boolean }`.
  - `podeGerenciar` é `true` para dono e gerente. A tela usa o campo para mostrar só leitura.
  - A lista traz as conexões com `provider` e deixa de fora as antigas do gateway.

## `POST /api/whatsapp/connections`: conectar

- **Quem**: dono ou gerente (`autorizarConfiguracao()`). Outro papel: `403`.
- **Corpo**:

  ```ts
  { provider: 'ZAPI', instanceId: string, token: string, clientToken?: string, aceite: true }
  | { provider: 'UAZAPI', baseUrl: string, token: string, aceite: true }
  | { provider: 'EVOLUTION', baseUrl: string, instanceName: string, apiKey: string, aceite: true }
  ```

- **Ordem**: cada passo só roda se o anterior passou.
  1. **Plano**: conta sem plano pago (plano efetivo Free): `403`, "WhatsApp por integrador está nos planos pagos".
  2. **Corpo**: validado com zod. Campo faltando: `400`, dizendo qual.
  3. **Endereço**: `baseUrl` passa por `garantirUrlPublica(url, { exigirHttps: true })`. Endereço recusado: `400`,
     "o endereço precisa ser público e com HTTPS". Nenhuma chamada sai antes disso.
  4. **Aceite**: sem `aceite: true`: `400`, "o aceite do aviso é obrigatório". Nada é gravado.
  5. **Limite**: com `usadas >= limite`, a resposta é `409`, com o limite e o caminho do add-on ou do plano seguinte.
     Quando a conexão reusa uma linha que ainda tem credencial, essa linha não entra em `usadas`.
  6. **Instância**: `instanciaChave` ativa em outra linha: `409`, "esta instância já está conectada no Sirius". A
     resposta não diz em qual conta.
  7. **Credenciais**: o adaptador chama `conferir()`. Credencial recusada: `422`, dizendo qual dado o integrador recusou.
     Nada é gravado.
  8. **Aceite gravado**: `registrarAceiteIntegrador()` grava o aceite com usuário, IP e versão do aviso.
  9. **Conexão**: a linha é criada ou reusada pelo `(organizationId, instanceName)`, com as credenciais cifradas, o hash
     do segredo, `instanciaChave`, `avisoVersao` e o estado `CONNECTING`.
  10. **Aviso**: o adaptador chama `ligarAviso()` com o endereço do segredo. Se falhar, a conexão vai para `FAILED`
      com o motivo, e a resposta é `502`.
  11. **Estado**: o adaptador chama `estado()`. Já pareada: `CONNECTED`, com o número.
- **201**: `ConexaoPublica`. Com o estado `CONNECTING`, a tela busca o QR.

## `GET /api/whatsapp/connections/[id]/qr-code`

- **Quem**: dono ou gerente. A conexão precisa ser da conta; senão, `404`.
- **200**:
  - `{ status: 'CONNECTED', phoneNumber }` quando já pareou. A tela fecha o QR.
  - `{ status: 'CONNECTING', qrCode: 'data:image/png;base64,…' }` quando ainda não pareou.
- A tela chama a rota a cada 3 s enquanto está aberta, porque o QR dos integradores renova a cada ~20 s. Essa mesma
  chamada troca a tela para "Conectado" sem recarregar (FR-007).
- Serve também para reconectar uma conexão em `FAILED` ou `DISCONNECTED`.

## `DELETE /api/whatsapp/connections/[id]`: desconectar

- **Quem**: dono ou gerente. A conexão precisa ser da conta; senão, `404`.
- **O que faz**:
  1. tenta `desligarAviso()` no integrador; uma falha é registrada e não impede o resto;
  2. zera `apiKey`, `webhookSegredoHash` e `instanciaChave`;
  3. muda o estado para `DISCONNECTED`, com o motivo "desconectada por <nome>", sem notificação.
- As mensagens ficam (FR-028).
- **200**: `ConexaoPublica`.

## `POST /api/whatsapp/send-message` e `POST /api/whatsapp/send-media`

As duas rotas deixam de responder `410` e passam a enviar pelo integrador. A API oficial continua em `send-waba` e
`send-waba-media`.

- **Quem**: qualquer usuário da conta, porque responder pelo inbox é o trabalho do vendedor.
- **Corpo**: `{ connectionId, contactId, message, replyToId? }`, ou `FormData` com `file`, `connectionId`,
  `contactId`, `caption?`, `ptt?` e `duration?`.
- **Ordem**:
  1. O contato e a conexão precisam ser da conta; senão, `404`.
  2. O `connectionId` precisa ser a conexão da conversa (FR-018). Se não for: `409`, "esta conversa chegou por outro
     número".
  3. A conexão precisa estar em `CONNECTED` e a conta num plano pago. Senão: `409`, com o estado e o motivo.
  4. As travas da seção 6.5 rodam com a origem `'inbox'` e um destinatário. Recusa: `409`, com o motivo.
  5. A mídia é conferida antes de sair. Fora do tamanho ou do tipo: `413` ou `415`, com o limite escrito.
  6. A mensagem é gravada como `PENDING`, o adaptador envia, e o id devolvido é gravado com o estado `SENT`.
- **201**: a mensagem gravada, no formato que o chat já usa.
- **Falha no integrador**: a mensagem fica gravada como `FAILED`, com o `erro`, e a resposta é `502` com a mensagem e o
  motivo. O chat mostra a bolha "não enviada · <motivo>" em vez de apagar o texto.

## `POST /api/webhooks/whatsapp-integrador/[segredo]`

- **Autenticação**: pelo SHA-256 do segmento `[segredo]`, buscado em `webhookSegredoHash`.
  - Não achou, ou a conexão não tem `provider`: `404`, e nada é gravado nem lido de outra conta.
- **Corpo inválido**: `400`.
- **Descarte com 200**:
  - conta sem plano pago ou conexão `SUSPENDED`: `200` e nada gravado;
  - grupo, status e canal: `200` e nada gravado (FR-013).
- **Resposta**: `200` logo depois de validar. O processamento roda em `after()` (FR-011):
  - **mensagem**: `registrarEntrada()` (`lib/whatsapp/entrada.ts`);
  - **estado de entrega**: `avancarStatus()`;
  - **conexão**: `mudarEstado()`.
- **Nunca registra o corpo cru**: a uazapi e a Evolution mandam a credencial da instância dentro dele.

## `GET /api/cron/whatsapp-integradores`

- **Autenticação**: `Authorization: Bearer $CRON_SECRET` ou `?token=`, como os outros crons. Sem ela: `401`.
- **Frequência**: a cada 5 minutos.
- **O que faz**: confere as conexões com `provider` e `apiKey` (research R8), de 10 em 10, com tempo limite de 10 s por
  chamada.
- **200**: `{ conferidas, mudancas, falhas, ms }`.
