# Implementation Plan: Remover o locale EN e as rotas `/en`

**Branch**: `004-remove-en-locale` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-remove-en-locale/spec.md`

## Summary

Reduzir o conjunto de locales para `{pt-BR}` e apagar toda saída EN que chega ao mundo externo
(URL, `hreflang`, sitemap, seletor de idioma), com 301 de cada URL `/en` para seu equivalente em
português. O next-intl permanece montado com um locale só; `app/[locale]` não é movido e os 109
arquivos com `useTranslations` não são tocados.

**Princípio de corte** (decide arquivo por arquivo o que entra no diff):

> Remove-se o que **sai para fora** — URL, `hreflang`, `canonical`, sitemap, UI.
> Deixa-se o que fica **inerte por dentro** — um `const isEn = locale === 'en'` que agora é sempre
> `false` não muda um byte do HTML servido. Apagar essas ramificações é um segundo diff, de risco
> próprio, que não faz o `/en` sumir mais rápido.

Exceção ao princípio: o que **não compila** com um locale só entra no diff mesmo sendo interno
(`lib/i18n-server.ts` retorna literal `'en'` onde o tipo `Locale` agora só admite `'pt-BR'`).

## Technical Context

**Language/Version**: TypeScript, Next.js 16.3.5 (App Router), next-intl
**Primary Dependencies**: `next-intl` (fica), `next/config` redirects
**Storage**: Postgres/Prisma — **não tocado** (coluna `User.locale` permanece, sem migração)
**Testing**: Vitest (`lib/i18n-server.test.ts` é o teste que cobre esta mudança) + Playwright (e2e)
**Target Platform**: Web (siriuscrm.com.br)
**Project Type**: Next.js monolito
**Performance Goals**: sem regressão; o sitemap encolhe (sai `alternates` de ~200 entradas)
**Constraints**: nenhuma migração de banco no mesmo deploy que mexe em rota; nenhum arquivo com
`useTranslations` alterado; `localeDetection: false` não pode regredir
**Scale/Scope**: ~12 arquivos editados, 11 apagados

## Constitution Check

`.specify/memory/constitution.md` está no estado de template, sem princípios preenchidos — não há
gate de constituição a verificar neste projeto. Os gates usados no lugar são os do `CLAUDE.md`
global: fluxo Spec Kit (atendido), e verificação antes de declarar pronto.

## Correções à spec (achados do levantamento)

Dois requisitos foram escritos antes de ler o código e estão errados. Ficam assim:

- **FR-009 / SC-005 (corrigidos)**: a spec dizia que nenhum arquivo em `app/[locale]` seria tocado
  além do layout de marketing. **Falso**: o `hreflang` EN é emitido de dentro de `app/[locale]` —
  em `layout.tsx` (toda página do site) e em 4 páginas com `generateMetadata` próprio. Sem tocar
  neles a US2 não fecha. O que continua valendo é a parte que importa: **nenhum dos 109 arquivos
  com `useTranslations` muda**, e `app/[locale]` **não é movido**.
- **Achado novo (bloqueia build)**: `lib/i18n-server.ts:44,48` faz `return 'en'` com tipo de
  retorno `Promise<Locale>`. Com `Locale = 'pt-BR'`, isso é erro de tipo — o build quebra. Entra
  no escopo obrigatoriamente, junto com seus 5 testes que afirmam `'en'`.
- **Achado novo (redirect encadeado)**: `next.config.ts` já tem
  `/en/automated-sales → /en/automatic-sales`. Mantido como está, vira uma cadeia de 2 saltos.
  Passa a apontar direto para `/vendas-automaticas`.

## Project Structure

### Documentation (this feature)

```
specs/004-remove-en-locale/
├── spec.md       # feito
├── plan.md       # este arquivo
└── tasks.md      # próximo passo
```

Sem `research.md` (nenhuma incógnita técnica: é remoção, e as 3 decisões abertas foram resolvidas
nas Clarifications), sem `data-model.md` (nenhuma mudança de schema), sem `contracts/` (nenhuma
API nova).

### Source Code (arquivos no diff)

```
EDITADOS (12)
i18n/config.ts                                      locales = ['pt-BR']
i18n/routing.ts                                     locales + ~14 pathnames com chave `en`
middleware.ts                                       tira o strip de /en e o /en/login
next.config.ts                                      + 9 redirects 301; conserta /en/automated-sales
app/sitemap.ts                                      mata withAlternates e as colunas `en`
app/[locale]/layout.tsx                             tira `en:` dos dois blocos de alternates
app/[locale]/(marketing)/layout.tsx                 tira <LanguageSwitcher />
app/[locale]/(marketing)/blog/[slug]/page.tsx       tira `en:` do alternates
app/[locale]/(marketing)/blog/categoria/[category]/page.tsx   idem
app/[locale]/(marketing)/help/[categoria]/[slug]/page.tsx     idem
app/[locale]/(marketing)/solucoes/[slug]/page.tsx             idem
lib/seo/canonical.ts                                buildLocaleAlternates → só canonical
lib/i18n-server.ts                                  sem literal 'en'; valida locale do banco
lib/i18n-server.test.ts                             5 testes invertidos para pt-BR

APAGADOS (11)
messages/en/                                        10 arquivos JSON, 144 KB
components/marketing/language-switcher.tsx

NÃO TOCADOS (deliberado)
app/[locale]/**                                     109 rotas, nenhuma movida
109 arquivos com useTranslations/getTranslations
lib/blog/* (45)                                     titleEn/excerptEn/contentEn ficam órfãos
prisma/schema.prisma                                coluna locale fica
os `const isEn = locale === 'en'` restantes         inertes: sempre false
```

## Decisões de implementação

### D1 — `buildLocaleAlternates` é o ponto de corte único para 25 páginas

`lib/seo/canonical.ts` é importado por 25+ páginas de marketing e é quem monta
`{ canonical, languages }`. Trocar a função — mantendo a assinatura `(locale, ptPath, enPath?)` —
conserta as 25 sem tocar em nenhuma. Passa a devolver só `{ canonical }`: com um idioma, `hreflang`
não tem par e é byte morto no `<head>`.

Os parâmetros `locale` e `enPath` ficam na assinatura sem uso, para não abrir 25 call sites neste
diff. Marcado com comentário no arquivo.

As 4 páginas que montam `alternates` à mão (blog post, categoria de blog, artigo de help, solução
por nicho) não passam por essa função e entram no diff uma a uma.

### D2 — Tabela de 301, mais específico primeiro

`next.config.ts` avalia `redirects()` em ordem. As 8 regras de slug traduzido vêm antes do
fallback `/en/:path*` → `/:path*`, senão o fallback come todas.

```
/en/proposal            → /proposta
/en/yearbook            → /anuario
/en/automatic-sales     → /vendas-automaticas
/en/automated-sales     → /vendas-automaticas      (era /en/automatic-sales — desencadeia)
/en/tools/:path*        → /ferramentas/:path*
/en/solutions/:path*    → /solucoes/:path*
/en/blog/category/:slug → /blog/categoria/:slug
/en/checkout/success    → /checkout/sucesso
/en/:path*              → /:path*                   (fallback, por último)
```

Os slugs internos das calculadoras (`roi-calculator` → `calculadora-roi`) **não** são traduzidos:
`/en/tools/roi-calculator` cai em `/ferramentas/roi-calculator`, que é 404. São 6 URLs de baixo
tráfego; traduzir cada uma custaria 6 regras a mais para herdar quase nada. **Decisão: aceitar o
404 nessas 6.** Se o GSC mostrar impressão nelas, viram 6 regras.

### D3 — `resolveRequestLocale` perde os dois ramos de detecção

Detectar idioma por prefixo de URL ou `Accept-Language` não faz sentido com um idioma. Os dois
blocos saem e a função vira `session → User.locale validado → defaultLocale`. O parâmetro `req`
fica na assinatura (3 chamadores) mas sem uso.

`resolveUserLocale` ganha a validação do FR-008: valor de banco fora de `locales` cai em
`defaultLocale`, em vez de ser casteado e só falhar depois no `import()` de um JSON inexistente.

### D4 — Ordem de execução protege o site em cada passo

Os redirects entram **antes** do locale sair. Se o deploy parar no meio, o pior estado é
`/en/*` redirecionando para PT com o EN ainda funcionando — nunca `/en/*` em 404 aberto.

## Complexity Tracking

Nenhum desvio a justificar. A feature só remove; a única adição é a tabela de 301, que existe para
não jogar fora a autoridade de URL já indexada e tem prazo de validade declarado na spec.
