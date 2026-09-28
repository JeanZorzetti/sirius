# Leia primeiro: o site promete só o que o produto faz (specs 013–017, 27–28/09/2026)

Cinco specs e um conserto, todos em `main`. Cada spec tem `spec.md` e `tasks.md` em `specs/0NN-*/`.

| Entrega | O que mudou | Merge |
|---|---|---|
| 013 promessas honestas | Cancelar vale até o fim do período pago (desfazível); até 7 dias da 1ª cobrança, desistência com reembolso integral; trocar de plano atualiza a assinatura existente (upgrade proporcional, downgrade na renovação); teste de 14 dias (`lib/trial.ts`), inclusive no cadastro pelo Google; tabela da /features gerada de `PLAN_LIMITS` (`lib/plan-table.ts`); texto público sem promessa que o código não cumpre | #15 |
| fix IA | Os modelos Groq antigos saíram do ar; os nomes agora ficam em `lib/ai-models.ts` (`openai/gpt-oss-120b`, reserva `gpt-oss-20b`), trocáveis por `GROQ_MODEL` / `GROQ_MODEL_FALLBACK` sem deploy | #16 |
| 014 `moverNegocio` | Criar, mover, ganhar, perder, reabrir e trocar de funil passam por `lib/pipeline/mover-negocio.ts` (tela, API v1, IA). A etapa WON ou LOST define o status. O histórico guarda a etapa de origem e destino e o autor. Automação uma vez por movimento. Ações novas: `SEND_WHATSAPP` (só API Oficial, dentro da janela de 24h) e `UPDATE_FIELD` | #17 |
| 015 `registrarContato` | `lib/contacts/registrar-contato.ts`: `Contact.phoneKey` (mesma chave da entrada do WhatsApp) e origem de 1º toque; lead novo das portas de lead vai para o round-robin; `User.lastSeenAt` para "pular inativos" | #18 |
| 016 funil | `PipelineStage.probability` e `color`; chance no cabeçalho da coluna; diálogo "Editar etapa"; temperatura no card; previsão ponderada no analytics (`lib/pipeline/previsao.ts`) | #19 |
| 017 empresa e campos | `Company` + `ContactCompany` (papel: decisor, influenciador, champion); campos personalizados no contato e no negócio (Configurações → Campos personalizados); trigger no banco apaga os valores ao apagar o registro | #20 |

## Regras novas (não quebre)

- **Texto público:** `__tests__/seo/promessas-publicas.test.ts` falha se voltar "grátis para sempre", "7 dias do Pro",
  SSO, "ponta a ponta", `aggregateRating`, contagem de clientes, sync offline, abertura/clique ou "padrões de perda".
  Recurso novo no site só depois de existir no código.
- **Movimento de negócio:** nunca `prisma.deal.update({ data: { stageId | status } })` direto. Use `moverNegocio`.
  Negócio criado por pessoa, API ou IA passa por `aoCriarNegocio`. Importação e exemplo não passam, de propósito, para
  não disparar automação.
- **Contato novo:** porta de lead usa `registrarContato({ seExistir: 'reusar', distribuir: true })`. Criação por pessoa
  usa `'criar'` e `false`. Importação preenche `phoneKey: chaveTelefone(phone)`.
- **Campo personalizado** é para ler na ficha. O que vira filtro, relatório ou gatilho de automação vira coluna tipada.

## Migrations com SQL próprio

As migrations de 015 a 017 trazem backfill, CHECK e trigger. O CI roda `db push`, não as migrations. Por isso elas
foram testadas antes com `prisma migrate deploy` sobre o schema de produção (`pg_dump --schema-only`) restaurado num
Postgres 16 descartável. Repita esse teste para qualquer migration com SQL escrito à mão: o boot roda
`migrate deploy` com `set -e`.

## Pendências (em ordem)

1. **Prospecção Google Maps:** precisa de `GOOGLE_PLACES_API_KEY` no EasyPanel. *Código resolvido em 28/09:* provedor
   vazio passa a vez ao próximo, e zero leads depois de uma falha vira o erro `GOOGLE_PLACES_API_REQUIRED` na tela
   (`searchLeadsWithFallback`, teste em `lib/scraping/__tests__/fallback.test.ts`). O job que falha fica `FAILED`.
   Falta só a chave.
2. ~~**Agente de follow-up** fora da janela~~ *Resolvido em 28/09:* o cron de negócio parado só propõe o follow-up
   quando a conta tem a API Oficial e o contato escreveu nas últimas 24h. O `ProposalFollowUp` continua sendo só
   rascunho, nunca enviado.
3. **Crons:** a agenda está em `docs/crons.md` (28/09). Todas as rotas aceitam GET e respondem 401 sem `CRON_SECRET`
   (3 rotas aceitavam qualquer chamada quando a variável faltava; `task-recurrence` e `task-due-reminders` só aceitavam
   POST, o que explica "tarefas recorrentes nunca exercidas" se o agendador chama com GET). **Falta o dono:** abrir o
   agendador do EasyPanel e preencher a coluna "Chamada hoje?".
4. **Fluxos Stripe da 013** (agendar cancelamento, desistência com reembolso, troca com proration): cobertos por teste
   das regras, sem prova ponta a ponta. Testar com uma assinatura de verdade no modo teste da Stripe antes da primeira
   venda.
5. **Nunca exercidos em produção:** Google Calendar, push, Ads, tarefas recorrentes e check-in GPS.
6. Os `T00x` "depois do deploy" das `tasks.md` da 015 e da 017.

# Leia primeiro também: teste do Pro e E2E real (27/09/2026)

- **O teste de 7 dias do Pro agora recebe recursos e limites do Pro (`74c23fe`).** Antes, todo bloqueio lia o plano
  gravado (FREE). A conta em teste via "Trial PRO" e recebia os recursos e limites do Gratuito.
  - Regra em `lib/entitlements.ts`:
    - recursos e limites usam `getEffectiveTier`;
    - a cota de IA usa `getQuotaTier`, que dá a cota do Starter durante o teste (decisão do dono).
  - `getOrganizationEntitlements().tier` continua sendo o plano que o cliente paga.
  - Bloqueio novo deve usar `getEffectiveTier`. A contagem de clientes pagantes continua lendo `tier`.
- **O E2E roda contra um Postgres real e bloqueia o PR (`ca8a3ca`, `c8f96f4`).** Roda no Chromium com 2 workers,
  em cerca de 4 minutos: 120 testes passam e nenhum falha. `test-e2e` entra no "All Checks Passed".
  - O site é só em português. Os specs `so-portugues-*` garantem duas coisas:
    - cada URL antiga em `/en` redireciona (308) para a página em português;
    - os erros da API saem em português.
  - O job tem 2 referências a `prisma/whatsapp.prisma`. A branch da spec 012 já troca as duas por
    `prisma/wa/schema.prisma`.
  - Pulados de propósito, com o motivo escrito em cada spec:
    - rate limit, que precisa do Upstash;
    - criação de webhook, que precisa do Svix;
    - filtro de contatos da v1, marcado `fixme`, porque a API pública não tem filtro.
- **Decisões de produto em aberto:**
  - Os créditos de prospecção são 50 fixos para toda conta (`app/api/scraping/credits`), sem olhar o plano.
  - Os agentes de IA só rodam com `agaasEnabled`, que só o pagamento liga. Quem está no teste nunca vê agentes.

# Leia primeiro: integradores de WhatsApp (entram em 28/09/2026)

**Status on 27/09:** spec, plan and tasks are written (`b20a93a`, `a59c895`, `ca3ee1c`, `ef1860f`); the implementation
is in progress. Decisions are in `specs/012-whatsapp-integradores/handoff.md`.

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
