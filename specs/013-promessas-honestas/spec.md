# Feature Specification: O site só promete o que o produto faz, e a cobrança faz o que o site promete

**Feature Branch**: `013-promessas-honestas`

**Created**: 2026-09-27

**Status**: Draft

**Input**: Ações 1 a 4, 7 e 8 da auditoria "o site promete, o produto entrega?" de 27/09/2026 (relatório local, fora do
repositório). As decisões do dono são de 27/09/2026.

## Contexto

O texto público (home, /pricing, /features, /solucoes, /download, e-mails) é oferta e vincula quem vende
([LEI CDC art. 30]). Esta spec alinha os dois lados em cinco frentes:

- **Cobrança:** o cancelamento, a troca de plano e a desistência nos 7 primeiros dias passam a fazer o que o texto
  promete.
- **Teste:** passa de 7 para 14 dias, e o site deixa de prometer um plano gratuito "para sempre".
- **Prova social:** só números reais.
- **Recursos:** a /features descreve apenas o que existe, com os limites que vêm do código.

**Quem opera**:

- o dono da conta, que assina, troca de plano e cancela;
- o visitante do site, que lê a oferta;
- a Stripe, que cobra e avisa por webhook.

**Escopo**:

- cobrança pela Stripe: cancelamento, troca de plano e desistência;
- duração do teste e o que acontece quando ele acaba;
- texto público de oferta, planos, recursos e prova social.

**Fora do escopo**:

- assinaturas legadas do Mercado Pago, que hoje são só de fundadores e não se cancelam pelo sistema;
- recursos que serão construídos nas specs 014 a 016: automações pela tela, round-robin, probabilidade e cor de etapa,
  Empresa e campos customizados. O texto deles fica e passa a valer quando cada spec entrar no ar;
- promessas operacionais que o código não mostra (suporte prioritário, gerente dedicado, SLA).

## Clarifications

### Session 2026-09-27

- Q: O que muda no plano gratuito? → A: o teste do Pro passa a 14 dias sem cartão. Depois dele, sem assinatura, a
  conta fica somente leitura e os dados continuam guardados. O site deixa de dizer "grátis para sempre".
- Q: O que construir e o que tirar do site? → A: SSO, sync offline de escrita, "audit log completo" e "criptografia de
  ponta a ponta" saem do site. Os demais recursos inexistentes serão construídos (specs 014 a 016).
- Q: Upgrade e downgrade? → A: o upgrade vale na hora e cobra a diferença proporcional. O downgrade vale na próxima
  renovação, sem cobrança nem crédito no ciclo atual.
- Q: E a garantia de 7 dias do site? → A: vira o direito de arrependimento ([LEI CDC art. 49]). Quem cancela até 7 dias
  depois da primeira cobrança recebe o reembolso integral, e o plano pago acaba na hora.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cancelar mantém o que foi pago (Priority: P1)

O dono de uma conta paga cancela pela tela de cobrança. O plano continua ativo até o último dia do período pago, e a
tela mostra essa data. Nenhuma cobrança nova acontece. No fim do período, a conta volta ao plano gratuito. Até lá, o
dono pode desfazer o cancelamento com um clique.

Nos 7 primeiros dias depois da primeira cobrança, o mesmo botão exerce o direito de arrependimento: o valor pago
volta inteiro e o plano pago acaba na hora.

**Why this priority**: a FAQ promete o acesso até o fim do período. Cortar o acesso antes disso cobra por um serviço
que não foi entregue.

**Independent Test**: com a Stripe simulada, cancelar uma assinatura de 20 dias atrás pede o cancelamento no fim do
período e não muda o plano da conta. O evento de assinatura encerrada rebaixa a conta. Cancelar uma assinatura de 2 dias
atrás pede o reembolso e o cancelamento imediato.

**Acceptance Scenarios**:

1. **Given** uma conta Pro paga há 20 dias, **When** o dono cancela, **Then** a conta continua Pro, a tela diz "Seu
   plano Pro vai até DD/MM" e a Stripe recebe `cancel_at_period_end`.
2. **Given** um cancelamento agendado, **When** o dono clica em "Manter assinatura", **Then** o agendamento sai e a
   renovação volta a acontecer.
3. **Given** um cancelamento agendado, **When** a Stripe avisa que a assinatura terminou, **Then** a conta vai para o
   gratuito e o motivo registrado é o cancelamento.
4. **Given** uma conta paga há 2 dias, **When** o dono cancela, **Then** o valor da primeira cobrança volta inteiro, a
   assinatura termina na hora e a tela confirma o reembolso.
5. **Given** um cancelamento feito, **When** ele termina, **Then** o dono recebe um e-mail que registra a data e o
   efeito.

---

### User Story 2 - Trocar de plano mantém uma assinatura só (Priority: P1)

O dono de uma conta paga escolhe outro plano. Existe sempre uma única assinatura. No upgrade, o plano novo vale na hora
e a Stripe cobra só a diferença proporcional ao que falta do ciclo. No downgrade, o plano atual vale até o fim do ciclo,
e a próxima fatura já sai no valor menor.

**Why this priority**: cobrar duas assinaturas pelo mesmo serviço obriga a devolver em dobro ([LEI CDC art. 42 p.ú.]).

**Independent Test**: com a Stripe simulada, pedir o Business numa conta Pro atualiza o item da assinatura existente com
proration e não cria checkout novo. Pedir o Starter agenda a mudança sem mudar o plano atual.

**Acceptance Scenarios**:

1. **Given** uma conta Pro com assinatura ativa, **When** o dono escolhe o Business, **Then** a assinatura existente
   muda de preço com cobrança proporcional, a conta vira Business na hora e nenhum checkout novo é aberto.
2. **Given** uma conta Pro com assinatura ativa, **When** o dono escolhe o Starter, **Then** a conta segue Pro até a
   renovação, a tela mostra "Muda para Starter em DD/MM", e na renovação a conta vira Starter.
3. **Given** uma conta gratuita, **When** o dono escolhe um plano pago, **Then** o checkout da Stripe abre como hoje.
4. **Given** um downgrade agendado, **When** o dono escolhe de novo o plano atual, **Then** o agendamento sai.
5. **Given** o pagamento da diferença recusado no upgrade, **When** a Stripe recusa, **Then** o plano não muda e o dono
   vê o motivo.

---

### User Story 3 - O teste tem 14 dias e o site diz o que vem depois (Priority: P1)

Toda conta nova recebe 14 dias com os recursos do Pro, sem cartão. O site, os e-mails e a tela de cobrança dizem o
mesmo: 14 dias do Pro, depois somente leitura até assinar, com os dados guardados.

**Why this priority**: o "grátis para sempre" é oferta publicada que o produto não cumpre.

**Independent Test**: um cadastro novo recebe o fim do teste 14 dias depois. A busca pelo texto público não acha "para
sempre", "sem prazo" nem "7 dias do Pro".

**Acceptance Scenarios**:

1. **Given** um cadastro novo, **When** a conta é criada, **Then** o teste termina 14 dias depois.
2. **Given** uma conta cujo teste começou antes da mudança, **When** a mudança entra no ar, **Then** o prazo dela não
   muda.
3. **Given** a /pricing, a home e o JSON-LD de FAQ, **When** o visitante lê o plano gratuito, **Then** lê "14 dias do Pro
   sem cartão; depois, somente leitura até assinar; seus dados ficam guardados".

---

### User Story 4 - Prova social só com número real (Priority: P2)

O visitante não vê avaliação, contagem de clientes nem depoimento que o Sirius não consiga provar.

**Why this priority**: avaliação e depoimento inventados são publicidade enganosa ([LEI CDC art. 37]). O Google também
pune dado estruturado de avaliação sem avaliação real.

**Independent Test**: o HTML público não tem `aggregateRating` nem `review`. A busca pelos números inventados não acha
nada.

**Acceptance Scenarios**:

1. **Given** qualquer página pública, **When** o HTML é lido, **Then** não há `aggregateRating` nem `review` no JSON-LD.
2. **Given** as páginas de nicho e de cidade, **When** o visitante lê a prova social, **Then** não há contagem de
   clientes, percentual de "mais vendas" nem depoimento com nome.

---

### User Story 5 - A /features descreve o produto que existe (Priority: P2)

O visitante que lê /features, a home, a /download e a FAQ da /pricing encontra só recursos que existem, com os limites
que o produto aplica.

**Why this priority**: a /features contradiz a /pricing e vende recursos que não existem.

**Independent Test**: um teste de unidade confere que cada limite mostrado na /features vem de `PLAN_LIMITS`. A busca
pelo texto público não acha SSO, sync offline, "audit log completo" nem "ponta a ponta".

**Acceptance Scenarios**:

1. **Given** a tabela de comparação da /features, **When** ela é montada, **Then** contatos, negócios, funis, usuários,
   automações e tarefas vêm de `PLAN_LIMITS`.
2. **Given** o texto público, **When** é lido, **Then** não promete SSO, registro offline sem sinal, auditoria de todas
   as ações, criptografia de ponta a ponta, análise de perdas por IA, métricas de abertura e clique de e-mail nem IA que
   qualifica cada lead sozinha.
3. **Given** a restrição de funil por vendedor, **When** a /features a descreve, **Then** não diz "só no Business",
   porque todos os planos a têm.

### Edge Cases

- A conta tem o downgrade agendado e cancela: vale o cancelamento, e o downgrade agendado sai.
- A conta tem o cancelamento agendado e faz upgrade: o cancelamento sai e o upgrade vale na hora.
- A conta passou do limite do plano menor no downgrade: nada é apagado. O que passa do limite fica visível, mas não
  deixa criar mais até voltar ao limite.
- O webhook chega fora de ordem ou em dobro: a renovação usa o plano agendado uma única vez.
- A conta é fundadora: o cancelamento segue recusado pelo sistema, como hoje.
- Mudança só de ciclo (mensal para anual no mesmo plano): tratada como upgrade, com cobrança proporcional.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cancelar uma assinatura Stripe com mais de 7 dias desde a primeira cobrança MUST agendar o fim para o
  último dia do período pago e MUST NOT mudar o plano da conta antes disso.
- **FR-002**: O sistema MUST guardar se o cancelamento está agendado e a data de fim do período, e a tela de cobrança
  MUST mostrar essa data.
- **FR-003**: O dono MUST poder desfazer o cancelamento agendado antes da data de fim.
- **FR-004**: Cancelar até 7 dias depois da primeira cobrança MUST reembolsar integralmente o valor dela e encerrar o
  plano pago na hora.
- **FR-005**: Com assinatura ativa, a troca para um plano mais caro ou de ciclo mais longo MUST atualizar a assinatura
  existente com cobrança proporcional imediata e MUST NOT abrir checkout novo.
- **FR-006**: Com assinatura ativa, a troca para um plano mais barato MUST valer a partir da próxima renovação. Até lá,
  a conta mantém o plano atual, e a tela mostra o plano e a data da mudança.
- **FR-007**: A renovação MUST aplicar o plano agendado e limpar o agendamento.
- **FR-008**: Contas novas MUST receber teste de 14 dias. As contas já em teste mantêm o prazo que tinham.
- **FR-009**: O texto público MUST NOT dizer "grátis para sempre", "sem prazo" ou "7 dias do Pro". Ele MUST dizer o que
  acontece no fim do teste.
- **FR-010**: O JSON-LD público MUST NOT ter `aggregateRating` nem `review`.
- **FR-011**: O texto público MUST NOT ter contagem de clientes, percentual de resultado nem depoimento que o banco não
  sustente.
- **FR-012**: Os limites mostrados na /features MUST vir de `PLAN_LIMITS`.
- **FR-013**: O texto público MUST NOT prometer SSO, sync offline de escrita, "audit log completo", "criptografia de ponta
  a ponta", análise de perdas por IA, métricas de abertura e clique de e-mail nem qualificação automática de cada lead
  por IA.
- **FR-014**: A FAQ da /pricing e os termos de uso MUST descrever o cancelamento, a troca de plano e o arrependimento
  como o sistema os executa.

### Key Entities

- **Organization** ganha três campos: `cancelAtPeriodEnd` (sim ou não), `currentPeriodEnd` (data) e `pendingPlan`
  (plano agendado para a próxima renovação, opcional).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nenhuma conta tem mais de uma assinatura Stripe ativa. Medição: comparar a lista de assinaturas ativas por
  customer na Stripe com as contas.
- **SC-002**: Em 100% dos cancelamentos fora da janela de 7 dias, a conta segue no plano pago até `currentPeriodEnd`.
- **SC-003**: A busca por "para sempre", "sem prazo", "aggregateRating", "SSO", "ponta a ponta" e "+2.500" no HTML das
  páginas públicas devolve zero.
- **SC-004**: Todo número de limite da /features é igual ao de `PLAN_LIMITS`, verificado por teste no CI.

## Assumptions

- O cliente do checkout self-service é tratado como consumidor, porque o fluxo atende pessoa física e MEI.
- As assinaturas do Mercado Pago ficam como estão: hoje só existe uma, de conta fundadora, que o sistema não cancela.
- O aviso antes do fim do teste não muda nesta spec: o teste não pede cartão e não vira cobrança.
