# Quickstart — validar a feature manualmente

Pré-requisito: US0 já mergeada (chamadas `onClose()` redundantes removidas de `welcome-modal.tsx` — feito em 26/08/2026).

## Setup

```bash
cd crm-project
npm run typecheck && npm run test
```

## Cenário 1 — organização nova vê a etapa de intenção

1. Crie/entre com um usuário cuja organização tenha `wabaEnabled = false` e `evolutionEnabled = false`.
2. No dashboard, escolha qualquer um dos três cartões (Demo / Importar / Zero).
3. **Esperado**: em vez de navegar direto, aparece a etapa de intenção com 3 saídas.
4. Escolha "depois". **Esperado**: dashboard libera, `OnboardingProgress.stepData` da org contém `{"whatsapp":{"intent":"later","declaredAt": "..."}}`.
5. Recarregue a página. **Esperado**: a etapa não reaparece (mesma regra que já vale para o welcome modal — `shouldShowOnboarding` fica falso após `status = COMPLETED`).

Verificação no banco:

```sql
select "stepData" from "OnboardingProgress" where "userId" = '<id do usuário de teste>';
```

## Cenário 2 — organização com WhatsApp já ligado não vê a etapa

1. Usuário cuja organização tem `wabaEnabled = true` (ou `evolutionEnabled = true`).
2. Escolha qualquer cartão do welcome modal.
3. **Esperado**: navega direto para o dashboard, sem a etapa de intenção (FR-011).

## Cenário 3 — saída "possui API oficial"

1. Na etapa de intenção, escolha "já possuo API oficial".
2. **Esperado**: navega para `/dashboard/settings/integrations/whatsapp-official` (ou `/upgrade` se o tier não tiver acesso — comportamento herdado, não desta feature).
3. `stepData.whatsapp.intent` gravado como `"waba"` antes da navegação.

## Cenário 4 — US0 (regressão)

1. Usuário novo escolhe "Ver Demonstração".
2. Verificar no banco: `OnboardingProgress.status = 'COMPLETED'` (não `SKIPPED`) após a navegação completar.
3. Repetir para "Começar do Zero".

## Cenário 5 — leitura para US3

```bash
npx tsx scripts/whatsapp-intent-report.ts
```

**Esperado**: contagem de organizações por `intent` (`waba` / `qr` / `later` / "não declarou"), excluindo `isTestAccount = true`.
