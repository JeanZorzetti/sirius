# Handoff: spec 012, WhatsApp through an integrator (2026-09-27)

## Current state (after `speckit-implement`, 27/09)

78 of 84 tasks are done and marked `[X]` in `tasks.md`. The code sits on the branch `012-whatsapp-integradores`, not on
`main`, because push A runs a migration on the production WA database at container start and its gate (T005) has not
run. Pushing to `main` is a deploy.

### Still open, and who does it

| Task | What | Who |
|---|---|---|
| T005 | Gate in the EasyPanel container console (quickstart §0): `DATABASE_URL_WA_DIRECT` set, read-only `migrate diff` against the image in production, count of connections by status. Record the result here. | Jean. The VPS port 22 did not answer from this machine, and the WA database is not reachable locally. |
| T010 | Push A: fast-forward `main` to the first commit of the branch, then read the boot log (`Running WhatsApp DB migrations...`, the `0_init` baseline mark, the `20260928000000_integradores` migration) and `/api/health`. | after T005 |
| T059 | Contract test with a real test instance of Z-API, uazapi and Evolution (quickstart §2): fix the `TODO(012 §2)` paths in `uazapi.ts` and `desligarAviso` in `zapi.ts`; replace the fixtures in `__tests__/whatsapp-integrador/fixtures/` with real bodies (tokens as `REDACTED`). | needs test instances and a test SIM |
| T071 | Register `GET /api/cron/whatsapp-integradores` every 5 min with `Authorization: Bearer $CRON_SECRET`, next to the other `/api/cron/*` jobs. Note where here. | Jean (the scheduler is outside the repo) |
| T083 | Replace "não medido" in the spec Assumptions with the T005 count. | after T005 |
| T084 | Quickstart §3 after the deploy, and the SC-003 p95 after 7 days. | after the deploys |

### Order to reach `main`

The branch has three commits, in this order:

1. **A: WA database.** Schema moved to `prisma/wa/schema.prisma`, `0_init` baseline, the additive migration, the
   entrypoint that runs `migrate deploy` (with the baseline fallback), and the new path in `package.json`,
   `Dockerfile`, `playwright.config.ts` and every `ci.yml` job. The app does not change behavior. Only after T005.
2. **B+C: integrator connections, inbox, 6.5 locks and the drop warning.** US1, US2, US4 and US3 together. The plan had
   B and C as separate pushes "on the same day"; the code shares `estado.ts`, the chat interface and the connection
   manager, so they travel together. Only after T059 and with the cron registered (T071) the same day.
3. **D: public texts and docs.** `marketing.json` (pricing table included), help, FAQ, blog posts, the logged-in plans
   table, the integrations card, `tasks.md` and this handoff. Only after B+C is live.

The replay of the production path ran against the local Postgres (`sirius-e2e-pg`): a database built from the
baseline, with no history, answers P3005 on `deploy`; `resolve --applied 0_init` then `deploy` applies the migration;
a second boot is a no-op; a stray `resolve` answers P3008, which stops the boot through `set -e` (checked in Alpine
`sh`). The migration also reruns cleanly on a database that already has it.

### Decisions taken while implementing

- **Limit before credentials, except uazapi.** uazapi only says its instance identity on the status call, so for it the
  limit and the "instance in another account" checks run right after `conferir()`. The identity of uazapi and
  Evolution instances carries the server host (`host/instance`), so two customers with an instance named "loja" on
  different servers do not collide on `instanciaChave`.
- **One notice per drop.** `mudarEstado` notifies owner and managers only on a drop from `CONNECTED` to
  `DISCONNECTED`/`FAILED`, and on any `SUSPENDED`. A drop that gets worse (`DISCONNECTED` to `FAILED`) was already
  told. Going to `CONNECTING` for the QR after a drop keeps the drop time, so the return reads "voltou depois de N min
  fora". The cron does not treat a connection still waiting for its first QR as a drop.
- **The reply route comes from the conversation.** The chat reads `connectionId` of the last message
  (`ChatLastMessage`); null is the official API. A contact who never wrote gets the official API when the account has
  it, the only integrator connection otherwise, or a "Enviar por" picker in the composer. The old connection picker
  in the chat header is gone.
- **Failed sends stay on screen.** The bubble shows "não enviada · <motivo>" and keeps the text; a 502 returns the
  saved `FAILED` row.
- **Sofia stays on the official path.** The AI agents still fire only from the official webhook, which now goes
  through `registrarEntrada` with processing in `after()`.
- **LID contacts.** A contact created from a LID alone has no phone; the chat sidebar and the contact profile show
  "Completar cadastro", which saves only the phone through the new `completarTelefone` action (the existing
  `updateContact` rewrites every field).
- **Media types.** `send-media` accepts JPG/PNG, MP4/3GPP, OGG/MPEG/MP4/AAC/AMR/WebM audio (WebM becomes OGG with
  ffmpeg, now shared in `lib/whatsapp/audio.ts`) and office/PDF/text/zip documents; anything else is 415.

### Fixed along the way

- `app/api/contact/[id]/interactions` filtered the thread by the account's connection ids whenever the account had
  any connection, which hid the official API messages (`connectionId` null). An account can now have both.
- `/api/whatsapp/forward` answers 409 with the FR-020 reason instead of "WABA não configurado".
- `/api/v1/whatsapp/send` says sending through the public API is official-API only.

### Found and left out of 012

- 29 blog passages promise a 14-day trial; the trial is 7 days.
- FAQ and posts say the free plan covers "até 50 clientes/contatos"; the plan has 250 contacts, and the free plan
  becomes read-only after the trial.
- The `whatsappMigration` e-mail template (admin broadcast for grandfathered accounts) still says the official API is
  the only integration; it is not a public page and was not sent again.

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
