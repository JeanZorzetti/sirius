# Handoff: as páginas públicas vestem a pele da home (spec 008) (2026-09-24, tarde)

## Estado em uma linha
As 38 páginas públicas, os 404 e a página de erro estão com a pele da home Fluxo (opção **B**, escolhida pelo Jean por
imagem). No ar desde 16:29 (`6d833f8`), com o ajuste de pílulas e manchas em `e1a09b3`. App e home saíram idênticos
pixel a pixel. O PostHog continua sem chave.

## Feito nesta sessão

### 1. Manhã (já no ar, detalhes em `git show c4de467:handoff.md`)
- `og:image` em 26 páginas públicas (`bab2e95`), `purchase` do GA4 com o valor pago (`5f26d33`), capa do post do
  WhatsApp (`9312574`), modal "CRM, Kimi!", `theme_color` branco.

### 2. Spec 008: a pele da home em todo o site público (`6d833f8`, `e1a09b3`)
- **Como a escolha foi feita**: o Jean perguntou por que as outras páginas não herdaram a direção da home. A resposta:
  a home ficou isolada de propósito (para poder ser jogada fora, como a Carta de Bayer), e ninguém estendeu depois
  da aprovação. Folha A/B/C sobre `/pricing` e `/blog` no ar (CSS injetado): A = como está, B = só a pele,
  C = pele + abertura da home com as linhas. **Escolheu B.** A C (linhas em toda página) foi recusada e registrada em
  `gosto.md` da skill art-direction.
- **Arquitetura** (`specs/008-fluxo-skin-public-pages/`): `app/fluxo-pele.css` tem os tokens da home e mapeia as
  variáveis do shadcn dentro de `[data-art="fluxo"]`, que agora está no layout da home **e** no `(marketing)`. Vale
  também no `:root` enquanto uma página pública está montada (portais do Radix). A variante `dark:` não casa em
  página pública (`theme.css`), então tudo é claro, até para quem salvou o tema escuro no app.
- **Limpeza**: ~1.600 cores fixas do Tailwind em 44 arquivos viraram classes semânticas (codemod sobre a AST do
  TypeScript; a versão por regex quebrou JSX e foi descartada). ~5.000 cores inline no HTML de 45 posts viraram
  variáveis da pele. A cor por segmento de `/solucoes` saiu, junto com o campo `color` de `config/niche-data` e
  `city-data`. As regras `.prose`/`callout-*` do `base.css` e o foco verde (`#00a884`) foram sobrescritos só no
  escopo público.
- **Guarda**: `__tests__/styles/public-css-guard.test.ts` falha, com o nome do arquivo, se um arquivo público tiver
  matiz fixa, gradiente ou mancha, ou se um post tiver cor em hex.

| Conferido | Resultado |
|---|---|
| Home e dashboard (claro e escuro salvo) | idênticos ao antes (17 px de ±1 RGB em cantos no dashboard 1366 = antialias) |
| Links e texto por página, 38 rotas, contra produção antiga | iguais |
| Cor renderizada fora da paleta, 38 rotas + 404, local e **produção** | 0 |
| Tema escuro salvo | páginas públicas idênticas às claras (local e produção) |
| Contraste AA / foco visível no Tab, 40 páginas | 100% / 25 de 25 |
| LCP lado a lado (4G lento, CPU 4×, mediana de 5) | home −10%, `/pricing` +1%, `/blog` −9% |
| `tsc` / vitest / auditoria | 0 / 365 + 1 skip / exit 0 |

## Achados
- **O `next/font` pré-carrega toda fonte declarada num módulo importado.** Uma instância sem preload no mesmo arquivo
  que outra com preload não adianta. A home mantém as instâncias dela (com preload) em `(fluxo)/layout.tsx`; o resto
  importa `components/fluxo/fontes.ts` (sem preload). Com preload em todo lugar: `/pricing` +14%, `/blog` +38%.
- **Medir LCP no Windows + OneDrive**: um `next start` servido de dentro do OneDrive sai ~2× mais lento que o mesmo
  build servido de `C:\Users\…`, e medições em horas diferentes variam de 1,8 a 3,7 s na home sem mudança nenhuma. O
  que valeu: os dois builds fora do OneDrive, lado a lado (3998/3999), 5 rodadas intercaladas, terceiros bloqueados
  (`BLOQUEIA=1` no `medir.cjs`). Ver R11 em `research.md`.
- **Metade das "cores" dos posts era estilo inline**: o inventário por classe (398 usos) não via os ~5.000 hex no HTML.
- `text-destructive-foreground` **não existe** no tema (o shadcn v4 tirou); onde é usado, o texto herda. Em página
  pública foi trocado por `text-primary-foreground`; no app ficou como está.
- `/solucoes/[slug]` no celular estourava 27 px para o lado (já estourava antes); corrigido com `flex-wrap`.
- `app/NUL` (arquivo vazio de fevereiro, ignorado pelo `.gitignore`) atrapalha cópia e remoção de pasta no Windows.
- O depoimento "Carlos Silva, CEO TechFlow" ainda está na `/register` (os da home foram removidos por parecerem
  inventados).

## Próximos passos (em ordem)
1. **Olhar o site no ar** e dizer se alguma página ficou estranha. A folha B foi aprovada sobre `/pricing` e `/blog`; as
   outras 36 seguiram a mesma regra sem ser vistas por ele.
2. **PostHog**: nenhuma chave em nenhum `.env`. Roteiro em `git show 9797615:handoff.md`, item 1.
3. **Depoimento da `/register`**: confirmar se "Carlos Silva, TechFlow" é real; se não for, sai como os da home.
4. **Próxima alavanca de CSS** (spec nova): o CSS próprio do `base.css` (chat, kanban) ainda vai na folha pública.
5. **Dashboard não foi medido em desempenho.**
6. **Marca da área de IA** (`/IA`): decisão visual, mostrar quadro e pedir letra.
7. Herdados: GA4 `en=All Pages` no hit a frio; "+127 empresas" no anuário; página de sucesso diz "Sirius Pro" para
   qualquer plano; depoimentos dos 6 pagantes.

## Gotchas do ambiente
- **Não usar `Remove-Item -Recurse` em pasta com junção** (PowerShell 5.1 pode seguir o link e apagar o alvo). Apagar
  cada junção com `[System.IO.Directory]::Delete(caminho, $false)` antes. O filtro de segurança do harness bloqueia
  `rmdir /s` e junta `Remove-Item` com o `/E` do robocopy se estiverem na mesma chamada.
- O Turbopack recusa `node_modules` como junção para fora da raiz no **build** (worktree não serve); o `next start`
  aceita, desde que o `.next/node_modules` (links com hash dos pacotes externos) seja recriado na cópia.
- Build no OneDrive às vezes dá `EBUSY` na cópia do `standalone`: repetir.
- Scripts desta sessão no scratchpad (`r008/`): `retrato.cjs` (+ `TEMA=dark`), `compara.cjs`, `medir.cjs`
  (+ `BLOQUEIA=1`), `varredura.cjs` (cor computada), `a11y.cjs` (contraste + Tab), `pele-codemod.cjs` (AST),
  `posts-cores.cjs`, `sessao.mjs`.
- Herdados: `MSYS_NO_PATHCONV=1` para rotas no Git Bash; `GIT_LITERAL_PATHSPECS=1` e caminhos explícitos no commit;
  push em `main` = deploy (~2 min); working tree com mudanças de outras sessões (`CLAUDE.md`, `e2e/`).
