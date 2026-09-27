# Feature Specification: Cada conta só alcança o que é dela, e cada pessoa só o que pode ver

**Feature Branch**: `011-isolamento-contas`

**Created**: 2026-09-25

**Status**: Implemented (26/09/2026): US4 `6ed84c0`, US2 `0b48a6a`, US1 `7b9c257`, US3 `e2e16eb`

**Input**: Ações 1 a 4 da revisão de CRM de 25/09 (relatório local, fora do repositório). Escrita como requisito e
critério de aceite.

## Contexto

O Sirius é multi-conta: todas as contas dividem o mesmo sistema e o mesmo banco. Duas fronteiras precisam valer sempre:

- **entre contas**: a empresa A nunca lê nem altera nada da empresa B;
- **dentro da conta**: cada pessoa só vê o que o papel e as restrições dela permitem.

Esta spec transforma as duas fronteiras em regra verificável por teste automático. Ela cobre quatro frentes: o acesso
por identificador, o que a IA pode gravar, a visibilidade dentro da conta e a exportação, e o que entra e sai por
webhook.

**Quem opera**:

- o dono da conta, que configura e consulta o registro de auditoria;
- o gerente, que pode exportar;
- o vendedor, que opera a própria carteira;
- a equipe ROI Labs, que dá suporte;
- a IA da conta, que sugere.

**Escopo**: todas as telas logadas, as rotas internas e a API de integração, as ações da IA, a exportação e os webhooks
de entrada e de saída. **Fora**: login, cadastro e recuperação de senha; a exclusão de dados do titular (LGPD), que
fica para uma spec própria; a unificação de "mover negócio" e "registrar contato", que fica para a spec seguinte.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Nenhuma conta alcança registro de outra (Priority: P1)

Uma pessoa logada na conta B conhece, por qualquer motivo, o identificador de um negócio, contato, fechamento, tarefa,
anexo ou ação de IA da conta A. Ela não consegue ler, criar nada ligado a esse registro, alterar nem apagar. O sistema
responde como se o registro não existisse, com a mesma resposta de um identificador inventado.

**Why this priority**: é a fronteira que, se falhar uma vez, encerra a confiança no produto. Vale para todas as contas.

**Independent Test**: a verificação automática do código passa sem nenhuma consulta por id sem filtro de conta,
conferência ou justificativa. Para cada falha corrigida, a sessão da conta B usa o id da conta A, e o teste confere que
o pedido é recusado e que o registro de A continua igual.

**Acceptance Scenarios**:

1. **Given** um anexo de tarefa da conta A, **When** a sessão da conta B pede a lista de anexos daquela tarefa, **Then**
   a resposta é "não encontrado" e nenhum endereço de arquivo é devolvido.
2. **Given** um negócio da conta A, **When** a sessão da conta B tenta acrescentar uma nota, reordenar a coluna ou
   registrar um fechamento nele, **Then** nada é gravado e a resposta é "não encontrado".
3. **Given** um produto da conta A, **When** a conta B registra um fechamento no próprio negócio apontando para esse
   produto, **Then** o fechamento é recusado inteiro, sem gravar nome nem vínculo do produto.
4. **Given** um projeto de tarefas da conta A, **When** a sessão da conta B lê, cria ou reordena colunas, rótulos,
   checklists ou o histórico dele, **Then** nada é lido nem gravado.
5. **Given** uma consulta nova que busca registro por id sem filtro de conta, conferência ou justificativa, **When** a
   suíte roda no CI, **Then** ela falha e nomeia o arquivo e a linha.

---

### User Story 2 - A IA sugere; quem grava é uma pessoa (Priority: P2)

O dono de uma conta liga a IA. Ela lê as conversas e propõe: qualificar o lead e abrir um negócio, mudar a etapa,
responder o cliente, completar o cadastro. Nada disso acontece sozinho. Cada proposta entra na fila de aprovação com o
motivo, e só vira ação quando uma pessoa aprova. O que a pessoa digitou no cadastro nunca é trocado pela IA.

**Why this priority**: a IA fala com o cliente final em nome da conta e grava na base dela. Hoje não existe conjunto de
avaliação que garanta a qualidade das saídas, então a revisão humana é a única garantia.

**Independent Test**: com a IA ligada numa conta de teste e o limiar de confiança no mínimo, chegam mensagens de um
contato. O teste confere que nenhuma mensagem sai, nenhum negócio é criado, nenhuma etapa muda e nenhum campo de contato
é alterado até a aprovação. Depois da aprovação, só a ação aprovada acontece.

**Acceptance Scenarios**:

1. **Given** a IA ligada com qualquer limiar de confiança, **When** chega uma mensagem, **Then** toda proposta nasce
   "aguardando aprovação" e nada sai para o cliente.
2. **Given** um contato com empresa preenchida por uma pessoa, **When** a IA propõe outro perfil ou outra empresa,
   **Then** a proposta fica visível na ação, e o cadastro do contato continua como estava, mesmo depois da aprovação.
3. **Given** três mensagens do mesmo contato em sequência, sem negócio aberto, **When** a IA avalia, **Then** existe no
   máximo uma proposta de abrir negócio pendente para esse contato, e aprovar cria no máximo um negócio.
4. **Given** a proposta de abrir negócio sem valor sugerido, **When** aprovada, **Then** o negócio nasce "sem valor",
   e não com valor zero.
5. **Given** uma proposta de mudança de etapa aprovada, **When** a etapa muda, **Then** o histórico do negócio registra
   a mudança, com a pessoa que aprovou.
6. **Given** uma proposta que aponta para registro de outra conta, **When** alguém tenta criá-la ou aprová-la, **Then**
   ela é recusada sem ler nem gravar nada da outra conta.
7. **Given** um negócio aberto pela IA e aprovado, **When** alguém olha o dono, **Then** o dono é o responsável pelo
   contato ou, sem responsável, o dono da conta.
8. **Given** um agente que sugere produtos ou imóveis ao cliente final, **When** ele monta a sugestão, **Then** usa só o
   catálogo da conta, nunca dados de outros negócios ou clientes.

---

### User Story 3 - Cada pessoa vê só o que pode, em qualquer tela (Priority: P3)

O dono restringe uma vendedora a dois pipelines e marca tarefas como "só administradores" ou "privadas". A restrição
vale na tela em que foi pensada e também em todas as outras: quadro, relatórios, contatos, agenda, tarefas, busca e
exportação. Exportar a base inteira é coisa de dono ou gerente, e cada exportação fica registrada num histórico que o
dono consulta.

**Why this priority**: vale para as contas com time. Hoje são poucas, mas é o vazamento clássico de CRM: o vendedor que
sai leva a carteira de todo mundo.

**Independent Test**: numa conta de teste com dono, gerente e vendedora restrita, entrar como a vendedora e percorrer
cada tela e exportação, conferindo que nada fora do permitido aparece. Entrar como dono e conferir as exportações no
registro de auditoria.

**Acceptance Scenarios**:

1. **Given** uma vendedora restrita ao pipeline "Varejo", **When** ela abre os relatórios e pede outro pipeline pelo
   endereço da página, **Then** vê só o que é do "Varejo".
2. **Given** uma tarefa "só administradores", **When** vendedor, supervisor ou coordenador listam tarefas, a agenda ou os
   números de tarefas, **Then** a tarefa não aparece; para dono e gerente, aparece.
3. **Given** uma tarefa privada criada pelo dono, **When** uma vendedora que não é criadora nem responsável lista
   tarefas, **Then** a tarefa não aparece.
4. **Given** uma vendedora, **When** ela tenta exportar contatos ou negócios, **Then** a exportação é recusada com uma
   mensagem que diz quem pode exportar.
5. **Given** o gerente exportando 1.240 contatos, **When** o dono abre o registro de auditoria, **Then** vê quem
   exportou, o quê, quando e quantas linhas.
6. **Given** a equipe ROI Labs entrando como um usuário da conta para dar suporte, **When** o dono abre o registro de
   auditoria, **Then** vê quem da equipe entrou, como qual usuário e quando.

---

### User Story 4 - Webhook só entra assinado e só sai para a internet (Priority: P4)

As integrações avisam o Sirius por webhook quando chega mensagem ou lead. O Sirius só aceita o aviso que traz a
assinatura do provedor, conferida com a chave da conta. Sem ela, o aviso é recusado e nada é gravado. As automações da
conta que chamam um endereço externo só chamam endereços públicos da internet, nunca a rede interna do servidor.

**Why this priority**: um aviso aceito sem assinatura cria contato, põe conversa na caixa de entrada e pode acionar
resposta automática. Hoje só a conta de teste da equipe usa essas integrações, então a troca não interrompe nenhum
cliente.

**Independent Test**:
- mandar ao webhook um aviso com a assinatura certa, outro com a assinatura errada e outro sem assinatura;
- conferir que só o primeiro gera contato e mensagem;
- configurar uma automação apontando para um endereço interno e conferir que ela é recusada.

**Acceptance Scenarios**:

1. **Given** uma conta com a integração oficial de WhatsApp e a chave de assinatura cadastrada, **When** chega um aviso
   com assinatura válida, **Then** a mensagem entra como hoje.
2. **Given** a mesma conta, **When** chega um aviso sem assinatura ou com assinatura inválida, **Then** o aviso é
   recusado, nada é gravado e nenhuma resposta automática é acionada.
3. **Given** uma conta com a integração ligada mas sem a chave de assinatura cadastrada, **When** chega um aviso,
   **Then** ele é recusado, e a tela da integração mostra que falta a chave e onde encontrá-la.
4. **Given** uma automação com webhook de saída para um endereço interno, de loopback ou de rede privada (direto ou por
   um domínio que resolve para ele), **When** ela dispara, **Then** o envio é recusado e o registro da execução diz por
   quê.

---

### Edge Cases

- **Identificador de outra conta**: o pedido é recusado ("não encontrado" ou "sem permissão") sem devolver nenhum dado
  do registro.
- **Pedido misto**, como uma reordenação com negócios da própria conta e de outra: é recusado inteiro, sem gravar os da
  própria conta.
- **Vendedora restrita a pipelines que foram apagados**: não vê negócio nenhum. A tela diz que não há pipeline
  liberado, em vez de mostrar tudo.
- **Propostas da IA criadas antes desta mudança** com status de execução automática e ainda não executadas: passam a
  aguardar aprovação.
- **Proposta de abrir negócio aprovada quando o contato já tem negócio aberto**: não cria um segundo, e a ação aponta o
  negócio existente.
- **Exportação que devolve zero linhas**: também é registrada.
- **Conta com mais de um dono**: todos os donos veem o registro de auditoria.
- **Aviso de webhook reenviado pelo provedor com a mesma assinatura válida**: continua deduplicado como hoje, e não vira
  mensagem duplicada.
- **Endereço de webhook de saída que resolve para um IP público e depois para um interno**: vale o endereço resolvido na
  hora do envio.

## Requirements *(mandatory)*

### Functional Requirements

**Acesso por identificador (P1)**

- **FR-001**: Toda leitura, alteração ou exclusão de registro identificado por id MUST ser feita pelo par (conta de quem
  pede, id). Isso vale para negócio, contato, fechamento, nota, produto, pipeline, etapa, tarefa, anexo, comentário,
  checklist, coluna e rótulo de tarefa, e ação de IA. Registro de outra conta é tratado como inexistente.
- **FR-002**: Todo registro citado dentro de um pedido MUST pertencer à conta de quem pede; caso contrário, o pedido
  inteiro é recusado sem gravar nada. Exemplos: o produto num fechamento, os negócios numa reordenação, a entidade de uma
  ação de IA.
- **FR-003**: Uma verificação automática no CI MUST examinar toda consulta e gravação do código que mira registro por
  id. Cada uma precisa ter o filtro de conta, a conferência explícita da conta logo depois da busca, ou uma
  justificativa escrita junto dela.
- **FR-004**: A verificação MUST falhar, nomeando arquivo e linha, quando surgir consulta ou gravação por id que não
  cumpra o FR-003. Cada falha de isolamento corrigida nesta spec MUST ganhar um teste de comportamento: a sessão da
  conta B usa o id da conta A, e o teste confere que nada é lido nem gravado.

**IA (P2)**

- **FR-005**: Toda ação proposta pela IA MUST nascer aguardando aprovação humana, qualquer que seja a configuração de
  confiança da conta, até a existência de um conjunto de avaliação aprovado.
- **FR-006**: A IA MUST NOT gravar em campo de contato ou de negócio que uma pessoa preenche. O perfil, a empresa e
  outras inferências ficam como sugestão visível na ação.
- **FR-007**: Mudança de etapa aprovada a partir de proposta da IA MUST ficar no histórico do negócio, com quem aprovou.
- **FR-008**: Cada contato MUST ter no máximo uma proposta pendente de abrir negócio. Aprovar MUST NOT criar negócio
  quando o contato já tem um aberto.
- **FR-009**: Negócio criado a partir de proposta sem valor sugerido MUST nascer sem valor.
- **FR-010**: O dono de um negócio criado pela IA MUST ser o responsável pelo contato ou, sem responsável, o dono mais
  antigo da conta.
- **FR-011**: Sugestão de produto ou imóvel ao cliente final MUST usar só o catálogo da conta.
- **FR-012**: A configuração de IA MUST mostrar que a execução automática está desligada, em vez de oferecer um limiar
  que não tem efeito.

**Visibilidade e exportação (P3)**

- **FR-013**: A restrição de pipelines de um usuário MUST valer no quadro, nos relatórios, na agenda, na busca e na
  exportação de negócios. Na lista e na ficha de contatos, somem os negócios de pipelines não permitidos. O contato em
  si continua visível, porque contato não pertence a pipeline.
- **FR-014**: A visibilidade de tarefas MUST valer para todo papel abaixo de gerente, em todas as telas e números de
  tarefas. "Só administradores" fica visível para dono e gerente; "privada" fica visível para criador, responsável, dono
  e gerente.
- **FR-015**: A regra de visibilidade MUST estar num único lugar, usado por todas as telas e exportações.
- **FR-016**: Exportar contatos ou negócios MUST ser permitido só a dono e gerente. Para os demais papéis, a opção não
  aparece, e o pedido direto é recusado.
- **FR-017**: Cada exportação MUST gerar um registro de auditoria com conta, quem, o quê, formato, quantidade de linhas,
  quando e origem.
- **FR-018**: Cada entrada da equipe ROI Labs como usuário de uma conta MUST gerar um registro de auditoria na conta
  visitada, com quem da equipe, como qual usuário e quando.
- **FR-019**: Os donos da conta MUST poder consultar o registro de auditoria da própria conta, do mais recente para o
  mais antigo.

**Webhooks (P4)**

- **FR-020**: Webhook de entrada de provedor que assina os avisos MUST ter a assinatura conferida antes de qualquer
  leitura do conteúdo. Com assinatura ausente ou inválida, o aviso é recusado sem gravar nada.
- **FR-021**: Quando a assinatura depende de uma chave da conta, a conta MUST poder cadastrar essa chave na tela da
  integração. A chave é guardada cifrada e nunca é mostrada de volta.
- **FR-022**: Integração ligada sem a chave de assinatura MUST recusar os avisos e mostrar na tela da integração que a
  chave falta.
- **FR-023**: Todo endereço configurado ou digitado pela conta que o servidor chama MUST resolver, na hora da conexão,
  para endereço público da internet. Isso inclui webhook de saída, integração, e página a varrer para prospecção. Webhook
  de saída exige ainda endereço seguro (https). A recusa fica registrada.

### Key Entities *(include if feature involves data)*

- **Registro de auditoria**: um fato de acesso sensível numa conta.
  - Campos: conta, autor (usuário da conta ou pessoa da equipe ROI Labs), ação (exportação, entrada como usuário),
    alvo (o quê, formato), quantidade, quando e origem.
  - Só se acrescenta; nunca se edita.
- **Chave de assinatura da integração**: segredo da conta usado para conferir os avisos do provedor. Fica guardada
  cifrada, e a tela mostra só se está cadastrada.
- **Ação de IA**:
  - ganha a regra de nascer aguardando aprovação;
  - carrega a sugestão (perfil, empresa, etapa, rascunho) sem aplicá-la ao cadastro;
  - fica sempre na mesma conta da entidade a que se refere.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 consultas ou gravações por id sem filtro de conta, conferência ou justificativa. Uma consulta nova sem
  isso faz a suíte falhar. Toda falha corrigida tem um teste de comportamento verde.
- **SC-002**: Depois da entrega, 0 ações de IA executadas sem aprovação e 0 campos de contato alterados por IA. Medido
  nas ações registradas.
- **SC-003**: Em teste com uma vendedora restrita, 0 negócios de pipeline não permitido e 0 tarefas fora da
  visibilidade dela aparecem nas telas e exportações cobertas.
- **SC-004**: 100% das exportações e das entradas da equipe como usuário aparecem no registro de auditoria da conta, em
  até 1 minuto.
- **SC-005**: 100% dos avisos de webhook sem assinatura válida são recusados sem gravar nada, e 100% dos avisos válidos
  continuam entrando.
- **SC-006**: 100% dos envios de webhook de saída para endereço não público são recusados, com o motivo no registro da
  execução.

## Assumptions

- **Gerente conta como administrador** para tarefas "só administradores" e para exportar, como já acontece na
  configuração de projetos de tarefa. Supervisor, coordenador, vendedor e o papel legado "membro" seguem a regra
  restrita.
- **A API de integração é autenticada por chave da conta, não por usuário.** Ela segue a fronteira entre contas (P1),
  mas não as restrições de um usuário (P3).
- **A sugestão da IA fica visível na própria ação.** Aplicar o perfil ou a empresa ao contato é edição humana na ficha.
  Um botão "aplicar sugestão" fica para quando houver pedido.
- **As integrações que dependem de assinatura** (WhatsApp oficial e Facebook Leads) hoje estão ligadas só na conta de
  teste da equipe. A recusa de avisos sem chave não interrompe nenhum cliente, e a equipe cadastra as chaves depois do
  deploy.
- **O Facebook Leads usa o aplicativo da própria Sirius**, então a chave de assinatura é a do aplicativo, configurada no
  ambiente, e não por conta. O WhatsApp oficial usa o aplicativo de cada conta, então a chave é por conta.
- **O registro de auditoria começa** com exportação e com a entrada da equipe como usuário. Outros eventos (mudança de
  papel, exclusão em massa, login) ficam para quando houver pedido.
- **O conjunto de avaliação da IA** que permitiria religar a execução automática é outra spec.
