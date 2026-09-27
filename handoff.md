# Leia primeiro: integradores de WhatsApp (entram em 28/09/2026)

Os Termos (seção 6) e a Política de Privacidade já estão no ar dizendo que **a conexão por integrador só é ativada
depois que um usuário confirma o aviso de risco, e que isso fica registrado**. A tela e a rota de conexão precisam
cumprir isso, senão o texto publicado vira promessa falsa.

- **Tela de conexão:** usar `<AceiteIntegrador checked onChange />` de `components/chat/aceite-integrador.tsx`
  (caixa desmarcada e obrigatória, com o texto de `lib/termos.ts`). Não reescrever o texto na tela.
- **Rota que ativa a conexão:** antes de ativar, chamar
  `registrarAceiteIntegrador({ organizationId, autor, integrador, aceite: body.aceite, ip: ipDoPedido(req.headers) })`
  de `lib/auditoria.ts`. Se voltar `false`, responder 400 e não ativar nada. O registro aparece em
  Configurações → Auditoria para o dono.
- **Conexão por integrador não pode:** disparo em massa, lista de transmissão automatizada, cadência automática para
  quem não iniciou conversa (Termos 6.5). Bloquear no código, não só no texto.
- **Desconexão e banimento** viram aviso na tela para o admin da conta, não só log.
- Mudou o texto do aviso? Subir `VERSAO_AVISO_INTEGRADOR` em `lib/termos.ts`.
- Os textos do site já falam em "API oficial ou integrador" desde 27/09.

# Handoff: spec 011 implementada e degrau 5 do mapa GSC (2026-09-26)

Duas frentes rodaram em paralelo nesta data. A spec 011 vem primeiro; a parte do mapa GSC segue igual à que a outra
sessão escreveu.

# Parte 1: spec 011, isolamento entre contas e visibilidade

## Estado em uma linha
A `specs/011-isolamento-contas/` está implementada e no ar em quatro entregas: US4 `6ed84c0`, US2 `0b48a6a`, US1
`7b9c257`, US3 `e2e16eb`. Ela cobre as ações 1 a 4 da revisão de CRM de 25/09; o relatório fica fora do repositório.

## Feito
- **Toda busca e gravação por id carrega a conta.** A guarda estática `__tests__/isolamento/guarda-estatica.test.ts`
  roda na suíte com 0 pontos e sem lista de exceções. Rota nova com `findUnique({ where: { id } })` sem conferência
  quebra o CI e aponta arquivo e linha.
  - Para justificar um caso legítimo: `// isolamento: <motivo>` até 3 linhas acima da chamada, ou
    `// isolamento-arquivo: <motivo>` nas 15 primeiras linhas do arquivo (painel da equipe ROI Labs).
  - Chave estrangeira gravada em tarefa e negócio passa por `lib/tasks/chaves.ts` e `lib/pipeline/chaves.ts`.
- **Visibilidade dentro da conta num lugar só:** `lib/visibilidade.ts`.
  - `carregarAcesso`, `escopoNegocio`, `escopoPipeline`, `escopoProjeto` e `escopoTarefa`.
  - Kanban, analytics, contatos, agenda, tarefas, busca global, chat da IA e exportação leem por aí.
- **Exportação:** só dono e gerente. Cada exportação vai para a tabela `AuditLog`, e o "entrar como" da equipe
  também. O dono vê tudo em `/dashboard/settings/auditoria`.
- **IA: a IA sugere, o humano grava.** Toda ação nasce `NEEDS_APPROVAL`, com o rascunho em `output.rascunho`.
  - Só a aprovação (`lib/agaas-aprovacao.ts`) aplica.
  - O limiar de confiança saiu da interface.
- **Integrações:**
  - Os webhooks da Meta conferem `X-Hub-Signature-256` (`lib/meta-assinatura.ts`).
  - Saída para URL de terceiro passa por `fetchPublico` (`lib/url-publica.ts`), que recusa endereço interno.

## Falta fazer (dono)
1. **App Secret do WhatsApp oficial na conta de teste da equipe.** Em `/dashboard/settings/integrations/whatsapp-official`,
   colar a Chave secreta do app (Meta → Configurações do app → Básico). Sem ela, as mensagens que chegam são recusadas.
2. **EasyPanel:** conferir que `FACEBOOK_APP_SECRET` e `INSTAGRAM_APP_SECRET` estão definidos.
3. O roteiro de conferência em produção está em `specs/011-isolamento-contas/quickstart.md`, seção 2. O resultado da
   suíte e do banco está no fim do mesmo arquivo.

## Próxima spec (ações 5 a 10 da revisão)
- **5.** Uma função `moverNegocio` para todo caminho que muda etapa ou status, com registro do movimento, status pelo
  tipo da etapa e disparo de automação.
- **6.** `registrarContato`: telefone em E.164, `phoneKey` indexado e origem de 1º toque. Duplicado vira sugestão.
- **7.** Agenda de crons versionada no repo, snapshot de volta e registro de cada execução.
- **8.** Operação "eliminar titular" (LGPD), separada do excluir comum.
- **9.** `organizationId` em `DealClosing`, `Note` e `Activity`, com backfill.
- **10.** Fila Hoje com o grupo "sem retorno marcado".

## Gotchas
- `prisma generate` dá EPERM enquanto outro `next dev`/`start` segura a DLL. Gerar para uma pasta temporária e copiar,
  sem derrubar o servidor dos outros.
- Filtro Prisma com `undefined` significa "sem filtro". Sessão sem `organizationId` é recusada antes da consulta.
- Teste que importa rota a frio estoura 5 s na suíte cheia; `vi.setConfig({ testTimeout: 30_000 })` no arquivo.
- `@radix-ui/react-slider` ficou no `package.json` sem uso, depois que o `components/ui/slider.tsx` saiu.

# Parte 2: degrau 5 do mapa GSC (snippet)

## Estado em uma linha
As duas alavancas do degrau "5 · Snippet" do `hub.roilabs.com.br/gsc/mapa/sirius` (título e schema) foram
executadas, publicadas e marcadas como feitas (Jean, reler em 10/10/2026). O handoff do degrau 4 continua valendo e
está em `git show 992f1f26:handoff.md`.

## Feito nesta sessão
- **Título** (`e44cf62c`): 75 de 133 títulos passavam de 580 px. O crawl do hub no mesmo dia deu **0 de 133**.
  - Os posts ganharam o campo opcional `seoTitle` em `lib/blog-types.ts`. Ele vira o `<title>`; o H1 (`title`)
    e o título do OpenGraph continuam os mesmos.
  - Soluções, cidades, calculadoras, home, `/features`, `/pricing`, `/indique`, `/proposta`, `/help`, 4 artigos de
    ajuda e os 2 downloads HTML ganharam títulos mais curtos.
  - Todo título novo mantém um modificador de intenção. O degrau 3 não regrediu: 17 sem modificador antes e depois,
    todas utilitárias.
  - Onde o termo principal do Search Console cabia, ele foi para os primeiros 35 caracteres: 21 → 11 URLs fora.
- **Schema** (`e44cf62c`, `07599033`): 8 URLs indexadas sem resultado enriquecido (URL Inspection de 26/09).
  - As 5 calculadoras e a `/help` não tinham `BreadcrumbList`; agora têm.
  - As categorias "ferramentas" e "comparativos" tinham o breadcrumb desde março, e o Google nunca o detectou. A
    causa: 17 páginas injetavam o JSON-LD com `next/script`, que só chega depois da hidratação e fica fora do HTML
    do servidor. Viraram `<script>` nativo.
  - O layout do blog emitia o `CollectionPage` do `/blog` e um segundo breadcrumb em todo post e categoria. Os dois
    foram para `app/[locale]/(marketing)/blog/page.tsx`.

## O que ficou disparando, de propósito
- **Termo nos 35 primeiros caracteres: 11 URLs.** O termo principal delas é uma pergunta longa, uma busca de outro
  assunto ("comunicação automatizada com candidatos") ou uma busca de marca com 1 impressão.
  - `/help/automacoes/automacoes-email` passaria de 580 px com o sufixo "— Guia Sirius CRM" do template.
- **CTR Gap: os 3 alvos são URLs `/en/`**, que redirecionam 308 para o português desde 22/09 (spec 004). A janela do
  mapa, de 28/08 a 24/09, é quase toda anterior ao redirecionamento. Não há título EN para reescrever; os alvos saem
  da janela sozinhos até ~20/10.

## Decisão aberta (do dono)
- **Plano gratuito**: continua aberta, ver `git show 992f1f26:handoff.md`. Os títulos novos da `/pricing` e dos
  nichos mantêm o "Grátis" que já estava lá; não afirmam IA nem WhatsApp no plano gratuito.

## Próximos passos (em ordem)
1. **Pedir indexação** na UI do Search Console das 8 URLs sem resultado enriquecido: as 5 calculadoras, `/help`,
   `/blog/categoria/ferramentas` e `/blog/categoria/comparativos`. A API não faz esse pedido.
2. **10/10/2026**: reler os degraus 4 e 5 no mapa. A cobertura de schema e o CTR dependem de o Google recarregar
   as páginas.
3. Continuam valendo os passos 2 e 3 do handoff do degrau 4: reescrever `crm-gratuito-brasil-2026` e revisar as
   9 páginas vencidas.

## Gotchas
- Título novo: medir com `larguraDoTitulo`, `modificadoresDeIntencao` e `posicaoDoTermo` de `roihub/lib/pagina.mjs`
  antes do deploy. Cada caractere pesa diferente, então contar caracteres não basta.
- JSON-LD vai em `<script type="application/ld+json">` nativo, nunca em `next/script`.
- Schema posto em layout aparece em toda página filha.
- Substituição com `String.replace` em Node: um título com "R$" seguido de aspa vira o padrão `$'`. Passar uma
  função como segundo argumento.
- A cópia de trabalho está em CRLF; edição por substituição exata precisa respeitar isso.
