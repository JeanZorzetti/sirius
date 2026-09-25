# Handoff: a área logada inteira veste a pele do Pipeline (spec 010) (2026-09-25)

## Estado em uma linha
Toda tela logada (69 rotas: `/dashboard/*`, admin, Modo IA, checkout), a barra lateral, as barras do celular e todos os
diálogos vestem a pele da direção **Hoje**: gelo, grafite, Schibsted + DM Mono, canto de 4 px, sem sombra fora do que
flutua, cor só com significado (verde = ganho, âmbar = atenção, pulso = atraso/perda/erro). O escuro é a noite com âmbar
do Pipeline. No ar desde `f0c0361`, cerca de 2 min depois do push. A spec anterior está em `git show 246901c:handoff.md`.

## Feito nesta sessão
- **Escolha por imagem** (skill `art-direction`), em três folhas de contato com nove opções. A primeira (A/B/C, só pele)
  levou "Nenhuma", a segunda (D/E/F, estrutura nova) também, e a terceira (G/H/I, outra matéria) também. O Jean pediu
  para rever a primeira e escolheu **A**. O registro está em `.art/log.json` e no `gosto.md` da skill.
- **Spec 010** (`specs/010-pele-area-logada/`):
  - `app/app-pele.css`, carregado só pela folha do app, sem camada: tokens em `:root`/`.dark`, as 22 matizes do Tailwind
    remapeadas e as regras de forma;
  - fontes em `:root` via `<style>` nos layouts;
  - moldura ajustada à mão;
  - codemod `scripts/codemod-hex-pele.mjs`, pela AST, com 410 hex trocados;
  - guarda `__tests__/styles/app-color-guard.test.ts`.

| Conferido | Resultado |
|---|---|
| `tsc` / lint dos arquivos / vitest | 0 erros / 0 erros (76 avisos antigos) / 375 passam + 1 pulado |
| Guarda | falha com um literal plantado e nomeia o arquivo; passa no repositório |
| Elementos fora da paleta (cor computada, 48 retratos em produção) | 377 → **0** |
| Falhas de contraste AA (mesma amostra) | 295 → **31**; mais 66 no admin interno |
| Páginas públicas abertas direto (home, `/pricing`, `/blog`, 1440 e 390) | **0,000%** de pixels diferentes |
| LCP em produção (390, 4G lento + CPU 4×, mediana de 5) | Contatos 9,17 → 10,03 s (+9%); Tarefas 3,78 → 3,95 s (+5%); Pipeline 6,23 → 7,16 / 7,08 / 6,50 s |

## Achados
- **O LCP do Pipeline está inconclusivo, não aprovado.** Em três rodadas ficou entre +4% e +15%. O elemento é o mesmo
  (a linha da fila, que o servidor transmite), e FCP, `load`, JS e fontes ficaram iguais. A 009 já registrou variação de
  4 a 11 s conforme a hora. Contatos e Tarefas baixam agora as duas fontes (+32 kb e +46 kb) e ficaram dentro dos 10%.
- **As classes de cor fixas continuam no código** (`text-indigo-600`, por exemplo), mas desenham grafite. Quem precisar
  de cor de verdade usa um token. A troca dos nomes por codemod ficou adiada: o desenho sairia igual e o diff seria
  enorme (research R2).
- **`display: optional` quase nunca desenha a fonte num navegador automatizado.** A produção "antes", com cache quente,
  não mostrava nenhuma fonte do Pipeline. Retrato com fonte do sistema não é defeito da pele: confira o `font-family`
  computado.
- **Os gráficos escreviam `hsl(var(--x))`** sobre variáveis OKLCH, e os eixos nunca desenharam. Corrigido em 5 arquivos.
- **Barra lateral fechada**: a coluna da grade esticava para 96 px num trilho de 60 px e cortava o botão "Suporte
  WhatsApp". Corrigido com `grid-cols-[minmax(0,1fr)]`.
- **No escuro**, os degraus 400–600 sobem de luminosidade, porque 1.234 usos são texto secundário sem variante `dark:`.
  Texto branco sobre fundo 500/600 vira tinta escura, como no botão âmbar do Pipeline.
- **Ficaram de fora** as cores escolhidas pelo usuário (projetos, etiquetas: `data-cor-do-usuario`), o grafo do admin e
  o azul do botão do Facebook (exceções da guarda).

## Próximos passos (em ordem)
1. **O Jean olha o app no ar**, nos dois temas.
2. **Contraste restante**:
   - 31 textos na amostra, a maioria texto com opacidade (`/50`, `/60`, `/80`) sobre o gelo;
   - 66 no admin, que tem tabelas escuras fixas sobre página clara.
3. **Desempenho do dashboard** (herdado da 009): tirar do HTML os contatos que não estão em negócio. O LCP é o servidor.
4. **Defeitos vistos e não tocados**:
   - o subtítulo do "Criar contato" mostra a chave `components.contacts.addContactDesc`;
   - no celular, os cartões de contato têm uma caixa de seleção de 44 px vazia.
5. Herdados: marca própria da área `/IA`, "Novo Deal" → "negócio", PostHog sem chave, depoimento da `/register`.

## Gotchas do ambiente
- Scripts desta sessão no scratchpad `cab96ac8-…/scratchpad/app/`:
  - `prova-app.cjs`: retrato, cor computada e contraste; `SO=`, `TEMAS=`, `W=`; use `SESSAO=sessao-admin.txt` para
    admin e IA;
  - `sessao.mjs` / `sessao-admin.mjs`: cookie de conta de teste;
  - `medir-rota.cjs`: exige `MSYS_NO_PATHCONV=1`, senão o Git Bash troca `/dashboard` por um caminho do Windows;
  - `publicas.cjs`; as folhas `f1`/`f2`/`f3`.
- O Chat não abre no `next dev` local ("Falha ao carregar dados do usuário", banco do WhatsApp); confira em produção.
- Herdados: `GIT_LITERAL_PATHSPECS=1` e caminhos explícitos no commit; push em `main` = deploy (~2 min); a árvore tem
  mudanças de outras sessões (`CLAUDE.md`, `e2e/i18n-*`, `.specify/*` não rastreados).
