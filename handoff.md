# Handoff: o pipeline abre pela fila de quem pede ação hoje (spec 009) (2026-09-24, noite)

## Estado em uma linha
O `/dashboard` veste a direção **Hoje**, escolhida pelo Jean na terceira folha de contato: no alto, a fila dos negócios que
pedem ação (retorno vencido primeiro, depois o parado há mais de 30 dias na etapa); embaixo, o quadro com resumo honesto por
etapa. Tema claro padrão na língua da home; escuro na versão da folha (noite azul, âmbar). No ar desde 21:27 (`e72be85`),
com `f10dde0` (fontes com display optional) e `fb4ec18` (sem `:has()`). A spec anterior está em `git show 3a39def:handoff.md`.

## Feito nesta sessão
- **Direção de arte** (skills `information-design` → `art-direction`): perfil do dado real, três folhas de contato (A–C,
  D–F, G–I; dois "quero mais 3"), escolha I. Recusa registrada no `gosto.md` da skill (inferência pela escolha: oito
  vestidos do mesmo quadro perderam para a única que mudou o que a tela responde primeiro). Log em `.art/log.json` e
  `.info/log.json`. Glossário novo em `GLOSSARIO.md`.
- **Spec 009** (`specs/009-dashboard-fila-de-hoje/`): regra pura em `lib/pipeline/hoje.ts` (+ teste), `FilaDeHoje`,
  quadro e celular honestos, `hoje.css` com escopo `[data-tela="hoje"]`.

| Conferido | Resultado |
|---|---|
| `tsc` / lint dos arquivos / vitest | 0 / 0 erros (9 avisos antigos) / 372 de 373 + 1 skip (a falha é o flake de import sob carga, passa isolado) |
| 6 colunas em 1440 e 1366 sem rolagem lateral | sim |
| Estados provados | fila com itens, fila vazia (funil "teste 01"), pior caso da conta (funil "antigo", 69 negócios), sem valor, sem contato, contato sem telefone |
| Contraste (OKLCH → sRGB) | texto ≥ 5,18 nos dois temas; marca ≥ 3 |
| Teclado | "Conversar" e "Abrir negócio" alcançáveis com anel visível; "Abrir negócio" abre o diálogo no desktop |
| LCP produção, 390, 4G lento + CPU 4× | 5,97 s antes (5 amostras) → 6,04 s depois (7): **+1%**; CLS 0,069 igual |

## Achados
- **80,5% dos negócios reais não têm valor** (44,6% nulo + 35,9% zero). O zero vem de `lib/agaas-executor.ts`
  (`suggestedDealValue || 0`); a tela trata 0 como "sem valor". O formulário de criação grava vazio como nulo.
- **`data-art` desliga o `dark:`** (`app/theme.css`), por isso o escopo desta tela é `data-tela`.
- **O LCP do dashboard é o servidor, não a tela**: o documento tem 714 kb (154 kb na rede) porque o wrapper serializa todos
  os contatos da conta duas vezes (`dealContacts` e `contacts`); o LCP acompanha o `load` e varia 4–11 s conforme a hora.
- **Medição em produção**: a home (estática) não serve de controle para o dashboard (dinâmico); uma janela de 9–11 s às 22:00
  foi o servidor. `display: 'optional'` não mudou o LCP; tirou o CLS da troca de fonte.
- **Instrumento**: bloquear `/posthog/` no Playwright aborta chunks do `next dev` com "posthog" no nome (o quadro não monta);
  bloquear todo POST quebra as server actions de leitura (o diálogo não carrega). Os scripts estão no scratchpad (abaixo).
- O `e2e/page-objects/kanban-page.ts` selecionava por classe de estilo; agora por `data-testid`.
- 3 de 26 contas têm mais de um usuário: dono do negócio no cartão ainda não aparece.

## Próximos passos (em ordem)
1. **O Jean olha a tela no ar** (claro e escuro) e diz se algo muda. A barra lateral e a barra inferior ficaram fora do raio
   (verde do WhatsApp, índigo no item ativo); propagar a direção para elas e para as outras telas do app é trabalho próprio.
2. **Spec de desempenho do dashboard**: tirar do HTML os contatos que não estão em negócio (o `contactById` só precisa dos
   ligados a deals) e carregar a lista do seletor de contato sob demanda nos diálogos.
3. Limite de "parado" por etapa (hoje 30 d para todas, provisório).
4. Botão "Novo Deal" e "deals" do seletor: trocar por "negócio" numa passada só (`GLOSSARIO.md`).
5. Herdados da 008: PostHog sem chave, depoimento da `/register`, CSS do `base.css` na folha pública, marca da área `/IA`.

## Gotchas do ambiente
- Scripts desta sessão no scratchpad `3738c19b-…/scratchpad/ad/`: `sessao.mjs` (cookie da conta de teste), `perfil.mjs`
  (perfil do dado, só leitura), `prova.cjs` (retratos; `SO=`, `SUFIXO=`), `interacao.cjs` (hover, teclado, diálogo),
  `medir-dash.cjs` (LCP com sessão), `lcp-trace.cjs`, `rede.cjs`, `contraste*.mjs`, folhas `folha*/index.html`.
- `next dev` contra o banco de produção esgota o pool (P2024) com várias abas; uma aba por vez.
- Heredoc com certos trechos de SQL/JSX quebra o parse do Bash do harness: escrever arquivo pelo Write.
- Herdados: `GIT_LITERAL_PATHSPECS=1` e caminhos explícitos no commit; push em `main` = deploy (~2 min); working tree com
  mudanças de outras sessões (`CLAUDE.md`, `e2e/i18n-*`).
