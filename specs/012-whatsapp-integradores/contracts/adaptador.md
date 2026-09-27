# Contrato: adaptador de integrador

Um módulo por integrador em `lib/whatsapp/integradores/` (`zapi.ts`, `uazapi.ts` e `evolution.ts`), todos com esta
forma. `adaptador(provider)` em `index.ts` devolve o módulo certo. Os caminhos, os corpos e a tradução de cada
integrador estão na tabela do research R2.

```ts
type Credenciais =
  | { provider: 'ZAPI'; instanceId: string; token: string; clientToken?: string }
  | { provider: 'UAZAPI'; baseUrl: string; token: string }
  | { provider: 'EVOLUTION'; baseUrl: string; instanceName: string; apiKey: string }

type EstadoIntegrador = {
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'FAILED'
  motivo: string | null          // frase para a tela: "sessão encerrada no celular", "número bloqueado"...
  phoneNumber: string | null     // só dígitos, quando pareado
}

type Midia = { buffer: Buffer; mimetype: string; nomeArquivo?: string }

interface Adaptador {
  /** Resolves the instance identity and checks the credentials. Throws RecusaIntegrador naming the refused field. */
  conferir(c: Credenciais): Promise<{ instanceName: string } & EstadoIntegrador>
  ligarAviso(c: Credenciais, url: string): Promise<void>
  desligarAviso(c: Credenciais): Promise<void>
  qrCode(c: Credenciais): Promise<{ qrCode: string } | { conectado: true; phoneNumber: string | null }>
  estado(c: Credenciais): Promise<EstadoIntegrador>
  enviarTexto(c: Credenciais, para: string, texto: string): Promise<{ messageId: string }>
  enviarMidia(c: Credenciais, para: string, midia: Midia & { tipo: 'image' | 'video' | 'audio' | 'document'; legenda?: string; ptt?: boolean }): Promise<{ messageId: string }>
  baixarMidia(c: Credenciais, ref: RefMidia): Promise<Midia>
  /** Pure: turns one notice body into zero or more events. Unknown or ignored notices return []. */
  interpretar(corpo: unknown): Evento[]
}
```

## Evento normalizado

```ts
type Evento =
  | {
      tipo: 'mensagem'
      messageId: string
      jid: string                      // remoteJid as the integrator sent it (phone JID or @lid)
      telefone: string | null          // digits, from the JID or the alternate field (phone, sender_pn, remoteJidAlt)
      nomePerfil: string | null
      fromMe: boolean
      enviadaEm: Date
      texto: string                    // body or caption; "[Imagem]", "[Áudio]"... when empty, like the official route
      midia: { tipo: 'image' | 'video' | 'audio' | 'document' | 'sticker'; ref: RefMidia } | null
    }
  | { tipo: 'entrega'; messageIds: string[]; status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' }
  | { tipo: 'conexao'; status: EstadoIntegrador['status']; motivo: string | null; phoneNumber: string | null }

// Where to fetch the media later: the Z-API URL (30 days) or the message id on uazapi and Evolution
type RefMidia = { url: string } | { messageId: string }
```

## Regras do `interpretar`

- **Descartados**: grupo, status, canal e lista de transmissão devolvem `[]` (FR-013).
- **Eco do próprio envio**: o `fromApi` da Z-API e o `wasSentByApi` da uazapi viram `[]`. Na Evolution, que não
  marca o eco, a dedup por `messageId` resolve (research R5).
- **Aviso desconhecido**: vira `[]` e um log com o tipo, nunca com o corpo.
- **Função pura**: `interpretar` não faz I/O. Cada integrador tem fixtures reais em
  `__tests__/whatsapp-integrador/fixtures/<provider>/`, e o teste confere a tradução de cada uma.

## Erros

- `RecusaIntegrador` (credencial, instância inexistente, 401 ou 403): tem `campo`, com o dado recusado, e `motivo`, que
  a rota devolve em `422`. Na conferência do cron, a conexão vai para `FAILED`.
- `EnderecoNaoPermitido` vem de `fetchPublico` e vira `400` na criação.
- Tempo esgotado ou erro 5xx: na criação, `502`. No cron, a conexão fica como está e entra em `falhas` na resposta.
  Uma falha de rede não é queda.
