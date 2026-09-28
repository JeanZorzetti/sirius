# Feature Specification: Todo movimento de negócio passa por uma porta, e a automação dispara em todas

**Feature Branch**: `014-mover-negocio`

**Created**: 2026-09-27

**Status**: Draft

**Input**:

- Decisões do dono de 27/09/2026: automações disparadas pela tela e ações "enviar WhatsApp" e "atualizar campo".
- Ação 5 da revisão de CRM de 25/09 (relatório local, fora do repositório).

## Contexto

Hoje um negócio muda de etapa, de funil ou de status por vários caminhos, e cada caminho segue a sua regra:

- **na tela:** o kanban, a edição, os botões de ganho e perda e a troca de funil;
- **na API:** criar, editar e trocar a etapa;
- **na IA:** o agente que move o negócio.

Só os da API disparam as automações que a conta configura. Por isso, uma automação criada na tela nunca rodou. Alguns
caminhos também não registram o movimento no histórico, e soltar o card numa etapa de ganho não marca o negócio como
ganho.

Esta spec cria uma porta única para esses movimentos e acrescenta duas ações às automações.

**Quem opera**:

- o vendedor, que move o negócio;
- o gestor, que configura automações;
- a API e a IA, que movem em nome da conta.

**Escopo**:

- criar negócio, trocar etapa, trocar funil e marcar ganho, perda ou reabertura, pela tela, pela API ou pela IA;
- as ações "enviar WhatsApp" e "atualizar campo".

**Fora do escopo**:

- importação de planilha e dados de exemplo, que nunca disparam automação;
- lembrete de próximo retorno (ação 10 de 25/09);
- snapshot diário.

## Clarifications

### Session 2026-09-27

- Q: Por onde sai o "enviar WhatsApp"?
  - A: Só pela API Oficial (WABA) e só dentro da janela de 24 horas.
  - Pelo integrador, o envio automático segue proibido (spec 012, termos 6.5).
  - Fora da janela ou sem WABA, a execução fica registrada como falha, com o motivo.
- Q: Quais campos a ação "atualizar campo" altera?
  - A: Uma lista fechada de colunas: valor, responsável, data prevista de fechamento e data do retorno.
  - Campo customizado entra quando existir (spec 017).
- Q: E-mail de "negócio criado" e "mudou de etapa" para quem fez a ação?
  - A: Não. O aviso vai para o responsável só quando outra pessoa, a API ou a IA fez o movimento.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A automação dispara em qualquer caminho (Priority: P1)

O gestor cria a automação "quando o negócio for para Proposta, criar tarefa de follow-up". O vendedor arrasta o card no
kanban para Proposta, e a tarefa aparece. O mesmo acontece quando o negócio é criado, ganho ou perdido pela tela, pela
API ou pela IA.

**Why this priority**: é o que o site vende e o que nunca rodou.

**Independent Test**: com uma automação DEAL_MOVED ligada, mover o negócio pelo kanban cria exatamente uma execução.
Repetir o mesmo evento não cria a segunda.

**Acceptance Scenarios**:

1. **Given** uma automação "movido para Proposta", **When** o card é solto em Proposta, **Then** a automação roda uma
   vez e a execução aparece no histórico da automação.
2. **Given** automações de "criado", "ganho" e "perdido", **When** o negócio é criado pela tela, marcado como ganho e
   depois reaberto e marcado como perdido, **Then** cada evento dispara a sua automação uma vez.
3. **Given** o mesmo movimento processado duas vezes, **When** a automação é chamada de novo com o mesmo registro de
   movimento, **Then** não há segunda execução.
4. **Given** uma importação de planilha, **When** os negócios são criados, **Then** nenhuma automação dispara.

---

### User Story 2 - Etapa e status andam juntos, e todo movimento fica no histórico (Priority: P1)

Soltar o card numa etapa do tipo ganho marca o negócio como ganho. Numa etapa do tipo perdido, marca como perdido.
Tirar de uma dessas etapas e pôr numa etapa aberta reabre o negócio. Todo movimento fica no histórico com a origem, o
destino e quem fez: pessoa, API, IA ou automação.

**Why this priority**: sem histórico completo não há conversão por etapa nem temperatura (spec 016).

**Independent Test**: mover por cada caminho grava um registro com etapa de origem e destino.

**Acceptance Scenarios**:

1. **Given** um negócio aberto, **When** é solto na etapa "Ganho" (tipo WON), **Then** o status vira ganho, a data de
   ganho é gravada e a automação de ganho dispara.
2. **Given** um negócio ganho, **When** volta para uma etapa aberta, **Then** o status volta a aberto e a data de ganho
   é limpa.
3. **Given** a troca de funil, **When** o negócio vai para outro funil, **Then** o histórico guarda o funil e a etapa de
   origem e de destino.

---

### User Story 3 - Enviar WhatsApp e atualizar campo como ações (Priority: P2)

O gestor adiciona a uma automação a ação "enviar WhatsApp", com texto e variáveis (nome do contato, título e valor do
negócio), ou a ação "atualizar campo".

**Why this priority**: as duas são prometidas no site.

**Independent Test**: com a WABA simulada, a mensagem só sai dentro da janela. Fora dela, a execução é FAILED com
motivo. "Atualizar campo" muda só a coluna escolhida.

**Acceptance Scenarios**:

1. **Given** WABA conectada e o contato escreveu nas últimas 24 h, **When** a automação roda, **Then** a mensagem sai e
   aparece na conversa.
2. **Given** a janela fechada, ou uma conexão só por integrador, **When** a automação roda, **Then** nada é enviado e o
   motivo fica na execução.
3. **Given** o contato mandou "SAIR", **When** a automação roda, **Then** nada é enviado.
4. **Given** a conta atingiu o teto diário de envios automáticos, **When** a automação roda, **Then** nada é enviado e o
   motivo fica registrado.
5. **Given** a ação "atualizar campo: responsável = Ana", **When** roda, **Then** o responsável muda. Ana precisa ser da
   mesma conta, senão a ação falha.

### Edge Cases

- Um movimento para a mesma etapa em que o negócio já está não gera registro nem automação.
- A ação "atualizar campo" não dispara nova automação. Não há laço.
- A etapa ou o funil de outra conta é recusado como "não encontrado".
- Uma falha numa automação não desfaz o movimento nem impede as outras automações.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Criar negócio pela tela, pela API ou pela IA MUST passar por uma função única que registra o histórico e
  dispara DEAL_CREATED.
- **FR-002**: Mudar etapa, funil ou status MUST passar por uma função única, que:
  - valida a conta, a etapa e o funil;
  - grava o movimento e o histórico numa transação;
  - dispara as automações depois dessa transação.
- **FR-003**: A etapa de tipo WON ou LOST MUST definir o status. Sair dela para uma etapa aberta MUST reabrir o negócio.
- **FR-004**: O histórico MUST guardar a etapa de origem, a etapa de destino e o tipo de autor (USER, API, IA,
  AUTOMACAO).
- **FR-005**: Cada automação MUST executar no máximo uma vez por registro de movimento.
- **FR-006**: Importação, exemplo e seed MUST NOT disparar automação.
- **FR-007**: O e-mail de negócio criado e de troca de etapa MUST NOT ir para quem fez a ação.
- **FR-008**: A ação SEND_WHATSAPP MUST enviar só pela WABA da conta e só dentro da janela de 24 h. Ela MUST respeitar
  o pedido de parada do contato e um teto diário por conta. Em qualquer outro caso, MUST registrar a falha com o motivo.
- **FR-009**: A ação UPDATE_FIELD MUST aceitar só `value`, `userId`, `closeDate` e `dueDate`. O `userId` MUST ser da
  mesma conta.
- **FR-010**: O editor de automação MUST oferecer as duas ações novas.

### Key Entities

- **Activity** ganha três campos: `fromStageId`, `toStageId` e `actorType`.
- **AutomationExecution** ganha `activityId`, único junto com `automationId`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Depois do deploy, `AutomationExecution` recebe linhas vindas da tela (hoje há zero).
- **SC-002**: 100% dos movimentos novos têm registro com etapa de origem e destino.
- **SC-003**: Nenhum par `automationId + activityId` repetido.
- **SC-004**: Nenhum negócio novo aberto numa etapa do tipo WON.

## Assumptions

- O teto diário de envio automático por WhatsApp é de 200 mensagens por conta. Ele é ajustável por constante.
