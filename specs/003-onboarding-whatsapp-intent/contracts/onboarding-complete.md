# Contrato — `POST /api/onboarding/complete` (estendido)

Endpoint existente ([app/api/onboarding/complete/route.ts](../../../app/api/onboarding/complete/route.ts)). Esta feature adiciona um campo opcional ao corpo; nenhum campo existente muda de significado.

## Request

```http
POST /api/onboarding/complete
Content-Type: application/json
Cookie: <sessão autenticada>
```

```json
{
  "status": "COMPLETED" | "SKIPPED",
  "intent": "waba" | "qr" | "later"
}
```

- `status`: **inalterado** — já existe hoje. Continua obrigatório na semântica atual (default `COMPLETED` se ausente ou diferente de `SKIPPED`, conforme `route.ts:17`).
- `intent`: **novo**, opcional. Ausente ou `undefined` → `stepData.whatsapp` não é escrito (comportamento idêntico ao atual). Presente → `stepData` recebe/atualiza a chave `whatsapp` com `{ intent, declaredAt: <now, gerado no servidor> }`.

Valor de `intent` fora do enum é ignorado silenciosamente (não grava `stepData.whatsapp`, não falha a request) — consistente com FR-012 (falha não pode travar o onboarding nem gravar valor diferente do declarado).

## Response

```json
{ "success": true, "status": "COMPLETED" }
```

Inalterado. Nenhum eco de `intent` na resposta — o client não depende disso (é fire-and-forget na etapa de intenção, mesmo padrão do `handleClose` atual, mas sem o bug de sobrescrita: esta chamada acontece uma única vez, ao final da etapa nova, não em paralelo com nenhuma outra).

## Casos de erro

Sem mudança nos códigos de erro existentes (`401` sem sessão, `400` sem organização, `500` erro interno). Um `intent` inválido não é um caso de erro — é ignorado (ver acima).
