# Tasks: Remover o locale EN e as rotas `/en`

**Input**: [spec.md](./spec.md) · [plan.md](./plan.md)
**Branch**: `004-remove-en-locale`

**Ordem não é arbitrária** (plano D4): os redirects entram antes do locale sair. Se parar no meio,
o pior estado é `/en/*` redirecionando com o EN ainda vivo — nunca `/en/*` em 404 aberto.

---

## Fase 1 — Rede de segurança: os 301 (US1, P1)

**Goal**: toda URL `/en` já indexada tem para onde ir, antes de qualquer coisa ser removida.

- [X] **T001** [US1] `next.config.ts`: adicionar as 8 regras de slug traduzido **antes** do
      fallback, e o fallback `/en/:path*` → `/:path*` por último. Todas `permanent: true`.
      Ordem em [plan.md D2](./plan.md#d2--tabela-de-301-mais-específico-primeiro).
- [X] **T002** [US1] `next.config.ts`: `/en/automated-sales` deixa de apontar para
      `/en/automatic-sales` e passa a apontar direto para `/vendas-automaticas` (desencadeia o
      duplo salto).

**Checkpoint**: `npm run build` passa. O site ainda serve EN normalmente, mas `/en/*` já redireciona.

---

## Fase 2 — Parar de anunciar o EN (US2, P1)

**Goal**: nenhum sinal de EN sai para buscador ou usuário. Esta fase é o que faz o `/en` sumir do
índice; a Fase 3 é só faxina.

- [X] **T003** [P] [US2] `lib/seo/canonical.ts`: `buildLocaleAlternates` devolve só `{ canonical }`
      com a URL PT. Assinatura mantida (`locale`, `ptPath`, `enPath?` viram parâmetros sem uso) —
      conserta as 25 páginas que a chamam sem abrir nenhuma. Comentário no arquivo explicando.
- [X] **T004** [P] [US2] `app/[locale]/layout.tsx`: remover `en: enUrl` dos **dois** blocos de
      `alternates.languages` (o PT e o EN). É o `hreflang` que sai em toda página do site.
- [X] **T005** [P] [US2] `app/[locale]/(marketing)/blog/[slug]/page.tsx`: remover a entrada `'en'`
      de `alternates.languages`.
- [X] **T006** [P] [US2] `app/[locale]/(marketing)/blog/categoria/[category]/page.tsx`: idem, e o
      `canonical` deixa de depender do locale.
- [X] **T007** [P] [US2] `app/[locale]/(marketing)/help/[categoria]/[slug]/page.tsx`: idem.
- [X] **T008** [P] [US2] `app/[locale]/(marketing)/solucoes/[slug]/page.tsx`: idem.
- [X] **T009** [US2] `app/sitemap.ts`: apagar o helper `withAlternates`, a coluna `en` de
      `STATIC_ROUTES`, o `calculatorMap` (vira lista de caminhos PT) e o objeto `alternates` das
      páginas de cidade. Nenhuma entrada do sitemap tem `alternates`.
- [X] **T010** [US2] `app/[locale]/(marketing)/layout.tsx`: remover `<LanguageSwitcher />` e seu
      import.

**Checkpoint**: `npm run build` passa; o sitemap gerado não contém a string `/en`; nenhum
`hreflang="en"` no HTML.

---

## Fase 3 — Tirar o locale do código (US3, P2)

**Goal**: `pt-BR` é o único locale. Inclui o que **não compila** sem esta mudança.

- [X] **T011** [US3] `i18n/config.ts`: `locales = ['pt-BR'] as const`.
- [X] **T012** [US3] `i18n/routing.ts`: `locales: ['pt-BR']`; toda entrada de `pathnames` com
      chave `en` vira string simples; comentário de `localePrefix` atualizado. `localeDetection:
      false` **permanece**.
- [X] **T013** [US3] `middleware.ts`: remover o strip de `/en` (`pathnameWithoutLocale` passa a ser
      `pathname`) e o ramo `isEnglish`/`/en/login`.
- [X] **T014** [US3] `lib/i18n-server.ts`: remover os dois `return 'en'` de `resolveRequestLocale`
      (prefixo de URL e `Accept-Language`) — **erro de tipo, quebra o build**. E validar o valor do
      banco em `resolveUserLocale` contra `locales` antes do cast (FR-008).
- [X] **T015** [US3] `lib/i18n-server.test.ts`: inverter os 5 testes que afirmam `'en'` — passam a
      afirmar `pt-BR`, incluindo o caso de `User.locale = 'en'` vindo do banco (prova o FR-008).
- [X] **T016** [US3] `git rm -r messages/en` e `git rm components/marketing/language-switcher.tsx`.

**Checkpoint**: `npm run build` passa, `npx vitest run lib/i18n-server.test.ts` verde.

---

## Fase 4 — Verificação (obrigatória antes de declarar pronto)

- [X] **T017** `npm run build` limpo.
- [X] **T018** Suíte de testes no mesmo estado de antes — comparar com a baseline tirada **antes**
      de T001, não com "tudo verde" presumido.
- [X] **T019** [SC-002] Servidor de produção local: `curl -I` nas 9 URLs de amostra (uma por regra)
      e conferir `301` + `Location` correto.
- [X] **T020** [SC-003] Baixar `/sitemap.xml` do servidor local e contar ocorrências de `/en` → 0.
- [X] **T021** [SC-006] Baixar o HTML da home e de um post de blog e contar `hreflang="en"` → 0.
- [X] **T022** Varrer links internos hard-coded para `/en/` fora de `lib/blog` e reportar (não
      necessariamente consertar — viram 301, não 404).

**Resultado** (servidor de produção local, 22/09):

- T017 build: **exit 0**. Zero rotas `/en` geradas.
- T018 suite: **350 passam, 0 falham, 1 pulado**. Baseline antes de T001 era 350 passam /
  **1 falha** (`deal-isolation.test.ts`, timeout de 5 s) — aquela falha era intermitente e
  passou nesta corrida. Nenhum teste novo quebrado.
- T019: **11 de 11** URLs `/en` com 308 + `Location` no caminho PT correto. Destino final
  responde 200 em todas. `/en/dashboard` sem sessão cai em `/login?callbackUrl=%2Fdashboard`
  — nunca `/en/login`.
- T020: sitemap com **0** ocorrências de `/en/` e **0** de `hreflang`.
- T021: **0** `hreflang="en"` em `/`, `/pricing`, `/blog`, um post e uma solução.

---

## Achados durante a implementação (não previstos no plano)

- [X] **T023** **14 templates de e-mail importavam `@/messages/en/emails.json` estaticamente**
      (10 em `emails/templates/`, 4 em `lib/email-templates/support/`). O grep do levantamento
      não os pegou porque o identificador é `emailsEn`, não `/en`. Apagar `messages/en` sem
      isso **quebra o build**. Import removido, `type Locale` local estreitado para `'pt-BR'`
      e 36 ternários `locale === 'en' ? EN : PT` colapsados no lado PT.
- [X] **T024** **3 chamadores montavam assunto de e-mail bilíngue** (`app/api/cron/follow-up-emails`,
      `app/api/cron/weekly-newsletter`, `app/[locale]/dashboard/settings/team/actions.ts`):
      castavam `user.locale as 'pt-BR' | 'en'` e escolhiam o assunto. Colapsados no PT.
- [X] **T025** **`lib/email-automations.ts`**: 8 ramos de idioma em assunto e formatação de moeda
      (`Intl.NumberFormat(locale === 'en' ? 'en-US' : 'pt-BR')`, `currency: USD|BRL`). Colapsados.
- [X] **T026** **Dois** arquivos de teste de `api-error`, não um: `__tests__/lib/api-error.test.ts`
      (6 asserções) e `lib/api-error.test.ts` (7, mais um dicionário mock com chave `'en'`).
      Os testes que provavam "sai em inglês" foram trocados pelo contrato que sobrevive
      (status 403/404; override explícito não chama `resolveRequestLocale`).
- [X] **T028** **Um TERCEIRO arquivo de teste de i18n**: `__tests__/lib/i18n-server.test.ts`,
      além de `lib/i18n-server.test.ts`. 5 asserções em `'en'`, todas invertidas. **Achado pela
      corrida da suíte, não pelo typecheck** — o `NextRequest` real não é tipado contra `Locale`,
      então o `tsc` passava limpo enquanto 5 testes falhavam.
- [X] **T029** 🚨 **`/en` puro redirecionava para `Location` VAZIO** (308 para lugar nenhum).
      A regra `/en/:path*` também casa `/en` com `:path*` vazio e montava um destino em branco,
      antes de a regra específica ser avaliada. **Só a verificação HTTP pegou** — build, typecheck
      e suíte passavam. Corrigido movendo `{ source: '/en' }` para ANTES do fallback.
- [X] **T030** **4 chaves i18n órfãs** (`common.language.{label,portuguese,english,switchTo}`)
      continuavam embarcadas no payload do next-intl de **toda página** depois do switcher ser
      apagado. Removidas de `messages/pt-BR/common.json`.
- [X] **T031** ⚠️ **Dois erros na própria checagem, não no código**: (1) o script exigia 301, mas
      `permanent: true` no Next emite **308** — Google consolida os dois igual; (2) grep por
      `English` casava o `availableLanguage: ["Portuguese","English"]` do schema.org, que descreve
      o contato de suporte e não é seletor de idioma. Primeira corrida mediu a checagem.
- [X] **T027** [T022] **~20 posts do blog têm `href="/en/register"` e `/en/blog/...` hard-coded** —
      todos dentro do campo `contentEn`, que nunca renderiza (o `isEn` que o selecionava agora é
      sempre `false`). **Nenhuma ação**: morrem junto com o conteúdo EN órfão, e se algum dia
      renderizassem, cairiam no 301 de `/en/:path*`.

---

## Dependências

```
T001 ─┬─> T002
      └─> (Fase 2 pode começar)

T003..T008  [P] entre si     ──┐
T009        [P] com as acima  ─┼─> T017..T021
T010        [P] com as acima  ─┘

T011 ─> T012 ─> T013
T014 ─> T015
T016 depende de T011 (senão o import dinâmico de messages/en some antes do locale)
```

## Fora de escopo (decidido, não esquecido)

- `titleEn`/`excerptEn`/`contentEn` nos 45 arquivos de `lib/blog` — ficam órfãos.
- Coluna `User.locale` no Prisma — fica, sem migração.
- Os `const isEn = locale === 'en'` restantes em `app/[locale]` — inertes, sempre `false`.
- Slugs internos das 6 calculadoras no redirect (`roi-calculator` → `calculadora-roi`) — plano D2.
- Arrancar o next-intl — rejeitado nas Clarifications.
