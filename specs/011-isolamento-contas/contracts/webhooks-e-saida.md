# Contrato: webhooks de entrada e chamadas de saída

## Entrada (WhatsApp oficial, Facebook Leads, Instagram)

| Pedido | Resposta | Efeito |
|---|---|---|
| `POST` com `X-Hub-Signature-256: sha256=<hmac>` válido | `200 {"status":"ok"}` | processa como hoje |
| `POST` sem o cabeçalho, com HMAC inválido, ou com conta sem App Secret cadastrado | `401 {"error":"assinatura inválida"}` | nada gravado; log `warn` com o motivo, sem o corpo |
| `GET` de verificação (`hub.challenge`) | sem mudança | |

- O HMAC é o SHA-256 do **corpo cru** com a chave (o App Secret), em hexadecimal minúsculo.
- **WhatsApp oficial**: a chave é o `wabaAppSecret` da conta dona do `entry.id`.
- **Facebook Leads e Instagram**: a chave é `FACEBOOK_APP_SECRET` ou `INSTAGRAM_APP_SECRET`.

## Tela de integração do WhatsApp oficial

- **Campo "App Secret"**: só escrita. Depois de salvo, a tela mostra "cadastrado" e um botão para trocar.
- **Aviso** quando a integração está ligada sem App Secret: "Sem o App Secret, o Sirius recusa as mensagens que chegam.
  Pegue a chave no painel do seu app da Meta, em Configurações do app → Básico → Chave secreta do app."

## Saída (endereço configurado pela conta)

- `fetchPublico(url, init, { exigirHttps })` rejeita com `Error('endereço não permitido: <motivo>')` quando:
  - o esquema não é `https:`, e a chamada exige https;
  - o esquema não é `http:` nem `https:`;
  - o host resolve para IP não público, conferido na conexão.
- **Onde a recusa aparece**:
  - **automação**: vai para o `error` da `AutomationExecution`;
  - **n8n e Evolution**: segue o tratamento de erro que cada cliente já tem;
  - **crawler**: a página conta como "não acessível".
