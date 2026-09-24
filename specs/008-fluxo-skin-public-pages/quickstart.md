# Quickstart: conferir a pele

Tudo a partir de `CRM/crm-project`. Build de produção local (o `npm run build` roda migrate: usar `npx next build`).

```bash
npx tsc --noEmit                                   # 0 erros
npx vitest run __tests__/styles/public-css-guard.test.ts   # inclui a guarda de paleta (R8)
npx vitest run                                     # suíte inteira
node scripts/audit-dead-code.js --check            # exit 0
npx next build && npx next start -p 3999
```

## Retratos (US1, US2, SC-003, SC-006)

Amostra: `/`, `/pricing`, `/blog`, um post (`/blog/whatsapp-api-oficial-meta-crm`), `/solucoes/<slug>`,
`/ferramentas/calculadora-roi`, `/login`, `/register`, `/anuario`, e um retrato do `/dashboard` com a sessão de teste
(`sessao.mjs`, bloqueando `/api/access/*` e `/api/push/*`). Larguras 1366 e 390, topo e uma tela abaixo, antes e
depois. A home e o dashboard têm de sair iguais.

Tema escuro salvo (US1 cenário 5, SC-002): `localStorage.theme = 'dark'` antes de carregar `/pricing` e `/blog`; a
página tem de sair clara.

## Varredura de cor (SC-001)

Na página renderizada, para cada elemento visível: `color`, `background-color` e `border-color` computados, em OKLCH,
não podem ter croma acima de 0,03 com matiz fora de 15–45° (o pulso é ~29°). Imagens, `svg` de marca de terceiros e
o conteúdo dentro de `img`/`video` ficam fora.

## Contraste e teclado (SC-004)

Árvore de acessibilidade + contraste medido dos textos da amostra; Tab do topo ao rodapé em `/pricing`, `/login` e
`/blog`, com retrato do foco em 3 elementos (link do menu, botão principal, chip de categoria).

## Desempenho (SC-005)

Régua da 007 (4G lento 150 ms / 1,6 Mbps, CPU 4×, 390×844, mediana de 3) em `/`, `/pricing`, `/blog`, antes e depois,
mesma máquina e mesma hora. LCP depois ≤ 1,10 × antes. JS transferido igual.
