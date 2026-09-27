# Handoff: spec 012, WhatsApp through an integrator (2026-09-27)

## Current state

- The spec is written and pushed: `spec.md` in `b20a93a`, with a quality checklist in which every item passes.
- The plan is done: `plan.md`, `research.md`, `data-model.md`, `contracts/rotas.md`, `contracts/adaptador.md` and
  `quickstart.md`. There is no code yet.
- `tasks.md` is done: 78 tasks in 8 phases (27/09). The next command is `speckit-analyze`, then `speckit-implement`
  starting at the gate T005.
- The project's `speckit-*` skills live in `.claude/skills/`. A session opened in the `ROI Labs` root does not list
  them, so read their `SKILL.md` and follow it by hand.

## What the plan decided that the next session must not miss

- **The WA database has no migration path today.** `docker/entrypoint.sh` skips it ("managed by whatsmeow Go
  service"), and that service is gone. The plan does the following (research R1):
  - moves the schema to `prisma/wa/schema.prisma`;
  - adds a `0_init` baseline;
  - adds an additive `IF NOT EXISTS` migration;
  - makes the entrypoint run `migrate deploy`, falling back to `migrate resolve --applied 0_init` on the first boot.
- **Gate before push A**: run the read-only `migrate diff --from-url "$DATABASE_URL_WA"` in the EasyPanel container
  console, and check that `DATABASE_URL_WA_DIRECT` is set (quickstart §0). Nobody can reach the WA database from the
  local machine.
- **No new column on the CRM database.** The "SAIR" lock, "has this contact ever written", the per-minute limit and
  "which connection does this conversation use" are all derived from `WhatsAppMessage` (research R7).
- **The official webhook route gets fixed along the way.** It moves to the shared `lib/whatsapp/entrada.ts`:
  - processing moves to `after()`;
  - dedup becomes `create` plus P2002;
  - status only moves forward.
- **Findings**:
  - `whatsapp.message.in` and `notifyWhatsAppMessage` are never fired today, not even for the official API (R11);
  - `checkWhatsAppInstanceLimit` counts the add-on twice (R9);
  - the chat page gates on the raw tier, so trial accounts are left out (R9).
- **uazapi paths marked *(confirmar)*** in research R2 must be checked against a real test instance before push B
  (quickstart §2). The real payloads become the test fixtures.
- **The cron scheduler is outside the repo.** Register `/api/cron/whatsapp-integradores` every 5 minutes next to the
  other `/api/cron/*` jobs.

## Owner's decisions (27/09)

- The first version supports **Z-API, uazapi and Evolution API v2**. W-API and WAHA come later.
- Integrator connections are open on **every paid plan**:

  | Plan | Connections |
  |---|---|
  | Starter | 1 |
  | Pro | 2 |
  | Business | 5 |

  More can be bought with the `WHATSAPP_EXTRA_INSTANCE` add-on. The official API stays on Business.
- The customer brings their own integrator account (Terms 6.3). Sirius stores the URL and the token, encrypted, per
  connection.

## What `speckit-plan` needs to research

For each of the three APIs:

- the inbound message payload, including `fromMe`, groups and `@lid`;
- the connection or disconnection event;
- how to set the webhook through the API, so the customer does not configure it by hand;
- the endpoint that returns the QR Code;
- the status endpoint the cron will call to detect a silent drop.

Also check whether any of the three signs its webhooks. If none does, the per-connection secret goes in the webhook
path.

## Seams that already exist (reuse them)

- **`WhatsAppConnection`** (`prisma/whatsapp.prisma`, WA database). It still needs `provider`, `baseUrl`, the encrypted
  credentials, the webhook secret and the reason for the last status change.
- **Chat.** `components/chat/message-area/use-send-message.ts` already sends `connectionId` to
  `/api/whatsapp/send-message` and `/send-media`. Those routes answer 410 today and will come back for integrators.
- **WABA inbound.** `app/api/webhooks/whatsapp-official/route.ts` is the model for the normalized handling. Two things
  still need fixing there:
  - process after the 200 with `after()`;
  - replace `findFirst` + `create` with `create` plus catching P2002.
- **Helpers:**
  - `registrarAceiteIntegrador` (`lib/auditoria.ts`) and `<AceiteIntegrador>` (`components/chat/aceite-integrador.tsx`);
  - `fetchPublico` (`lib/url-publica.ts`), required on every outbound call;
  - `encrypt` / `decrypt` (`lib/encryption.ts`);
  - `checkWhatsAppInstanceLimit` (`lib/entitlements.ts`);
  - `lib/integrations/rate-limiter.ts`.
- **Who can change settings.** `autorizarConfiguracao()` (`lib/visibilidade.ts`, `8a12898`) is the guard for owner and
  manager. Use it in the connection routes.

## Also delivered in this session

`8a12898`: account-wide integration settings are now limited to the owner and the manager.

- **Covered routes:** official WhatsApp, n8n, Omie and Google Calendar.
- **Official WhatsApp plan rule:** the route now matches the page: Business, or an account that had access before.
- **Google Calendar OAuth:**
  - the `state` is encrypted and expires in 10 minutes;
  - the callback checks that whoever started the flow is still owner or manager of that account.
- **Test:** `__tests__/isolamento/integracoes.test.ts`.

## Test suite and CI on 27/09

- The 4 signup tests that broke with the acceptance change were fixed in `8442652`.
- The CI gate had been red since `feat(legal)` because of an ESLint error in `VitaisDeCampo` and the unimported
  `<AceiteIntegrador>`. Both were fixed in `f572a5e`, and the gate is green again.
- When spec 012 imports `<AceiteIntegrador>`, remove it from `scripts/dead-code-allowlist.json`.
- `public-css-guard` and `multi-tenant/deal-isolation` still sometimes exceed 5 s in the full parallel run.
