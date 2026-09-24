# Quickstart: validar a spec 007

Pré-requisitos: `npx next build` (nunca `npm run build`) e `npx next start -p <porta>`. Scripts de medida no
scratchpad da sessão (`medir.cjs`, `fonte.cjs`, `proto.mjs`), rodados da raiz do projeto.

1. **Guardas**: `npx vitest run __tests__/styles` passa. Para ver o guarda do grafo falhar, importe um componente
   de `components/deals` numa página de `(marketing)`: o teste tem que acusar o arquivo.
2. **Folha do app igual à de hoje (SC-004)**: compilar o `app/globals.css` novo e o de `6ade6a2` com o compilador
   do projeto. As saídas só podem diferir pela declaração `@layer properties,public;`.
3. **Tamanho (SC-001)**: no build, `/`, `/pricing` e `/blog` pedem uma folha com no máximo 33 kb gz, e nenhuma pede
   a folha do app. Conferir pelos `<link rel="stylesheet">` do HTML servido.
4. **Geist (SC-002)**: o `fonte.cjs` em `/`, `/pricing` e `/blog` não mostra woff2 da Geist. Numa tela da área de IA,
   `document.fonts` tem a Geist carregada.
5. **Retratos (SC-005)**: antes e depois, 1366 e 390 px, em `/`, `/pricing`, `/blog`, um post e o 404, e no app com
   sessão de conta de teste (dashboard, kanban, contatos e configurações). As imagens têm que ser iguais.
6. **Ida e volta na mesma aba (FR-004)**: com sessão, abrir o dashboard, clicar para `/pricing`, voltar pelo
   histórico, e retratar. Tem que ser igual ao dashboard aberto a frio. Fazer também o caminho `/pricing` →
   dashboard.
7. **LCP (SC-003)**: `medir.cjs`, mediana de 7 na home e de 3 em `/pricing` e `/blog`, com a linha de base medida
   no mesmo dia.
