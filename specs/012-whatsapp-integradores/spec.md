# Feature Specification: WhatsApp pelo integrador que o cliente já contrata

**Feature Branch**: `012-whatsapp-integradores`

**Created**: 2026-09-27

**Status**: Draft

**Input**: "Vamos colocar as melhores integrações alternativas disponíveis para os clientes." Decisões do dono em
27/09/2026: a primeira versão conecta **Z-API, uazapi e Evolution API**, e a conexão por integrador fica disponível
em **todos os planos pagos** (Starter, Pro e Business). Revisão de CRM do mesmo dia: `crm-integrations` →
`crm-tenancy-security`, conferindo o bloqueio de cadência com `crm-automation`.

## Contexto

Desde 27/09/2026, os Termos (seção 6), a Política de Privacidade e o site dizem que o Sirius conecta o WhatsApp de dois
jeitos: pela API oficial da Meta ou pelo integrador que o cliente contrata diretamente. Hoje só a API oficial funciona,
e só no plano Business. A antiga conexão por QR Code, que usava um gateway próprio, foi descontinuada. As rotas dela
respondem "descontinuado" e a tela redireciona para a API oficial. O texto publicado promete uma conexão que ainda não
existe.

Esta spec entrega a conexão por integrador e cumpre o que os Termos já prometem:

- **6.2:** a conexão só é ativada depois do aceite de risco registrado.
- **6.5:** sem envio em massa, sem mensagem automática para quem ainda não conversou e sem mensagem para quem pediu
  para parar.
- **Aviso na tela:** desconexão ou bloqueio aparece para quem administra a conta, não fica só no log.

**Quem opera**:

- **Dono ou gerente da conta:** conecta o número, aceita o risco, reconecta e desconecta.
- **Vendedor:** lê e responde as conversas no inbox do Sirius.
- **Cliente final da conta:** manda mensagem para o número da empresa.
- **Integrador (Z-API, uazapi ou Evolution API):** avisa o Sirius das mensagens e do estado da conexão.

**Escopo**:

- A tela de conexão por integrador, com escolha do integrador, credenciais, QR Code quando preciso, aceite e estado.
- A entrada e a saída de mensagens de texto e mídia pelo inbox que já existe.
- O aviso de desconexão.
- As travas da seção 6.5.
- A liberação nos planos Starter e Pro, com os textos de plano que mudam por causa disso.

**Fora**:

- Agentes de IA respondendo pelo integrador. Eles continuam só na API oficial.
- A API pública e as automações enviando pelo integrador.
- A API oficial nos planos Starter e Pro.
- Outros integradores (W-API, WAHA e similares).
- A visibilidade das conversas por vendedor. Hoje todo usuário da conta vê o inbox inteiro, e isso não muda aqui.
- A exclusão de dados do titular (LGPD), que continua para uma spec própria.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O dono conecta o número pelo integrador que já contrata (Priority: P1)

A dona de uma conta do plano Starter já paga a Z-API e usa o número da loja lá. No Sirius, ela escolhe "Conectar por
integrador", seleciona a Z-API e cola as credenciais que o painel da Z-API mostra. Ela lê o aviso de risco e marca a
caixa. O Sirius confere se as credenciais funcionam e configura sozinho o integrador para avisar o Sirius das
mensagens. Com a instância já pareada no celular, a tela mostra "Conectado" com o número. Sem pareamento, a tela mostra
o QR Code para ela escanear.

**Why this priority**: sem conexão não existe nada do resto. É também o ponto em que o texto publicado dos Termos
(6.2) precisa ser verdade.

**Independent Test**: com uma instância de teste de cada integrador, o dono conecta, e o teste confere quatro coisas:
o estado "Conectado", o registro do aceite em Configurações → Auditoria, as credenciais que nunca voltam para a tela
depois de salvas e a recusa de um pedido de ativação sem o aceite.

**Acceptance Scenarios**:

1. **Given** um dono no plano Starter com credenciais válidas da Z-API, **When** ele conecta com o aviso marcado,
   **Then** a conexão fica ativa, o aceite aparece na auditoria com quem, quando, de qual IP e a versão do aviso, e o
   integrador passa a avisar o Sirius sem configuração manual.
2. **Given** o mesmo formulário, **When** o pedido de ativação chega sem o aceite, mesmo feito fora da tela, **Then**
   nada é ativado nem salvo, e a resposta diz que o aceite é obrigatório.
3. **Given** credenciais erradas ou de instância inexistente, **When** o dono tenta conectar, **Then** a tela diz qual
   dado o integrador recusou, e nenhuma conexão nem aceite é gravado.
4. **Given** uma instância da Evolution API hospedada pelo cliente, **When** o endereço informado aponta para rede
   interna, para o próprio servidor do Sirius ou para um endereço sem HTTPS, **Then** a conexão é recusada antes de
   qualquer chamada.
5. **Given** uma instância ainda não pareada, **When** a conexão é criada, **Then** a tela mostra o QR Code do
   integrador e troca para "Conectado" sozinha depois do pareamento, sem recarregar a página.
6. **Given** um vendedor, **When** ele abre a tela de conexão ou chama a ativação, **Then** vê a conexão só para
   leitura e o pedido é recusado.
7. **Given** uma conta no plano Gratuito, **When** o dono abre a tela, **Then** vê o que o recurso faz e o caminho para
   um plano pago, sem formulário.

---

### User Story 2 - O vendedor conversa pelo inbox do Sirius (Priority: P1)

Um cliente manda "Oi, ainda tem o modelo azul?" para o número da loja. Em poucos segundos, a conversa aparece no inbox
do Sirius, ligada ao contato certo, ou a um contato novo se o número é desconhecido. O vendedor responde pelo Sirius, e
a resposta sai pelo mesmo número. Se alguém da loja responde pelo celular, essa resposta também aparece na conversa,
como enviada pela empresa. Fotos, áudios e documentos chegam e saem.

**Why this priority**: é o valor do recurso: a conversa fica no CRM e não só no celular.

**Independent Test**: com uma conexão ativa de cada integrador, o teste confere quatro coisas:

- mandar texto, foto e áudio do celular do cliente aparece no inbox;
- responder pelo Sirius chega no celular do cliente;
- responder pelo celular da loja aparece no inbox como enviada;
- o mesmo aviso reenviado três vezes gera uma mensagem só.

**Acceptance Scenarios**:

1. **Given** uma conexão ativa, **When** um número novo manda mensagem, **Then** o contato é criado na conta dona da
   conexão e a mensagem aparece no inbox, marcada como não lida.
2. **Given** um contato já cadastrado com o número em outro formato (com ou sem +55, com ou sem o nono dígito),
   **When** ele manda mensagem, **Then** ela entra no contato existente, sem criar duplicado.
3. **Given** uma mensagem de grupo, de status ou de canal, **When** o integrador avisa o Sirius, **Then** ela é
   ignorada e não cria contato nem conversa.
4. **Given** o vendedor responde pelo Sirius, **When** o integrador aceita o envio, **Then** a mensagem aparece como
   enviada e depois muda para entregue ou lida, sem nunca voltar de "lida" para "entregue".
5. **Given** o integrador recusa o envio ou a conexão caiu, **When** o vendedor envia, **Then** a mensagem aparece como
   "não enviada" com o motivo, e o texto não se perde da tela.
6. **Given** uma mensagem enviada pelo celular da loja, **When** o integrador avisa o Sirius, **Then** ela aparece na
   conversa como enviada pela empresa e não dispara nenhuma resposta automática.
7. **Given** uma conta com a API oficial e um número por integrador, **When** o vendedor responde uma conversa, **Then**
   a resposta sai pelo mesmo número em que a conversa chegou.
8. **Given** uma foto recebida, **When** o vendedor abre a conversa dias depois, **Then** a foto continua visível,
   porque ela foi guardada pelo Sirius e não depende do link do integrador.

---

### User Story 3 - O dono fica sabendo quando a conexão cai (Priority: P2)

O WhatsApp desconectou a sessão da loja numa madrugada, ou bloqueou o número. Na manhã seguinte, o dono vê um aviso no
Sirius e recebe uma notificação: "WhatsApp (Z-API) desconectado desde 03:12 — reconectar". O inbox mostra o mesmo aviso
para os vendedores, então ninguém acha que "hoje ninguém mandou mensagem". Para reconectar, o dono abre a tela e
escaneia o QR Code de novo.

**Why this priority**: uma conexão que cai sem aviso é pior do que nenhuma. O vendedor confia que a conversa está no
Sirius, e ela não está. Os Termos também prometem esse aviso.

**Independent Test**: com uma conexão de teste, desparear o celular. O teste confere que o aviso aparece para o dono e
no inbox dentro do prazo, tanto quando o integrador avisa quanto quando o integrador fica calado.

**Acceptance Scenarios**:

1. **Given** uma conexão ativa, **When** o integrador avisa que a sessão caiu, **Then** a conexão muda para
   "Desconectada" com a hora e o motivo, o dono e os gerentes recebem uma notificação, e o inbox mostra o aviso.
2. **Given** uma conexão ativa, **When** o integrador para de avisar, por exemplo porque a assinatura do cliente com
   ele venceu, **Then** a conferência periódica do Sirius detecta a queda e gera o mesmo aviso.
3. **Given** uma desconexão por logout ou número bloqueado, **When** o dono abre a tela, **Then** ela explica que é
   preciso parear de novo e mostra o QR Code. No caso de bloqueio, ela aponta a API oficial como saída.
4. **Given** uma queda passageira que volta sozinha, **When** a conexão retorna, **Then** o aviso some e fica registrado
   quanto tempo ela ficou fora.
5. **Given** a mesma queda, **When** a conferência roda várias vezes, **Then** o dono recebe uma notificação por queda,
   e não uma por conferência.

---

### User Story 4 - As regras da seção 6.5 valem no código (Priority: P2)

A dona tenta encaminhar uma promoção para 40 contatos de uma vez pelo número conectado por integrador. O Sirius recusa
e explica que o envio em massa só é permitido pela API oficial. Nenhum envio automático do Sirius sai pelo integrador
para quem nunca mandou mensagem. Um cliente escreve "SAIR", e o Sirius para de enviar para ele por esse caminho até ele
escrever de novo.

**Why this priority**: os Termos publicados proíbem essas três coisas. Se o código permite, a promessa é falsa e o
número do cliente queima.

**Independent Test**: para cada caminho que envia sem uma pessoa digitando a mensagem para aquele contato (encaminhar
para vários, API pública, automação, agente de IA), o teste tenta enviar pelo integrador e confere a recusa. Também
confere a trava por contato depois de "SAIR".

**Acceptance Scenarios**:

1. **Given** uma conexão por integrador, **When** qualquer envio tem mais de um destinatário na mesma ação, **Then**
   ele é recusado com a explicação e o caminho para a API oficial.
2. **Given** um contato que nunca mandou mensagem para aquele número, **When** um envio automático tenta sair pelo
   integrador, **Then** ele é recusado e registrado.
3. **Given** uma pessoa da empresa digitando no inbox para um contato, **When** ela envia, **Then** o envio sai,
   porque é uma conversa 1:1 feita por uma pessoa.
4. **Given** um contato que respondeu só "SAIR", "PARAR" ou "STOP", **When** alguém tenta enviar para ele pelo
   integrador, **Then** o envio é recusado com o motivo até o contato mandar uma nova mensagem.
5. **Given** uma pessoa enviando muito rápido pelo inbox, **When** a conexão passa do limite de envio por minuto,
   **Then** os envios seguintes são recusados com "aguarde", sem fila acumulando para disparar depois.

---

### User Story 5 - Starter e Pro passam a ter WhatsApp, e os textos dizem isso (Priority: P3)

Quem assina Starter ou Pro passa a ter o inbox de WhatsApp com a conexão por integrador. A API oficial continua no
Business. A página de preços, a ajuda sobre planos e os posts que dizem "WhatsApp só no Business" passam a dizer o que
cada plano tem de verdade.

**Why this priority**: sem isso, o cliente Starter não descobre que pode conectar. Isso só depende das histórias 1 e 2
estarem no ar.

**Independent Test**: uma conta Starter, uma Pro e uma Business conseguem abrir o inbox e conectar por integrador, e
uma Gratuita não. Uma busca nos textos públicos não encontra "WhatsApp só no Business" nem a afirmação oposta de
WhatsApp oficial no Starter ou no Pro.

**Acceptance Scenarios**:

1. **Given** uma conta Pro, **When** o dono abre o menu de WhatsApp, **Then** vê "Conectar por integrador" liberado e
   "API oficial" indicado como recurso do Business.
2. **Given** uma conta que cai para o Gratuito ou tem o teste vencido, **When** isso acontece, **Then** a conexão por
   integrador fica suspensa: não envia nem recebe. O dono vê o motivo, e a conexão volta quando a conta voltar a um
   plano pago.
3. **Given** a página de preços e a ajuda de planos, **When** alguém lê o que cada plano inclui, **Then** a lista bate
   com o que o sistema libera.

### Edge Cases

- **A mesma instância do integrador em duas conexões**, na mesma conta ou em outra: a segunda ativação é recusada com
  "esta instância já está conectada no Sirius", sem dizer em qual conta.
- **O mesmo número pela API oficial e pelo integrador na mesma conta:** a conexão por integrador é recusada, porque o
  número já está conectado pela API oficial.
- **O cliente só tem identificador oculto (LID) e nenhum telefone visível:** a mensagem entra na conversa de quem já
  usou aquele identificador. Se ninguém usou, cria um contato sem telefone, marcado para completar o cadastro. Nunca
  cria um contato por mensagem.
- **Um aviso do integrador chega com um segredo que não é o da conexão, ou para uma conexão desativada:** é recusado
  sem gravar nada, e o conteúdo do aviso nunca decide de qual conta é a mensagem.
- **As credenciais foram trocadas ou revogadas no painel do integrador:** a próxima chamada falha, a conexão vai para
  "Reconectar" e o dono é avisado como na história 3.
- **O dono desconecta pelo Sirius:** o Sirius tenta desligar o aviso no integrador e apaga as credenciais. As mensagens
  já recebidas continuam no histórico.
- **Mídia acima do limite do integrador ou num tipo que ele não aceita:** o envio é recusado antes de sair, com o
  limite escrito.
- **A atualização de estado chega antes da própria mensagem enviada, ou fora de ordem:** o estado final é o mais
  avançado já recebido.
- **Duas mensagens iguais do cliente, com identificadores diferentes:** são duas mensagens, porque o que deduplica é o
  identificador, não o texto.

## Requirements *(mandatory)*

### Functional Requirements

**Conexão**

- **FR-001**: O sistema MUST permitir conectar um número por um destes integradores: Z-API, uazapi ou Evolution API.
  Cada um pede só as credenciais que o próprio integrador fornece.
- **FR-002**: Só usuários com papel de dono ou gerente MUST conseguir criar, reconectar ou desconectar uma conexão por
  integrador. Os outros papéis veem o estado só para leitura.
- **FR-003**: A ativação MUST exigir o aceite do aviso de risco vigente. O aceite é gravado antes da ativação, com
  usuário, data, IP, integrador e versão do aviso. Pedido sem aceite é recusado sem gravar nada, venha da tela ou não.
- **FR-004**: O sistema MUST conferir as credenciais no integrador antes de ativar e MUST recusar endereço de servidor
  que não seja público e HTTPS.
- **FR-005**: As credenciais MUST ser guardadas cifradas e nunca devolvidas para a tela, para a API, para o log nem
  para a exportação depois de salvas.
- **FR-006**: Ao ativar, o sistema MUST configurar o integrador para avisar o Sirius das mensagens recebidas, dos
  estados de entrega e das mudanças de conexão. O endereço desse aviso MUST ser exclusivo da conexão e impossível de
  adivinhar.
- **FR-007**: Quando a instância não está pareada, o sistema MUST mostrar o QR Code do integrador e atualizar o estado
  sozinho depois do pareamento.
- **FR-008**: Uma instância de integrador MUST estar ativa em no máximo uma conexão do Sirius, e um número MUST estar
  conectado por no máximo um caminho na mesma conta.
- **FR-009**: O número de conexões por integrador MUST respeitar o limite do plano: 1 no Starter, 2 no Pro e 5 no
  Business, mais as conexões extras compradas como add-on. Ao chegar no limite, a tela mostra o limite e o caminho do
  add-on ou do plano seguinte. (Decisão do dono, 27/09/2026.)

**Mensagens**

- **FR-010**: Um aviso do integrador MUST ser aceito só se trouxer o segredo da conexão. A conta dona da mensagem MUST
  vir da conexão, nunca do conteúdo do aviso.
- **FR-011**: O sistema MUST responder ao integrador logo depois de validar o aviso e processar a mensagem em seguida,
  sem deixar o integrador esperando o processamento.
- **FR-012**: A mesma mensagem avisada mais de uma vez MUST gerar um registro só, deduplicado pelo identificador que o
  integrador dá à mensagem, por conta.
- **FR-013**: Mensagem de grupo, de status e de canal MUST ser ignorada.
- **FR-014**: Mensagem recebida MUST ser ligada ao contato da conta pelo telefone normalizado, aceitando as variações
  de +55 e do nono dígito. Sem contato, um é criado. Com só o identificador oculto (LID), vale a regra dos casos de
  borda.
- **FR-015**: Mensagem enviada pelo celular da empresa MUST aparecer como enviada pela empresa e MUST NOT disparar
  resposta automática, agente nem notificação de mensagem nova.
- **FR-016**: O estado de entrega MUST avançar só para frente (enviada → entregue → lida), e falha MUST aparecer na
  mensagem com o motivo.
- **FR-017**: Mídia recebida MUST ser baixada e guardada pelo Sirius, separada por conta. O link do integrador nunca é
  guardado como definitivo.
- **FR-018**: A resposta a uma conversa MUST sair pela mesma conexão em que a conversa chegou, seja API oficial ou
  integrador.
- **FR-019**: O inbox, as notificações de mensagem nova e os webhooks de saída que o cliente já configurou
  (`whatsapp.message.in`) MUST tratar a mensagem por integrador igual à da API oficial.

**Regras da seção 6.5**

- **FR-020**: Pelo integrador, só MUST sair envio feito por uma pessoa, para um destinatário, pelo inbox. Encaminhar
  para vários, API pública, automação e agente de IA MUST ser recusados nesse caminho, com a explicação e o caminho
  para a API oficial.
- **FR-021**: Qualquer envio sem uma pessoa digitando para aquele contato MUST ser recusado quando o contato nunca
  mandou mensagem para aquele número. A regra vale para envios que no futuro passem a ser permitidos pelo integrador.
- **FR-022**: Um contato que manda só "SAIR", "PARAR" ou "STOP" MUST ficar bloqueado para envio pelo integrador até
  mandar uma nova mensagem. A trava aparece na conversa.
- **FR-023**: Cada conexão por integrador MUST ter um limite de envios por minuto. O excedente é recusado na hora, não
  enfileirado.

**Estado e aviso**

- **FR-024**: Cada conexão MUST ter um estado visível (Conectando, Conectada, Desconectada, Reconectar, Suspensa), com
  hora e motivo da última mudança.
- **FR-025**: O sistema MUST conferir periodicamente o estado de cada conexão ativa no integrador, para detectar queda
  mesmo quando o integrador não avisa. Uma queda MUST ser mostrada em no máximo 15 minutos.
- **FR-026**: A mudança para Desconectada, Reconectar ou Suspensa MUST gerar uma notificação para o dono e os gerentes
  (uma por queda) e um aviso no inbox para todos os usuários da conta.
- **FR-027**: Uma conta sem plano pago MUST ter as conexões por integrador suspensas, sem enviar nem receber, e MUST
  voltar a tê-las quando voltar a um plano pago, sem novo aceite se a versão do aviso não mudou.
- **FR-028**: Ao desconectar pelo Sirius, o sistema MUST tentar desligar o aviso no integrador e MUST apagar as
  credenciais. O histórico de mensagens fica.

**Planos e textos**

- **FR-029**: Os planos Starter, Pro e Business MUST liberar o inbox de WhatsApp e a conexão por integrador. A API
  oficial MUST continuar só no Business, junto com as contas que já tinham acesso antes dessa regra.
- **FR-030**: A página de preços, a ajuda de planos e os textos públicos MUST dizer o que cada plano libera, sem afirmar
  WhatsApp oficial no Starter ou no Pro e sem afirmar que o WhatsApp é só do Business.

### Key Entities *(include if feature involves data)*

- **Conexão de WhatsApp**: um número ligado à conta por um caminho, que pode ser a API oficial ou um integrador
  (Z-API, uazapi, Evolution API). Guarda o integrador, o endereço do servidor quando existe, as credenciais cifradas, o
  segredo do aviso, o número, o estado, o motivo e a hora da última mudança e quem conectou. Pertence a uma conta.
- **Aceite do aviso de integrador**: o registro de auditoria que já existe (`ACEITE_INTEGRADOR`). Guarda quem, quando,
  de qual IP, o integrador e a versão do aviso. O dono consulta em Configurações → Auditoria.
- **Mensagem de WhatsApp**: a mensagem que já existe no inbox, agora ligada à conexão por onde entrou ou saiu. Tem o
  identificador do integrador, o sentido, o estado de entrega, a mídia guardada e a origem do envio (pessoa ou
  automático).
- **Contato**: o contato que já existe, casado pelo telefone normalizado ou pelo identificador oculto (LID). Ganha a
  trava de envio por integrador depois de "SAIR".
- **Notificação de conexão**: o aviso ao dono e aos gerentes quando uma conexão cai, uma vez por queda.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um dono com as credenciais do integrador em mãos conecta o número em menos de 5 minutos, sem ajuda do
  suporte, nos três integradores.
- **SC-002**: 100% das conexões por integrador ativas têm um aceite registrado antes da hora de ativação. A conferência
  no banco dá zero conexões sem aceite.
- **SC-003**: Com o integrador funcionando, 95% das mensagens recebidas aparecem no inbox em até 10 segundos.
- **SC-004**: O mesmo aviso de mensagem entregue 3 vezes gera 1 mensagem no inbox, em 100% dos testes.
- **SC-005**: Uma conexão que cai aparece como desconectada para o dono em até 15 minutos, inclusive quando o
  integrador não avisa.
- **SC-006**: Zero envios automáticos pelo integrador para contatos que nunca mandaram mensagem ao número, e zero
  envios com mais de um destinatário. Existe um teste automático por caminho de envio.
- **SC-007**: Um aviso com o segredo de outra conexão, ou sem segredo, é recusado em 100% dos testes, e nenhum dado de
  outra conta é gravado nem lido.
- **SC-008**: Zero páginas públicas afirmam "WhatsApp só no Business" ou WhatsApp oficial no Starter ou no Pro depois
  da entrega.
- **SC-009**: Em 30 dias, pelo menos 1 conta Starter ou Pro conecta um integrador e recebe mensagens. Isso é o sinal de
  que a descoberta funciona.

## Assumptions

- **O cliente traz o próprio integrador (Termos 6.3).** O Sirius não revende, não hospeda nem paga a instância. Custo,
  suporte e falha do integrador são entre o cliente e ele.
- **Os três integradores do dono.** Z-API, uazapi e Evolution API v2 são os citados nos Termos e no site. A W-API
  aparece como exemplo nos Termos e fica para depois, sem mudar o texto.
- **Teste de 7 dias.** O teste tem os recursos do Pro, então quem está no teste também conecta por integrador. Ao fim
  do teste sem pagamento, vale o FR-027.
- **Agentes de IA continuam só na API oficial.** Eles já dependem de aprovação humana (spec 011), e o FR-020 bloqueia o
  envio deles pelo integrador.
- **Visibilidade do inbox.** Todo usuário da conta vê as conversas, como hoje. Uma regra por vendedor é outra spec.
- **Contato novo.** A mensagem de um número desconhecido cria o contato do mesmo jeito que a API oficial cria hoje. A
  unificação de "registrar contato" continua na próxima spec da revisão de 25/09 (ação 6).
- **Conexões antigas.** As conexões antigas do gateway por QR que ainda estiverem no banco ficam como "descontinuadas" e
  nunca enviam nem recebem. A contagem delas não foi medida, porque o banco do WhatsApp não é acessível na máquina
  local.
- **Limite de envio.** O limite por minuto (FR-023) segue a vazão humana de uma pessoa digitando. O valor fica no plano.
- **Mensagem de serviço.** A cobrança da Meta por mensagem de serviço a partir de 01/10/2026 não se aplica ao
  integrador, porque o cliente não paga a Meta por esse caminho.
