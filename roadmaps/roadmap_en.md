# 🌐 Roadmap: English Version (`/en`) — Sirius CRM

> **Goal:** Introduce a fully functional `/en` prefix route for the English version of the entire Sirius CRM project — marketing site, dashboard, blog, API responses, emails, and SEO assets.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Decision: i18n Strategy](#2-architecture-decision-i18n-strategy)
3. [Phase 0 — Foundation & Infrastructure](#3-phase-0--foundation--infrastructure)
4. [Phase 1 — Marketing Pages (Public)](#4-phase-1--marketing-pages-public)
5. [Phase 2 — Auth & Onboarding](#5-phase-2--auth--onboarding)
6. [Phase 3 — Dashboard (Authenticated)](#6-phase-3--dashboard-authenticated)
7. [Phase 4 — Blog & Content](#7-phase-4--blog--content)
8. [Phase 5 — API & Backend](#8-phase-5--api--backend)
9. [Phase 6 — Emails & Notifications](#9-phase-6--emails--notifications)
10. [Phase 7 — SEO & Metadata](#10-phase-7--seo--metadata)
11. [Phase 8 — QA, Testing & Launch](#11-phase-8--qa-testing--launch)
12. [File Inventory & Scope Matrix](#12-file-inventory--scope-matrix)
13. [Risk Registry](#13-risk-registry)
14. [Timeline Estimate](#14-timeline-estimate)

---

## 1. Executive Summary

The Sirius CRM project is currently a **Portuguese-only (pt-BR)** Next.js 16 application. This roadmap defines the full plan to add an English (`/en`) version using **locale-prefixed routing** with `next-intl`, enabling:

- `/` → Portuguese (default, no prefix)
- `/en/` → English version

**Scope:**
- 31+ marketing pages (including programmatic SEO pages)
- 16+ dashboard pages
- 13+ admin panel pages
- 5+ IA (AI) pages
- 42+ API routes
- 80+ UI components with hardcoded Portuguese text
- 44 blog post content files (.ts)
- Blog system with dynamic slugs
- Programmatic SEO data (5 niches × 6 cities = 11 dynamic pages)
- 9 transactional email templates (Resend / React Email)
- SEO (Schema.org, sitemap, robots, OG tags)
- PWA manifest, service worker, llms.txt
- Checkout flow with success page

---

## 2. Architecture Decision: i18n Strategy

### Chosen approach: `next-intl` with App Router

| Criteria | `next-intl` | Manual JSON + Context | `next-translate` |
|---|---|---|---|
| App Router support | ✅ Native | ⚠️ Manual | ❌ Pages only |
| Server Components | ✅ Full | ⚠️ Partial | ❌ No |
| Type-safe keys | ✅ Yes | ❌ No | ❌ No |
| SEO (per-locale metadata) | ✅ Built-in | ⚠️ Manual | ❌ Limited |
| Community / Maintenance | ✅ Active | — | ⚠️ Stale |

### Routing Strategy

```
Current:   app/(marketing)/pricing/page.tsx    → /pricing
After:     app/[locale]/(marketing)/pricing/page.tsx → /pricing (pt-BR) | /en/pricing (en)
```

- **Default locale:** `pt-BR` (no prefix — preserves all existing URLs)
- **English locale:** `en` (prefix `/en`)
- Middleware handles locale detection (Accept-Language header, cookie, URL prefix)

---

## 3. Phase 0 — Foundation & Infrastructure

> **Priority: 🔴 Critical — must be done first**
> **Estimated effort: 2–3 days**

### 3.1 Install Dependencies

```bash
npm install next-intl
```

### 3.2 Create i18n Configuration

```
📁 i18n/
├── config.ts               # Locale list, default locale, timeZone
├── request.ts              # Server-side locale resolver
└── routing.ts              # createNavigation() for Link, redirect, usePathname
```

**`i18n/config.ts`**
```ts
export const locales = ['pt-BR', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt-BR';
```

### 3.3 Create Translation Files

```
📁 messages/
├── pt-BR/
│   ├── common.json          # Shared UI strings (buttons, labels, nav)
│   ├── marketing.json       # Landing page, features, pricing
│   ├── dashboard.json       # Dashboard UI
│   ├── auth.json            # Login, register, forgot-password
│   ├── blog.json            # Blog listing, categories
│   ├── emails.json          # Transactional email templates
│   └── errors.json          # Error messages, 404, 500
└── en/
    ├── common.json
    ├── marketing.json
    ├── dashboard.json
    ├── auth.json
    ├── blog.json
    ├── emails.json
    └── errors.json
```

### 3.4 Update Middleware (`middleware.ts`)

Transform the current middleware to integrate `next-intl`'s `createMiddleware`:

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Compose with existing auth/session logic
export default createMiddleware(routing);
```

- Preserve existing auth guards (`/dashboard`, `/IA`)
- Preserve malformed URL redirects
- Add locale detection from `Accept-Language` header

### 3.5 Restructure App Directory

```
Current:
app/
├── (marketing)/
├── dashboard/
├── auth/
├── layout.tsx

After:
app/
├── [locale]/
│   ├── (marketing)/
│   ├── dashboard/
│   ├── auth/
│   ├── layout.tsx       ← receives { params: { locale } }
│   └── not-found.tsx
├── layout.tsx            ← root layout (minimal, no text)
├── globals.css
└── providers.tsx
```

> ⚠️ **Critical:** All existing Portuguese URLs must continue working without any prefix. The `defaultLocale` must have `prefixDefault: false`.

### 3.6 Create Language Switcher Component

```
📁 components/marketing/language-switcher.tsx
```

- Dropdown or flag toggle (🇧🇷 / 🇺🇸)
- Persists choice in cookie
- Placed in navbar and footer

---

## 4. Phase 1 — Marketing Pages (Public)

> **Priority: 🟠 High**
> **Estimated effort: 5–7 days**

### Pages to translate (31 routes):

| # | Current Route | English Route | File | Size |
|---|---|---|---|---|
| 1 | `/` | `/en` | `(marketing)/page.tsx` | 28KB 🔴 ✅ |
| 2 | `/features` | `/en/features` | `(marketing)/features/page.tsx` | 33KB 🔴 ✅ |
| 3 | `/pricing` | `/en/pricing` | `(marketing)/pricing/page.tsx` | 27KB 🔴 ✅ |
| 4 | `/about` | `/en/about` | `(marketing)/about/page.tsx` | 9KB ✅ |
| 5 | `/contact` | `/en/contact` | `(marketing)/contact/page.tsx` | — |
| 6 | `/blog` | `/en/blog` | `(marketing)/blog/page.tsx` | 13KB ✅ |
| 7 | `/blog/[slug]` | `/en/blog/[slug]` | `(marketing)/blog/[slug]/page.tsx` | 29KB 🔴 |
| 8 | `/blog/categoria/[category]` | `/en/blog/category/[category]` | `(marketing)/blog/categoria/[category]/page.tsx` | — |
| 9 | `/blog/planilha-controle-comissao-corretor` | `/en/blog/broker-commission-spreadsheet` | standalone page | 26KB 🔴 |
| 10 | `/changelog` | `/en/changelog` | `(marketing)/changelog/page.tsx` | — |
| 11 | `/community` | `/en/community` | `(marketing)/community/page.tsx` | — |
| 12 | `/download` | `/en/download` | `(marketing)/download/page.tsx` | — |
| 13 | `/help` | `/en/help` | `(marketing)/help/page.tsx` | 17KB |
| 14 | `/help/[categoria]/[slug]` | `/en/help/[category]/[slug]` | dynamic help articles | — |
| 15 | `/privacy` | `/en/privacy` | `(marketing)/privacy/page.tsx` | 17KB |
| 16 | `/terms` | `/en/terms` | `(marketing)/terms/page.tsx` | 16KB |
| 17 | `/fundadores` | `/en/founders` | `(marketing)/fundadores/page.tsx` | — |
| 18 | `/proposta` | `/en/proposal` | `(marketing)/proposta/page.tsx` | — |
| 19 | `/anuario` | `/en/yearbook` | `(marketing)/anuario/page.tsx` | 24KB 🔴 |
| 20 | `/followup` | `/en/followup` | `(marketing)/followup/page.tsx` | 12KB |
| 21 | `/vendas-automaticas` | `/en/automatic-sales` | `(marketing)/vendas-automaticas/page.tsx` | 35KB 🔴 |
| 22 | `/design-system` | `/en/design-system` | `(marketing)/design-system/page.tsx` | 28KB |
| 23 | `/r/[code]` | `/en/r/[code]` | `(marketing)/r/[code]/page.tsx` | referral |
| 24 | `/ferramentas` | `/en/tools` | `(marketing)/ferramentas/page.tsx` | — |
| 25 | `/ferramentas/calculadora-roi` | `/en/tools/roi-calculator` | `(marketing)/ferramentas/calculadora-roi/page.tsx` | — |
| 26 | `/ferramentas/calculadora-roi-agencias` | `/en/tools/roi-calculator-agencies` | etc. | — |
| 27 | `/ferramentas/calculadora-roi-consultores` | `/en/tools/roi-calculator-consultants` | etc. | — |
| 28 | `/ferramentas/calculadora-roi-corretores` | `/en/tools/roi-calculator-brokers` | etc. | — |
| 29 | `/ferramentas/calculadora-roi-energia-solar` | `/en/tools/roi-calculator-solar` | etc. | — |
| 30 | `/ferramentas/calculadora-roi-representantes` | `/en/tools/roi-calculator-reps` | etc. | — |
| 31 | `/solucoes` | `/en/solutions` | `(marketing)/solucoes/page.tsx` | — |
| 32 | `/solucoes/[slug]` | `/en/solutions/[slug]` | `(marketing)/solucoes/[slug]/page.tsx` | 14KB |
| 33 | `/solucoes/cidade/[slug]` | `/en/solutions/city/[slug]` | `(marketing)/solucoes/cidade/[slug]/page.tsx` | dynamic |

### Marketing Components to translate (11):

| Component | File | Size |
|---|---|---|
| Navbar | `components/marketing/nav-dropdowns.tsx` | 4KB ✅ |
| Mobile Nav | `components/marketing/mobile-nav.tsx` | 6.5KB ✅ |
| Language Switcher | `components/marketing/language-switcher.tsx` | — ✅ |
| Footer | `components/marketing/footer.tsx` | 11KB ✅ |
| Hero | `components/marketing/hero.tsx` | 6KB ✅ |
| Bento Grid | `components/marketing/bento-grid.tsx` | 11KB ✅ |
| Sticky CTA | `components/marketing/sticky-cta.tsx` | 2.5KB |
| Download Instructions | `components/marketing/download-instructions.tsx` | 12KB |
| ROI Calculator | `components/calculadora-roi.tsx` | 22KB 🔴 |
| ROI Calculator (lead) | `components/calculadora-roi-with-lead-capture.tsx` | 14KB |
| Lead Capture Modal | `components/lead-capture-modal.tsx` | 6.7KB |
| Campaign ROI Chart | `components/marketing/campaign-roi-chart.tsx` | 4KB |
| Ad Entry Form | `components/marketing/manual-ad-entry-form.tsx` | 6.8KB |
| Pricing Toggle | `app/(marketing)/pricing/pricing-toggle.tsx` | 1.4KB ✅ |

### Blog Components to translate (11):

| Component | File | Size |
|---|---|---|
| Blog Content Wrapper | `components/blog/blog-content-wrapper.tsx` | 8.2KB |
| CRM Finder | `components/blog/crm-finder.tsx` | 4.9KB |
| CRM IA Quiz | `components/blog/crm-ia-quiz.tsx` | 5.1KB |
| Funnel Calculator | `components/blog/funnel-calculator.tsx` | 8KB |
| Funnel Template Download | `components/blog/funnel-template-download.tsx` | 14KB |
| Newsletter CTA | `components/blog/newsletter-cta.tsx` | 2.5KB |
| Related Links Bar | `components/blog/related-links-bar.tsx` | 1.8KB |
| ROI Automação Calc | `components/blog/roi-automacao-calc.tsx` | 3.2KB |
| Share Buttons | `components/blog/share-buttons.tsx` | 2.8KB |
| Table of Contents | `components/blog/table-of-contents.tsx` | 4KB |
| Blog Layout | `app/(marketing)/blog/layout.tsx` | 2.4KB |

### Implementation Pattern

```tsx
// Before (hardcoded PT-BR):
<h1>Funcionalidades</h1>

// After (i18n):
import { useTranslations } from 'next-intl';

export default function FeaturesPage() {
  const t = useTranslations('marketing.features');
  return <h1>{t('title')}</h1>;
}
```

> **Approach for route slugs in Portuguese (e.g., `/ferramentas`):**
> Use `next-intl`'s `pathnames` config to map locale-specific path segments:
> ```ts
> pathnames: {
>   '/ferramentas': { 'pt-BR': '/ferramentas', en: '/tools' },
>   '/fundadores':  { 'pt-BR': '/fundadores',  en: '/founders' },
>   '/solucoes':    { 'pt-BR': '/solucoes',     en: '/solutions' },
> }
> ```

### ⚠️ Programmatic SEO Data Files (CRITICAL)

These files contain **all text content** for dynamically-generated SEO pages and must be fully translated:

| File | Size | Content | Priority |
|---|---|---|---|
| `config/niche-data.ts` | 19KB | 5 niche landing pages (corretores, solar, agências, consultores, representantes) — titles, pain points, benefits, testimonials, FAQs, SEO meta | 🔴 Critical |
| `config/city-data.ts` | 27KB | 6 city landing pages (SP, Curitiba, BH, Porto Alegre, RJ, Brasília) — same structure, localized to each city | 🔴 Critical |
| `config/calculator-metadata.ts` | 1KB | ROI calculator metadata | 🟡 Light |

> **Strategy:** Create `config/niche-data-en.ts` and `config/city-data-en.ts` with translated content, or refactor into locale-keyed objects. The city/niche pages are programmatic SEO pages — they likely won't need English versions of Brazilian city pages, but the niche pages (real estate brokers, solar, agencies, etc.) have universal appeal.

### Error & Utility Pages:

| File | Content | Size |
|---|---|---|
| `app/not-found.tsx` | "Página não encontrada", buttons, links | 2.1KB |
| `app/error.tsx` | "Algo deu errado", retry button | 1.5KB |
| `app/global-error.tsx` | "Erro crítico", reload button | 1.4KB |
| `app/dashboard/error.tsx` | Dashboard error page | 1.6KB |
| `app/(ia)/IA/error.tsx` | IA error page | 1KB |
| `app/dashboard/loading.tsx` | Loading skeleton labels | 2.7KB |

---

## 5. Phase 2 — Auth & Onboarding

> **Priority: 🟡 Medium**
> **Estimated effort: 2–3 days**

### Pages:

| Route | English Route |
|---|---|
| `/login` | `/en/login` |
| `/register` | `/en/register` |
| `/forgot-password` | `/en/forgot-password` |
| `/reset-password` | `/en/reset-password` |

### Files:

- `app/(marketing)/login/page.tsx`
- `app/(marketing)/register/page.tsx`
- `app/(marketing)/forgot-password/page.tsx`
- `app/(marketing)/reset-password/page.tsx`
- `app/auth/actions.ts` — error messages must be locale-aware
- `lib/error-messages.ts` — translate all user-facing error strings
- `components/onboarding/*` — onboarding flow text

### Key considerations:

- Error messages from `actions.ts` (e.g., "Email já cadastrado") must return localized strings
- Password validation messages need translation
- Onboarding wizard steps need full English copy

---

## 6. Phase 3 — Dashboard (Authenticated)

> **Priority: 🟡 Medium**
> **Estimated effort: 7–10 days**

### Dashboard pages (16+ routes):

| Route | Description |
|---|---|
| `/dashboard` | Main dashboard |
| `/dashboard/pipeline` | Kanban board |
| `/dashboard/pipelines` | Pipeline management |
| `/dashboard/contacts` | Contact list |
| `/dashboard/deals` | Deals management |
| `/dashboard/analytics` | Analytics overview |
| `/dashboard/analytics-pro` | Advanced analytics |
| `/dashboard/chat` | WhatsApp chat center |
| `/dashboard/products` | Product catalog |
| `/dashboard/billing` | Billing & subscription |
| `/dashboard/settings` | User settings |
| `/dashboard/agenda` | Calendar/agenda |
| `/dashboard/automations` | Automation rules |
| `/dashboard/email-automations` | Email automation |
| `/dashboard/marketing` | Marketing tools |
| `/dashboard/prospecting` | Lead prospecting |
| `/dashboard/visits` | Visit tracking |

### IA Pages (AI Hub — protected):

| Route | Description |
|---|---|
| `/IA` | Main IA page |
| `/IA/agents` | AI agent management |
| `/IA/analytics` | AI analytics |
| `/IA/command` | AI command interface |
| `/IA/pipeline` | AI pipeline view |
| `/IA/settings` | AI settings |

### Admin Panel Pages:

| Route | Description |
|---|---|
| `/admin` | Admin dashboard |
| `/admin/ab-testing` | A/B testing |
| `/admin/analytics` | Platform analytics |
| `/admin/auto-citation` | Auto citation |
| `/admin/funnel` | Funnel management |
| `/admin/generative-ui` | Generative UI |
| `/admin/graph-rag` | Graph RAG |
| `/admin/graph-viz` | Graph visualization |
| `/admin/knowledge-graph` | Knowledge graph |
| `/admin/organizations` | Organization management |
| `/admin/pwa-metrics` | PWA metrics |
| `/admin/seo` | SEO management |
| `/admin/spin-chat` | SPIN chat |
| `/admin/users` | User management |
| `/admin/cache-stats` | Cache statistics |

### Checkout Flow:

| Route | Description |
|---|---|
| `/checkout/sucesso` | Payment success page (6.6KB) |

### Key components to translate (detailed inventory):

**Dashboard Core (7 components):**
- `components/dashboard/sidebar.tsx` — 13KB 🔴 (all nav labels, sections)
- `components/dashboard/mobile-nav.tsx` — 6.8KB
- `components/dashboard/dashboard-tabs.tsx` — 6.7KB
- `components/dashboard/dashboard-tabs-wrapper.tsx` — 2.7KB
- `components/dashboard/user-nav.tsx` — 2.3KB
- `components/dashboard/billing/*` — billing UI
- `components/dashboard/animated-page-container.tsx` — 0.4KB

**Contacts (5 components):**
- `components/contacts/columns.tsx` — 8.3KB
- `components/contacts/create-contact-dialog.tsx` — 6.2KB
- `components/contacts/edit-contact-dialog.tsx` — 6.3KB
- `components/contacts/import-contacts-dialog.tsx` — 11.3KB
- `components/contacts/data-table.tsx` — 7.7KB

**Deals (2 components — very large!):**
- `components/deals/create-deal-dialog.tsx` — 17KB 🔴
- `components/deals/edit-deal-dialog.tsx` — **47KB 🔴🔴** (largest component!)

**Chat / WhatsApp (20 components!):**
- `components/chat/message-area.tsx` — **47KB 🔴🔴**
- `components/chat/conversation-list.tsx` — 19KB 🔴
- `components/chat/contact-sidebar.tsx` — 13KB
- `components/chat/resizable-drawer.tsx` — 11KB
- `components/chat/chat-interface.tsx` — 10.7KB
- `components/chat/chat-drawer.tsx` — 9.5KB
- `components/chat/message-bubble.tsx` — 9KB
- `components/chat/conversation-tags.tsx` — 8.5KB
- `components/chat/connection-manager.tsx` — 8.2KB
- `components/chat/quick-reply-picker.tsx` — 7.5KB
- `components/chat/qr-code-dialog.tsx` — 5.2KB
- `components/chat/agent-assignment.tsx` — 4.6KB
- `components/chat/message-search.tsx` — 4.4KB
- `components/chat/reaction-bar.tsx` — 4.4KB
- `components/chat/conversation-filters.tsx` — 3.9KB
- `components/chat/new-connection-dialog.tsx` — 3.4KB
- `components/chat/typing-indicator.tsx` — 1.5KB
- `components/chat/reaction-chips.tsx` — 1.4KB
- `components/chat/quoted-message.tsx` — 0.8KB
- `components/chat/unread-badge.tsx` — 0.4KB

**Analytics (19 components):**
- `components/analytics/*` — chart labels, tooltips, period selectors

**IA / AGI (13 components):**
- `components/ia/ia-settings.tsx` — 13.5KB
- `components/ia/ia-agents.tsx` — 10.4KB
- `components/ia/ia-pipeline.tsx` — 7.7KB
- `components/ia/ia-feed.tsx` — 7.7KB
- `components/ia/ia-command.tsx` — 6.9KB
- `components/ia/agent-action-card.tsx` — 7KB
- `components/ia/ia-analytics.tsx` — 5.5KB
- `components/ia/ia-navbar.tsx` — 4.2KB
- `components/agi/DealInsightsPanel.tsx` — 16.8KB
- `components/agi/ScriptGenerator.tsx` — 15.8KB
- `components/agi/AgiChatSidebar.tsx` — 14.4KB
- `components/agi/AgiPreview.tsx` — 10KB

**Generative UI (17 components):**
- `components/generative-ui/DemoScheduler.tsx` — 12.6KB
- `components/generative-ui/DealFormGenerator.tsx` — 13.2KB
- `components/generative-ui/EmailPreview.tsx` — 11.5KB
- `components/generative-ui/ROICalculator.tsx` — 11KB
- `components/generative-ui/ComponentSkeleton.tsx` — 14.5KB
- `components/generative-ui/CompetitorMatrix.tsx` — 8.4KB
- `components/generative-ui/OnboardingTimeline.tsx` — 8.4KB
- `components/generative-ui/ScriptPreview.tsx` — 7.9KB
- `components/generative-ui/QualificationDashboard.tsx` — 8KB
- `components/generative-ui/PricingComparison.tsx` — 7.9KB
- `components/generative-ui/GenUIErrorBoundary.tsx` — 7.4KB
- `components/generative-ui/AnimatedComponent.tsx` — 7.2KB
- `components/generative-ui/MessageRenderer.tsx` — 6.3KB
- `components/generative-ui/DynamicUIComponent.tsx` — 6.4KB
- `components/generative-ui/InsightCard.tsx` — 5.3KB
- `components/generative-ui/ThinkingIndicator.tsx` — 2.6KB

**Admin (23 components!):**
- `components/admin/*` — SEO dashboard, period comparator, anomaly alerts, etc.
- Largest: `components/admin/period-comparator.tsx` — 20KB
- Largest: `components/admin/seo-content-calendar.tsx` — 19.7KB
- Largest: `components/admin/seo-ranking-predictions.tsx` — 17.4KB

**Onboarding (5 components):**
- `components/onboarding/welcome-modal.tsx` — 11.2KB
- `components/onboarding/import-contacts-modal.tsx` — 12.6KB
- `components/onboarding/product-tour.tsx` — 8.8KB
- `components/onboarding/onboarding-wrapper.tsx` — 1.2KB

**Settings (5 components):**
- `components/settings/settings-layout.tsx` — 8.5KB
- `components/settings/profile-form.tsx` — 4KB
- `components/settings/quick-actions.tsx` — 2.8KB
- `components/settings/settings-skeleton.tsx` — 2.7KB
- `components/settings/view-mode-toggle.tsx` — 1.6KB

**Integrations (4 components):**
- `components/integrations/whatsapp-settings-form.tsx` — 12.3KB
- `components/integrations/whatsapp-official-settings-form.tsx` — 11.9KB
- `components/integrations/n8n-settings-form.tsx` — 11KB
- `components/integrations/google-calendar-connect-button.tsx` — 3.2KB

**Products (2 components):**
- `components/products/products-client.tsx` — 8.5KB
- `components/products/product-dialog.tsx` — 7.3KB

**Email Automations (4 components):**
- `components/email-automations/template-editor.tsx` — 9.7KB
- `components/email-automations/email-history-table.tsx` — 5.2KB
- `components/email-automations/automation-card.tsx` — 4.2KB
- `components/email-automations/variable-helper.tsx` — 3.4KB

**Upgrade / Plan (5 components):**
- `components/plan/usage-limits-banner.tsx` — 9.9KB
- `components/upgrade/quota-display.tsx` — 7.1KB
- `components/upgrade/upgrade-prompt.tsx` — 3.7KB
- `components/upgrade/limit-badge.tsx` — 3KB
- `components/upgrade/feature-gate.tsx` — 0.9KB

**Other:**
- `components/kanban-board.tsx` — 25KB 🔴
- `components/notification-center.tsx` — 7.4KB
- `components/dashboard-with-pipeline-selector.tsx` — 6.4KB
- `components/pipelines/pipeline-selector.tsx` — 4.5KB
- `components/offline-status.tsx` — 4.6KB
- `components/pwa-install-prompt.tsx` — 4KB
- `components/mobile/checkin-button.tsx` — 1.6KB
- `components/mobile/scan-card-button.tsx` — 1.8KB

### Strategy:

- Use `useTranslations()` in client components
- Use `getTranslations()` in server components
- Dashboard locale can be stored as user preference in the database (`User.preferredLocale`)
- Persist via cookie so middleware can read it

---

## 7. Phase 4 — Blog & Content

> **Priority: 🟡 Medium**
> **Estimated effort: 5–8 days** *(revised up — 44 blog posts discovered)*

### Blog architecture:

The blog uses **44 TypeScript content files** in `lib/blog/posts/` (each 10–43KB) with dynamic `[slug]` routes. Also has a standalone hardcoded blog page for "planilha-controle-comissao-corretor".

### Content files to translate (44 posts 🔴):

| File | Size | Topic |
|---|---|---|
| `spin-selling-guia-completo.ts` | 43KB | SPIN selling guide |
| `automacao-vendas-agentes-ia.ts` | 39KB | AI sales automation |
| `funil-de-vendas-guia-completo.ts` | 39KB | Sales funnel guide |
| `roi-agentes-ia-vendas-b2b.ts` | 36KB | ROI of AI agents |
| `whatsapp-vendas-b2b-estrategias.ts` | 35KB | WhatsApp B2B strategies |
| `como-organizar-pipeline-vendas.ts` | 34KB | Pipeline organization |
| ... **+ 38 more posts** | 10–33KB each | Various CRM/sales topics |

> **Total blog content: ~950KB of Portuguese text to translate**

### Also requires `blog/` root dir:
- `blog/spin-selling-guia-completo.md` — 64KB standalone markdown content

### Tasks:

1. **Blog listing page** (`/blog` → `/en/blog`)
   - Category names, filters, UI labels
   
2. **Blog post pages** (`/blog/[slug]` → `/en/blog/[slug]`)
   - Strategy decision needed:
     - **Option A:** Translate slugs (e.g., `/en/blog/spin-selling-complete-guide`)
     - **Option B:** Keep same slugs, translate content only
     - **Recommended:** Option A for SEO value
   - **Implementation:** Create `lib/blog/posts-en/` directory with translated content files

3. **Blog layout** — breadcrumbs, reading time, share buttons

4. **Blog categories** (`/blog/categoria/[slug]` → `/en/blog/category/[slug]`)

5. **Blog data layer** (`lib/blog/index.ts`, `lib/blog-data.ts`, `lib/blog-types.ts`)
   - Add `locale` field to blog post type
   - Filter posts by locale in queries
   - Update `lib/blog/index.ts` (4.8KB) to support locale-based post loading

6. **NLP/SEO content** (`lib/faq-schema.ts` 35KB, `lib/howto-schemas.ts` 13KB)
   - Translate FAQ structured data
   - Translate HowTo schema content

7. **Standalone SPIN Selling article** (`SPIN-SELLING-ARTIGO-COMPLETO.md` — 71KB!)
   - If publicly accessible, needs English version

---

## 8. Phase 5 — API & Backend

> **Priority: 🟢 Lower (internal-facing)**
> **Estimated effort: 3–4 days**

### Scope:

Most API routes return data, not user-facing text. Focus on:

| Area | Files | Action |
|---|---|---|
| Error messages | `lib/error-messages.ts` | Translate all strings |
| Validation errors | `lib/api-validators.ts` | Locale-aware messages |
| API responses with text | `app/api/leads/`, `app/api/contacts/` | Add `locale` query param |
| Help articles | `lib/help-articles.ts` (62KB!) | Create English version |
| Webhook payloads | `lib/webhooks.ts` | Keep as-is (machine-readable) |
| PDF generation | `lib/pdf-generator.ts` | Add locale parameter |

### Database considerations:

- Add `locale` column to content-related tables if needed
- Consider `User.preferredLocale` field in Prisma schema:

```prisma
model User {
  // ... existing fields
  preferredLocale String @default("pt-BR")
}
```

---

## 9. Phase 6 — Emails & Notifications

> **Priority: 🟡 Medium**
> **Estimated effort: 2–3 days**

### Email Templates (9 templates + 1 layout):

| Template | File | Size |
|---|---|---|
| Welcome | `emails/templates/welcome.tsx` | 3.3KB |
| Invite | `emails/templates/invite.tsx` | 2.3KB |
| Deal Created | `emails/templates/deal-created.tsx` | 3.5KB |
| Deal Stage Changed | `emails/templates/deal-stage-changed.tsx` | 4.7KB |
| Follow-up | `emails/templates/follow-up.tsx` | 4.5KB |
| Payment Confirmation | `emails/templates/payment-confirmation.tsx` | 6.1KB |
| Payment Failure | `emails/templates/payment-failure.tsx` | 4.8KB |
| Upgrade Nudge | `emails/templates/upgrade-nudge.tsx` | 5.2KB |
| Weekly Newsletter | `emails/templates/weekly-newsletter.tsx` | 5.4KB |
| Base Layout | `emails/layouts/base.tsx` | 2.4KB |

### Notification Libraries:

- `lib/email.ts` — email sender utility (1.7KB)
- `lib/notifications.ts` — in-app notifications (7.2KB)
- `lib/push-notifications.ts` — push notification text (9.9KB)
- `lib/email-marketing.ts` — marketing campaigns (7.8KB)
- `lib/email-automations.ts` — automation triggers (10.2KB)

### Tasks:

1. Create English versions of all 9 email templates
2. Pass `locale` parameter to email sending functions
3. Translate push notification copy (titles, bodies)
4. Translate in-app notification messages
5. Update `lib/email-marketing.ts` for locale-aware campaigns
6. Update `lib/email-automations.ts` — automation trigger messages

---

## 10. Phase 7 — SEO & Metadata

> **Priority: 🔴 Critical for international SEO**
> **Estimated effort: 3–4 days**

### 10.1 Root Layout (`app/layout.tsx`)

- Dynamic `<html lang={locale}>` based on route
- Locale-specific `<meta>` descriptions
- Schema.org `inLanguage` per locale
- `alternates.languages` with `hreflang` tags:

```tsx
alternates: {
  languages: {
    'pt-BR': 'https://sirius.roilabs.com.br',
    'en': 'https://sirius.roilabs.com.br/en',
    'x-default': 'https://sirius.roilabs.com.br',
  },
}
```

### 10.2 Sitemap (`app/sitemap.ts`) ✅

- Generate entries for both locales
- Add `alternateRefs` for each URL pair:

```ts
{
  url: 'https://sirius.roilabs.com.br/pricing',
  alternates: {
    languages: {
      'pt-BR': 'https://sirius.roilabs.com.br/pricing',
      'en': 'https://sirius.roilabs.com.br/en/pricing',
    }
  }
}
```

### 10.3 Robots.txt (`app/robots.ts`)

- Ensure `/en` paths are crawlable
- Add English sitemap reference

### 10.4 OpenGraph & Twitter Cards

- Per-locale OG titles, descriptions, images
- Locale-specific OG `locale` property (`en_US` vs `pt_BR`)

### 10.5 Schema.org / JSON-LD

- Duplicate `WebSite` schema with `inLanguage: "en"`
- Translate `SoftwareApplication` descriptions
- Add `availableLanguage: ["Portuguese", "English"]` to ContactPoint

### 10.6 PWA Manifest & Service Workers

- Create locale-specific `manifest.json` (`public/manifest.json` — 3.4KB) or dynamic manifest route
- Translate PWA app name and description
- `public/sw.js` (3.9KB) and `public/sw-push.js` (3.4KB) — check for any hardcoded user-facing text
- `public/llms.txt` (6.6KB) — create English version for AI crawlers

### 10.7 `next.config.ts` Redirects

- Add English equivalents for SEO redirects
- Map Portuguese-slug redirects to English equivalents:

```ts
// English feature page redirects
{ source: '/en/features/sales-playbook', destination: '/en/features', permanent: true },
```

### 10.8 OpenAPI Documentation

- `public/openapi.json` (46KB) — evaluate if API docs need English version
- `app/api/docs/*` — API documentation pages

---

## 11. Phase 8 — QA, Testing & Launch

> **Priority: 🔴 Critical**
> **Estimated effort: 3–5 days**

### 11.1 Automated Testing

- [ ] Unit tests for translation key completeness (no missing keys)
- [ ] E2E tests (Playwright) for `/en` routes — verify all pages load
- [ ] Middleware tests — locale detection, redirects, auth guards
- [ ] SEO tests — validate `hreflang`, sitemap, OG tags per locale

### 11.2 Manual QA Checklist

- [ ] Every `/en` page renders with English text (no Portuguese leaks)
- [ ] Language switcher works on all pages
- [ ] Auth flow works in English (login → dashboard)
- [ ] Dashboard fully translated
- [ ] Blog posts display in correct language
- [ ] Emails sent in correct language based on user preference
- [ ] 404 and error pages show in correct locale
- [ ] Mobile responsive layout intact for English text (longer words)
- [ ] PWA install prompt in English

### 11.3 Performance Validation

- [ ] Translation JSON bundles don't impact Core Web Vitals
- [ ] No layout shift from language switching
- [ ] Lighthouse scores maintained for both locales

### 11.4 Launch Strategy

1. **Soft launch:** Deploy `/en` routes with `noindex` initially
2. **Content review:** Native English speaker reviews all copy
3. **SEO indexing:** Remove `noindex`, submit to Google Search Console
4. **Monitoring:** Track 404s, bounce rate, and user language preferences

---

## 12. File Inventory & Scope Matrix

### By impact level:

| Impact | Count | Examples |
|---|---|---|
| 🔴 Heavy rewrite | ~15 | Homepage (28KB), Features (33KB), Pricing (27KB), Kanban (25KB), chat message-area (47KB), edit-deal-dialog (47KB) |
| 🟠 Moderate change | ~40 | Dashboard pages, auth pages, all form components |
| 🟡 Light touch | ~30 | API error messages, metadata, config |
| 🟢 No change | ~40+ | API logic, Prisma schema (mostly), utility functions |
| 📝 Content files | 44 | Blog post .ts files (~950KB total Portuguese content) |

### Key files by size (translation effort proxy):

| File | Size | Priority |
|---|---|---|
| `components/deals/edit-deal-dialog.tsx` | **47KB** | 🔴🔴 |
| `components/chat/message-area.tsx` | **47KB** | 🔴🔴 |
| `app/(marketing)/vendas-automaticas/page.tsx` | 35KB | 🔴 |
| `app/(marketing)/features/page.tsx` | 33KB | 🔴 |
| `app/(marketing)/blog/[slug]/page.tsx` | 29KB | 🔴 |
| `app/(marketing)/page.tsx` | 28KB | 🔴 |
| `app/(marketing)/design-system/page.tsx` | 28KB | 🔴 |
| `config/city-data.ts` | 27KB | 🔴 |
| `app/(marketing)/pricing/page.tsx` | 27KB | 🔴 |
| `blog/planilha-controle-comissao-corretor/page.tsx` | 26KB | 🔴 |
| `components/kanban-board.tsx` | 25KB | 🔴 |
| `app/(marketing)/anuario/page.tsx` | 24KB | 🔴 |
| `components/calculadora-roi.tsx` | 22KB | 🟠 |
| `config/niche-data.ts` | 19KB | 🔴 |
| `components/chat/conversation-list.tsx` | 19KB | 🟠 |
| `lib/help-articles.ts` | 62KB | 🔴🔴 |
| `lib/faq-schema.ts` | 35KB | 🟠 |
| `lib/howto-schemas.ts` | 13KB | 🟠 |
| `app/globals.css` | 19KB | 🟢 No change |
| `lib/whatsapp-sync.ts` | 15KB | 🟢 No change |

---

## 13. Risk Registry

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| 1 | **Broken existing URLs** | 🔴 Critical | `prefixDefault: false` — Portuguese URLs stay unchanged |
| 2 | **SEO ranking drop** | 🔴 Critical | Proper `hreflang` tags, 301 redirects, gradual indexing |
| 3 | **Missing translation keys** | 🟠 High | TypeScript strict checking, automated key-completeness tests |
| 4 | **Layout breaks with English text** | 🟡 Medium | English words are longer — test all responsive breakpoints |
| 5 | **Performance regression** | 🟡 Medium | Lazy-load translation bundles, tree-shake unused locales |
| 6 | **Blog content gaps** | 🟡 Medium | Start with high-traffic posts, add "available in Portuguese" fallback |
| 7 | **Email template duplication** | 🟢 Low | Use templating with locale variable, not separate files |
| 8 | **Third-party widgets** | 🟢 Low | MercadoPago, Pusher — check if they support `locale` param |
| 9 | **Blog content volume** | 🟠 High | 44 posts × ~20KB avg = ~950KB of content. Consider phased approach: high-traffic posts first |
| 10 | **Programmatic SEO pages** | 🟡 Medium | City-based pages are Brazil-specific. May not need English. Niche pages are universal |
| 11 | **Dashboard component count** | 🟠 High | 80+ components discovered — significantly more than initially estimated |

---

## 14. Timeline Estimate

```
Phase 0  Foundation & Infrastructure       ██████          2-3 days
Phase 1  Marketing Pages (31 routes)       ██████████████  7-10 days
Phase 2  Auth & Onboarding                 ██████          2-3 days
Phase 3  Dashboard + Admin + IA (80+ comps)████████████████████ 12-16 days
Phase 4  Blog & Content (44 posts)         ██████████████  6-10 days
Phase 5  API & Backend                     ████████        3-4 days
Phase 6  Emails (9 templates) & Notifs     ██████          2-3 days
Phase 7  SEO & Metadata                    ████████        3-4 days
Phase 8  QA, Testing & Launch              ██████████      4-6 days
                                           ─────────────────────────
                                           Total: 41-59 days  (revised)
```

### Recommended execution order:

```
Phase 0 ──→ Phase 7 (SEO) ──→ Phase 1 (Marketing) ──→ Phase 2 (Auth)
                                       ↓
                                Phase 4 (Blog) ──→ Phase 3 (Dashboard)
                                       ↓
                              Phase 5 (API) + Phase 6 (Emails)
                                       ↓
                                  Phase 8 (QA & Launch)
```

> **MVP (minimum viable English version):** Phases 0 + 1 + 2 + 7 = **14–20 days**
> This gives you a fully functional English marketing site with auth, proper SEO, and language switching.
>
> **Full English version (all phases):** **41–59 days** (revised from 30–44 after discovering 80+ components, 44 blog posts, admin/IA sections, and programmatic SEO data files).

---

## Quick-Start Checklist

```
[ ] npm install next-intl
[ ] Create i18n/config.ts, i18n/request.ts, i18n/routing.ts
[ ] Create messages/pt-BR/common.json (extract existing strings)
[ ] Create messages/en/common.json (translate)
[ ] Update middleware.ts with createMiddleware
[ ] Move app/(marketing) → app/[locale]/(marketing)
[ ] Update root layout.tsx for dynamic locale
[ ] Build language-switcher component
[ ] Test: / still works (Portuguese), /en works (English)
[ ] Add hreflang to sitemap.ts
[ ] Deploy and validate
```

---

---

## Appendix: Audit Findings (v1.1)

### Items added after full project audit:

1. **7 missing marketing pages:** `/anuario` (24KB), `/followup` (12KB), `/vendas-automaticas` (35KB 🔴), `/design-system` (28KB), `/r/[code]` (referral), `/blog/categoria/[category]`, `/blog/planilha-controle-comissao-corretor` (26KB)
2. **Blog categories route:** `/blog/categoria/[category]` — was not in original inventory
3. **City-based SEO pages:** `/solucoes/cidade/[slug]` — 6 city pages generated from `config/city-data.ts` (27KB)
4. **Help article sub-routes:** `/help/[categoria]/[slug]` — nested dynamic routes
5. **Entire Admin panel:** 13+ pages under `app/(admin)/admin/` — not originally covered
6. **Entire IA (AI) section:** 5+ pages under `app/(ia)/IA/` — not originally covered
7. **Checkout success page:** `app/checkout/sucesso/page.tsx` (6.6KB)
8. **44 blog content .ts files** in `lib/blog/posts/` — ~950KB total content. Was described generically, now enumerated.
9. **11 blog components** in `components/blog/` — not originally listed
10. **20 chat components** — originally listed generically as "components/chat/*", now fully inventoried (largest: message-area.tsx at 47KB!)
11. **2 massive deal dialogs** — `edit-deal-dialog.tsx` at 47KB was the **largest file** in the project, not previously flagged
12. **23 admin analytics components** — `components/admin/*` was missing entirely
13. **13 IA/AGI components** — `components/ia/*` + `components/agi/*` missing
14. **17 generative-ui components** — `components/generative-ui/*` missing
15. **4 integration setting components** — WhatsApp, N8N, Google Calendar
16. **4 email automation components** — template editor, history table, etc.
17. **5 upgrade/plan components** — quota display, upgrade prompts, feature gates
18. **2 product components** — products-client, product-dialog
19. **Error/not-found/global-error pages** — all contain hardcoded Portuguese text
20. **`public/llms.txt`** (6.6KB) — AI-focused content description, needs English version
21. **`public/manifest.json`** (3.4KB) — PWA manifest with Portuguese name/description
22. **`public/openapi.json`** (46KB) — API documentation
23. **Programmatic SEO data:** `config/niche-data.ts` (19KB, 5 niches) + `config/city-data.ts` (27KB, 6 cities)

---

*Last updated: March 30, 2026*
*Author: Antigravity AI*
*Version: 1.1 — Post-audit revision*
