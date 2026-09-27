# Handoff: spec 012, WhatsApp through an integrator (2026-09-27)

## Current state

- The spec is written and pushed: `spec.md` in `b20a93a`, with a quality checklist in which every item passes.
- There is no plan and no code yet. The next command is `speckit-plan`.
- The project's `speckit-*` skills live in `.claude/skills/`. A session opened in the `ROI Labs` root does not list
  them, so read their `SKILL.md` and follow it by hand.

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
