# Data Model — Intenção de WhatsApp no onboarding

Nenhum modelo novo. Nenhuma migração. Único campo existente reaproveitado.

## `OnboardingProgress.stepData` (existente, `Json?`, hoje sempre `null`)

Chave `whatsapp`, isolada para não colidir com outras etapas futuras que venham a usar o mesmo campo.

```json
{
  "whatsapp": {
    "intent": "waba" | "qr" | "later",
    "declaredAt": "2026-08-26T12:00:00.000Z"
  }
}
```

| Campo | Tipo | Regra |
|---|---|---|
| `intent` | enum string `"waba" \| "qr" \| "later"` | Obrigatório quando a chave `whatsapp` existe. Não há valor para "não declarou" — a **ausência da chave** `whatsapp` é o estado "não declarou" (distinto de `later`, conforme spec §Key Entities). |
| `declaredAt` | ISO 8601 string | Timestamp de quando o usuário escolheu, gerado no servidor (não no client) para evitar relógio de cliente incorreto. |

### Transições de estado

```
(ausência de "whatsapp")  --usuário escolhe waba/qr/later-->  { intent, declaredAt }
```

Não há transição de volta: uma vez declarada, a intenção não é reaberta pela UI (US1, teste 3: "'Depois' não... reaparece na sessão seguinte"). Reconfigurar o WhatsApp de verdade (ex: completar o WABA) não reescreve `stepData` — quem passa a valer é `Organization.wabaEnabled`.

### Quem lê hoje

Ninguém. `stepData` não tem leitor no código antes desta feature (confirmado por varredura registrada no handoff de 25/08). Esta feature introduz o primeiro leitor: o script de relatório de US3.

## Campos de `Organization` consultados (sem alteração de schema)

| Campo | Uso nesta feature |
|---|---|
| `wabaEnabled` (Boolean, existente) | Gate FR-011: organização já tem WABA → não mostra a etapa. |
| `evolutionEnabled` (Boolean, existente) | Gate FR-011: organização já tem canal não oficial → não mostra a etapa. |
| `isTestAccount` (Boolean, existente) | Excluída da contagem em US3, mesmo critério já usado nas medições da spec. |
| `tier`, `wabaGrandfathered` (existentes) | Não lidos por esta feature diretamente — já são o gate da própria página `/dashboard/settings/integrations/whatsapp-official` para a qual a saída "waba" navega. |
