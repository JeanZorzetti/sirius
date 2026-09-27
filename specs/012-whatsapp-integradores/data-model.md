# Data model: 012 WhatsApp pelo integrador

Todas as mudanças são no banco WA (`prisma/wa/schema.prisma`, antes `prisma/whatsapp.prisma`) e entram numa migration
aditiva (`prisma/wa/migrations/20260928000000_integradores`), escrita com `IF NOT EXISTS`. O banco CRM não muda. Como o
banco WA ganha migration pela primeira vez, a migration vem depois da linha de base `0_init` (research R1).

## Enums

```prisma
enum WhatsAppIntegrador {   // NOVO
  ZAPI
  UAZAPI
  EVOLUTION
}

enum WhatsAppStatus {
  DISCONNECTED
  CONNECTING
  CONNECTED
  FAILED       // mostrado como "Reconectar"
  SUSPENDED    // NOVO: conta sem plano pago
}
```

## WhatsAppConnection

Mudanças na linha de conexão que já existe:

| Campo | Tipo | Novo? | Regra |
|---|---|---|---|
| `provider` | `WhatsAppIntegrador?` | sim | Nulo nas conexões antigas do gateway por QR, que ficam descontinuadas: não enviam, não recebem e não contam no limite. |
| `baseUrl` | `String?` | sim | Endereço do servidor, na uazapi e na Evolution. É conferido por `garantirUrlPublica(url, { exigirHttps: true })` antes de salvar. A Z-API usa o endereço fixo e grava nulo. |
| `instanceName` | `String` | já existe | O identificador da instância no integrador: o ID na Z-API, o nome ou id devolvido pelo status na uazapi e `host/nome` na Evolution. O `@@unique([organizationId, instanceName])` faz a reconexão da mesma instância reusar a linha e manter o histórico. |
| `apiKey` | `String?` `@db.Text` | já existe | As credenciais, num JSON cifrado com `encrypt()` (`lib/encryption.ts`). Nunca aparecem em resposta, log nem exportação. Viram nulo quando o dono desconecta. |
| `webhookSegredoHash` | `String?` `@unique` | sim | O SHA-256 hex do segredo do endereço do aviso. O segredo em si só existe na hora de ligar o aviso. Vira nulo quando o dono desconecta. |
| `instanciaChave` | `String?` `@unique` | sim | `provider:instanceName` enquanto a conexão tem credencial, e nulo depois. Impede a mesma instância em duas conexões ativas, em qualquer conta (FR-008). |
| `phoneNumber` | `String?` | já existe | O número pareado, só dígitos, lido do integrador. No pareamento, que é quando o número aparece, `numeroJaConectado()` compara o número pela chave do telefone (research R6) com o `display_phone_number` da API oficial, quando a conta tem, e com as outras conexões da conta que têm credencial. Número igual deixa a conexão em `FAILED`, com o motivo "número já conectado pela API oficial" ou "este número já está conectado nesta conta", e desliga o aviso (FR-008). |
| `status` | `WhatsAppStatus` | já existe | Ver a máquina de estados. |
| `statusMotivo` | `String?` | sim | A frase que a tela mostra: "sessão encerrada no celular", "credenciais recusadas", "plano sem WhatsApp", "voltou depois de 12 min fora". |
| `statusMudouEm` | `DateTime?` | sim | A hora da última mudança de estado. A tela mostra "desconectado desde 03:12". |
| `avisoVersao` | `String?` | sim | A versão do aviso de risco aceita na ativação (`VERSAO_AVISO_INTEGRADOR`). Se ela mudar, a reativação pede novo aceite (FR-027). |
| `userId` | `String` | já existe | Quem conectou. |
| `connectedAt` | `DateTime?` | já existe | A primeira vez que a conexão ficou `CONNECTED`. |
| `lastSyncAt` | `DateTime?` | já existe | A hora da última conferência do cron. |
| `qrCode` e `webhookUrl` | | já existem | Não são usados: o QR é buscado ao vivo e o endereço do aviso sai do segredo. |

**Índices novos**: `@unique(webhookSegredoHash)`, `@unique(instanciaChave)` e `@@index([provider, status])`, usado pelo
cron. O PostgreSQL aceita vários nulos num `unique`, então as linhas antigas não conflitam.

## WhatsAppMessage

| Campo | Tipo | Novo? | Regra |
|---|---|---|---|
| `erro` | `String?` `@db.Text` | sim | O motivo da falha de envio: a recusa do integrador, uma trava da seção 6.5 ou a conexão caída. A bolha mostra "não enviada · <erro>". |
| `connectionId` | `String?` | já existe | Preenchido nas mensagens do integrador e nulo nas da API oficial. Decide por onde a resposta sai (FR-018). |
| `messageId` | `String?` | já existe | O id que o integrador dá à mensagem. `@@unique([organizationId, messageId])` faz a dedup (FR-012). |
| `remoteJid` | `String` | já existe | O JID completo, com telefone ou `@lid`. Casa o LID com o contato de mensagens anteriores (research R6). |
| `status` | `WhatsAppMessageStatus` | já existe | Só anda para frente: `PENDING < SENT < DELIVERED < READ`. `FAILED` só entra sobre `PENDING` ou `SENT`. |

## Regras derivadas, sem coluna

| Regra | De onde sai |
|---|---|
| **O contato já mandou mensagem para esta conexão** (FR-021) | existe `WhatsAppMessage` de entrada com a conta, o contato e a conexão |
| **O contato pediu para parar** (FR-022) | a última mensagem de entrada do contato naquela conexão, normalizada, é `sair`, `parar` ou `stop` |
| **Envios no último minuto** (FR-023) | a contagem de mensagens de saída da conexão com `sentAt` nos últimos 60 s |
| **Conexão da conversa** (FR-018) | a última mensagem de entrada do contato: `connectionId` nulo é a API oficial, preenchido é o integrador. Sem mensagem de entrada, a conversa não tem conexão, e qualquer conexão da conta serve |
| **Limite de conexões** (FR-009) | `PLAN_LIMITS[plano efetivo].maxWhatsAppInstances` mais os add-ons `WHATSAPP_EXTRA_INSTANCE` ativos, contra as linhas com `provider` e `apiKey` preenchidos |
| **Aceite registrado** (FR-003, SC-002) | a linha `AuditLog` com `acao = ACEITE_INTEGRADOR`, gravada antes da ativação por `registrarAceiteIntegrador()`, que já existe |

## Máquina de estados da conexão

```text
            criar (credenciais conferidas, aceite gravado, aviso ligado)
                               │
                               ▼
   ┌──────────────────── CONNECTING ◄──────────── QR pedido de novo
   │   pareou                  │ integrador diz "sem sessão"
   ▼                           ▼
CONNECTED ──── caiu ────► DISCONNECTED ──── voltou sozinha ────► CONNECTED
   │                           │
   │ sessão encerrada,         │ sessão encerrada ou
   │ credencial recusada       │ credencial recusada
   │ ou número proibido        ▼
   └──────────────────────► FAILED ("Reconectar") ── dono pede QR ──► CONNECTING

Qualquer estado ── conta sem plano pago ──► SUSPENDED ── volta ao plano pago ──► estado que o integrador disser
Qualquer estado ── dono desconecta ──► DISCONNECTED, com apiKey, webhookSegredoHash e instanciaChave nulos
```

- **O que dispara a mudança**: o aviso de conexão do integrador, a conferência do cron e as ações do dono.
- **Mudança condicionada**: toda mudança passa por `mudarEstado()`, que faz um `updateMany` condicionado ao estado
  anterior. A mudança para `DISCONNECTED`, `FAILED` ou `SUSPENDED` notifica o dono e os gerentes uma vez só (FR-026).
- **Desconexão pelo dono**: não notifica, porque foi o próprio dono.
- **Envio e recebimento**:
  - envia só em `CONNECTED`;
  - recebe em `CONNECTING` e `CONNECTED`, porque o aviso de pareamento chega antes do estado mudar;
  - recebe também em `DISCONNECTED`: só chega mensagem de sessão viva, então a mensagem é gravada e leva a conexão
    para `CONNECTED` por `mudarEstado`;
  - em `FAILED` e `SUSPENDED`, o aviso é aceito com `200` e descartado sem gravar (FR-027). Em `FAILED` o dono já foi
    notificado para reconectar;
  - conexão sem `provider` não tem `webhookSegredoHash`, então o aviso dá `404`.

## Contato (banco CRM, sem mudança de schema)

- **Casamento**: pela chave `55 + DDD + últimos 8 dígitos` (research R6).
- **Criação**: com `name` do perfil e `phone` em `+55…`. Sem telefone, só com o LID, o contato nasce com `phone` nulo
  e `source: 'whatsapp_lid'`.
- **Sem agentes de IA**: a criação pelo integrador não dispara os agentes de IA.
