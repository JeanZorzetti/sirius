# Research: 011 isolamento entre contas e dentro da conta

## R1. Como garantir "consulta por id sempre com a conta"

- **Decisão**: uma verificação estática no CI, feita com a AST do TypeScript, em `__tests__/isolamento/`.
  - **O que ela examina**: toda chamada `prisma|tx|prismaWa.<modelo>.<op>()` com `where` que mira registro específico
    (chave `id` ou `…Id`, fora `organizationId`), mais os `create` com chave estrangeira.
  - **O que ela aceita**:
    1. o `where` com `organizationId` ou um filtro de relação que o contenha;
    2. a busca seguida de `x.organizationId !== <quem pede>.organizationId`, que torna o id confiável para as chamadas
       seguintes da mesma função;
    3. um comentário `// isolamento: <motivo>` nas 3 linhas acima.
  - **O que ela faz no resto**: falha com arquivo, linha, modelo e operação.
  - **Sem linha de base**: tudo que hoje não passa é corrigido ou justificado nesta spec.
- **Por quê**:
  - o vazamento acontece na consulta, não na rota. A guarda enxerga toda consulta do código, inclusive as de ação do
    servidor, cron, webhook e rota com id no corpo, que um teste por rota não alcança;
  - é barata, determinística e roda em segundos.
- **Alternativas recusadas**:
  - **Teste de comportamento por rota com banco falso** (54 rotas com id no caminho, 212 no total e 89 ações): caro e
    frágil. Cada rota tem seu corpo de pedido, e a cobertura das rotas com id no corpo seria manual. Fica só para as
    falhas corrigidas (FR-004).
  - **Extensão do Prisma que injeta `organizationId`**: muda em tempo de execução todas as consultas de um sistema no ar
    e sem homologação. Quebra o que cruza contas por definição: o painel da equipe, os crons e o suporte.
  - **RLS no Postgres agora**: as tabelas filhas (`Note`, `Activity`, `DealClosing`, tabelas de tarefa) não têm
    `organizationId`. Entra depois da migração da spec seguinte, como terceira parede.
- **Limites declarados**:
  - SQL cru (`$queryRaw`) fica fora da guarda. Hoje ele só aparece em consultas que já filtram a conta, como a do chat.
  - A conferência aceita é a comparação textual na mesma função. Um helper que recebe id do chamador precisa de
    justificativa.
- **Medição inicial**: o protótipo v2 acusou 244 pontos em 92 arquivos. A v1, sem aceitar o padrão
  "busca + conferência", acusava 371.

## R2. Assinatura dos webhooks da Meta

- **Decisão**: `lib/meta-assinatura.ts` confere `X-Hub-Signature-256`, que é `sha256=` seguido do HMAC-SHA256 hex do
  corpo cru.
  - A comparação usa `crypto.timingSafeEqual`.
  - Segredo ou cabeçalho ausente dá `false`.
  - A rota lê `request.text()` antes de qualquer `JSON.parse`.
- **De onde vem o segredo**:
  - **WhatsApp oficial**: um app da Meta por conta (a tela manda cada conta configurar o próprio app). O segredo mora em
    `Organization.wabaAppSecret`, cifrado com `lib/encryption.ts`. A rota acha a conta pelo `entry.id` do corpo ainda
    não confiável, busca o segredo e confere antes de gravar qualquer coisa. Se as entradas do mesmo aviso apontarem
    para contas diferentes, todas precisam conferir.
  - **Facebook Leads e Instagram**: usam o app da própria Sirius, com `FACEBOOK_APP_SECRET` e `INSTAGRAM_APP_SECRET`
    (as mesmas env vars do OAuth).
- **Recusa**: devolve 401 e não grava nada. A Meta reenvia por alguns dias, então um aviso legítimo recusado durante a
  configuração da chave volta sozinho.
- **Impacto hoje**: as três integrações estão ligadas só na conta de teste da equipe, que precisa cadastrar o App Secret
  depois do deploy (ver quickstart).
- **Fora**:
  - o Omie não assina avisos, e 0 contas usam Omie;
  - a rota do gateway antigo `whatsmeow` não existe mais;
  - Stripe e Mercado Pago já conferem.

## R3. Endereço público nas chamadas de saída

- **Decisão**: `lib/url-publica.ts`.
  - `garantirUrlPublica(url, { exigirHttps })` valida o esquema.
  - `fetchPublico(url, init, opcoes)` faz o `fetch` com um `dispatcher` do `undici`, cujo `connect.lookup` recusa, na
    hora da conexão, IP privado, loopback, link-local, CGNAT, multicast, "não especificado", IPv6 ULA e IPv4 mapeado
    em IPv6.
  - Validar na conexão (e não antes) fecha o DNS rebinding.
- **Onde entra**:
  - `SEND_WEBHOOK` das automações (exige https);
  - o cliente n8n e a retentativa do n8n;
  - o crawler de prospecção;
  - o cliente Evolution.
- **Dependência**: o `undici` 7.21 já está no `node_modules`, como dependência transitiva. Ele passa a ser declarado no
  `package.json`.
- **Impacto hoje**: 0 automações com `SEND_WEBHOOK`, 0 contas com n8n, e as 2 contas com Evolution usam `https` em
  endereço público.

## R4. IA sem execução automática

- **Decisão**: o gatilho gera a proposta e o rascunho e grava a ação como `NEEDS_APPROVAL`. Nada é enviado ou gravado
  fora da própria ação. Isso vale para o gatilho de mensagem, o de contato criado e o do cron de negócio parado.
  - O executor ganha dois modos: **`rascunho`**, que chama o modelo e devolve a proposta sem efeito colateral, e
    **`aplicar`**, que executa a proposta aprovada.
  - Na aprovação, o executor usa o rascunho guardado. Se não houver, gera e aplica, como hoje.
- **Por agente**:

| Agente | Rascunho (no gatilho) | Aplicar (na aprovação) |
|---|---|---|
| LeadQualifier | qualificação + título e valor sugeridos | cria o negócio sob trava por contato; nada se o contato já tem negócio aberto; `value: null` sem sugestão; dono = responsável pelo contato ou o dono mais antigo da conta |
| DealStageAnalyzer | etapa sugerida | move a etapa e grava `Activity` `STAGE_CHANGE` com quem aprovou |
| FollowUp, Meeting, Property, Visit | texto da mensagem | envia o texto do rascunho (janela de 24h conferida de novo) |
| ContactEnricher, LeadProfiler | perfil e empresa sugeridos | nada: a sugestão fica na ação (FR-006) |
| ProposalFollowUp, NegotiationAssistant | texto | nada: já eram só rascunho |

- **Isolamento**: a entidade é carregada por `(id, organizationId)` no começo do executor. O `input.contactId` também é
  conferido. `POST /api/v1/agents/actions` recusa entidade fora da conta.
- **Proposta duplicada**: `pg_advisory_xact_lock(hashtext('lq:' || contactId))` numa transação curta, que confere se
  existe `LeadQualifier` pendente para o contato antes de criar outro.
- **Tela**: o limiar de confiança sai da configuração e do assistente de onboarding. No lugar, fica a frase "Toda ação
  da IA passa pela sua aprovação".
- **Ações já existentes com status `PENDING`**: a migration as passa a `NEEDS_APPROVAL`.
- **Alternativa recusada**: aprovar sem rascunho, gerando o texto na hora do envio. A pessoa aprovaria sem ver o que
  sai.

## R5. Visibilidade num lugar só

- **Decisão**: `lib/visibilidade.ts`.
  - `carregarAcesso(userId)` devolve `orgRole`, `pipelineRestricted` e `allowedPipelineIds`.
  - `escopoNegocio(acesso)` e `escopoPipeline(acesso)` montam o `where` de `Deal` e de `Pipeline`.
  - `escopoTarefa(acesso)` monta o `where` de `Task` com a regra de hoje, mas aplicada a todo papel abaixo de gerente,
    via `normalizeRole`.
  - `podeVerTudo(acesso)` vale para dono e gerente, e `podeExportar(acesso)` também.
- **Onde entra (leitura de negócio)**:
  - o quadro;
  - o analytics (página e perdidos), inclusive o filtro `pid` e os fechamentos;
  - a lista e a ficha de contatos;
  - a agenda;
  - a busca global;
  - a exportação de negócios;
  - o chat de IA e as ações de IA por contato.
- **Onde entra (tarefas)**: a lista, a tarefa, os números de tarefas, a agenda e a página do projeto.
- **Fora**: a API v1, que é autenticada pela chave da conta e não por usuário (FR-013 e premissa da spec).

## R6. Auditoria

- **Decisão**: modelo `AuditLog`, só de inserção. `lib/auditoria.ts#registrar()` é chamado:
  - pelas 4 rotas de exportação, depois de montar o arquivo, com a quantidade de linhas;
  - pelo `impersonateUser`, gravando na conta visitada, com o autor da equipe.
- **Onde se consulta**: a página `/dashboard/settings/auditoria`, só para `OWNER`, lista os 200 mais recentes.
- **Alternativa recusada**: reusar `UserActivity`. A tabela não tem gravação nenhuma (0 linhas), mistura rastreio de
  produto com auditoria e não separa autor da equipe de autor da conta.
