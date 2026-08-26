# Feature Specification: Intenção de WhatsApp no onboarding — Sirius CRM

**Feature Branch**: `003-onboarding-whatsapp-intent`

**Created**: 2026-08-25

**Status**: Draft

**Input**: User description: "Colocar a conexão de WhatsApp no passo 1 do onboarding" — com a restrição declarada de que **apenas o WABA (API oficial da Meta) é oferecido publicamente hoje**.

---

## Contexto / Evidência (não-normativo)

Todos os números abaixo foram medidos no banco de produção (`siriusdb`) em 25/08/2026.

### O que o funil mostra

| Medida | Valor |
|---|---:|
| Organizações cadastradas (excluindo `isTestAccount`) | **105** |
| Janela de cadastros | 02/02/2026 → 24/08/2026 |
| Organizações com `wabaEnabled = true` | **0** |
| Organizações com `wabaPhoneNumberId` preenchido | **0** |
| Organizações com `evolutionEnabled = true` | 2 |
| Pageviews **totais** em `/dashboard/settings/integrations` (desde fev/2026) | **68** |
| Organizações com contatos criados | 73 |
| Organizações com negócios criados | 69 |

**Nenhuma das 105 organizações chegou a ligar o WhatsApp.** Não é o caso de terem tentado o WABA e desistido no meio — não há um único registro com credencial parcial. Setenta e três delas usaram o CRM a ponto de cadastrar contato e negócio sem nunca abrir o caminho do WhatsApp, e a página de integrações recebeu 68 visualizações somadas em seis meses.

A hipótese comercial (prospects que não fecham por causa da burocracia do WABA) **não é observável neste banco** e não é contestada por ele: quem desiste na conversa de vendas, antes do cadastro, não deixa linha. O que o banco mostra é diferente e complementar — **dentro do produto, o WhatsApp nunca foi apresentado a ninguém.**

### O que o passo 1 já faz (e por que não deve ser substituído)

O onboarding hoje é um único modal com três cartões — *Ver Demonstração* / *Importar Dados* / *Começar do Zero* ([welcome-modal.tsx](../../components/onboarding/welcome-modal.tsx)).

Apenas um ponto do código escreve `currentStep`/`completedSteps`: [lib/seed-demo-data.ts:220](../../lib/seed-demo-data.ts#L220), com `currentStep: 1, completedSteps: ['demo_data_loaded']`. Logo, os **66 registros com `currentStep = 1` são 66 organizações que escolheram "Ver Demonstração" e receberam os dados semeados** — **58% dos 113 registros de onboarding**.

O primeiro passo converte. Ele não é o vazamento.

### Por que a coluna `status` não pode ser usada como métrica

`OnboardingProgress.status` reporta 101 `SKIPPED` contra 12 `COMPLETED`, o que contradiz os 66 acima. A causa é uma corrida no próprio código:

```
handleChoice('demo')  → POST /api/onboarding/seed-demo   → grava COMPLETED
                      → onClose()                        → wrapper dispara
                                                            POST /api/onboarding/complete {SKIPPED}
                                                            (fire-and-forget, .catch(() => {}))
                      → window.location.href             → navega; o POST chega ou não
```

`handleClose` em [onboarding-wrapper.tsx](../../components/onboarding/onboarding-wrapper.tsx) roda **também quando houve escolha**, e sobrescreve `COMPLETED` com `SKIPPED`. Os 12 `COMPLETED` sobreviventes são apenas aqueles em que a navegação matou o request antes de ele sair.

Consequência para esta feature: **qualquer medição de intenção construída sobre a gravação atual nasce inválida.** Corrigir a gravação é pré-requisito, não polimento — é a User Story 0.

### Por que o WABA não pode ser a primeira tela

O formulário de conexão oficial ([whatsapp-official/settings](../../app/api/integrations/whatsapp-official/settings/route.ts)) exige quatro valores que o usuário precisa ir buscar no Meta Business Manager: `phoneNumberId`, `businessAccountId`, `accessToken` e `webhookVerifyToken`.

Colocar esse formulário como passo 1 põe a barreira mais alta do produto na frente do único passo que hoje converte 58%. O risco não é deixar de melhorar — é **degradar o que funciona**. Esta spec, portanto, entrega no passo 1 a **pergunta**, não o formulário.

---

## Clarifications

### Session 2026-08-25

- Q: A tela de WhatsApp substitui os três cartões atuais ou vem depois deles? → A: **Depois.** Os três cartões convertem 58% e ficam intactos; a tela de intenção é uma segunda etapa do mesmo fluxo.
- Q: O que a opção "conectar por QR code" entrega ao usuário, se o não oficial não é público? → A: **Registra a intenção e informa que o canal está em liberação, sem prometer data.** Sem encaminhamento a comercial — nenhum contato humano é disparado por esta escolha. Ver FR-009.

---

## User Scenarios & Testing *(mandatory)*

### User Story 0 - A gravação do onboarding volta a dizer a verdade (Priority: P0)

Como responsável pelo produto, preciso que `OnboardingProgress` registre o que o usuário de fato fez, para que qualquer número extraído depois signifique alguma coisa.

**Por que P0**: toda a razão de existir desta feature é produzir um número confiável sobre intenção de WhatsApp. Construir a medição sobre uma coluna que se sobrescreve sozinha entrega um número que parece dado e é ruído. Esta história não depende de nenhuma decisão de produto e pode ir sozinha.

**Teste de aceitação**
1. Usuário novo escolhe "Ver Demonstração" → `status` permanece `COMPLETED`; `currentStep = 1`; `completedSteps` contém `demo_data_loaded`.
2. Usuário novo escolhe "Começar do Zero" → `status` permanece `COMPLETED`.
3. Usuário novo fecha o modal com ESC, clique fora ou botão de fechar → `status = SKIPPED`, `skippedAt` preenchido.
4. Os três casos acima permanecem corretos após recarregar a página.

---

### User Story 1 - O usuário é perguntado sobre o WhatsApp (Priority: P1)

Como usuário recém-cadastrado, quero declarar qual WhatsApp pretendo conectar logo no início, para que o CRM me leve ao caminho certo em vez de me deixar procurar em Configurações.

**Por que P1**: é a entrega central. Hoje 105 organizações passaram pelo produto sem que o assunto fosse levantado uma única vez.

**Teste de aceitação**
1. Concluída a escolha do passo 1, o usuário vê uma tela com três saídas: já possui API oficial / quer conectar por QR code / decidir depois.
2. Cada saída grava a intenção declarada e encerra o onboarding sem erro.
3. "Depois" não bloqueia o acesso ao dashboard nem reaparece na sessão seguinte.
4. Um usuário que já tem WhatsApp configurado não vê esta tela.

---

### User Story 2 - Quem tem WABA conecta sem sair do fluxo (Priority: P2)

Como usuário que já possui conta na API oficial, quero ser levado direto ao formulário de conexão, sem ter que descobrir onde ele fica.

**Por que P2**: é o único caminho de conexão público hoje. Depende da US1 existir.

**Teste de aceitação**
1. A saída "já possuo API oficial" leva ao formulário existente de WhatsApp oficial.
2. O formulário é o mesmo de Configurações — nenhuma segunda implementação de campo, validação ou criptografia de token.
3. Concluída a conexão, `wabaEnabled` e `wabaPhoneNumberId` ficam preenchidos, exatamente como no caminho por Configurações.
4. Abandonar o formulário no meio preserva a intenção já declarada.

---

### User Story 3 - A objeção vira número (Priority: P3)

Como responsável pelo produto, preciso saber quantos usuários declaram querer o canal não oficial, para decidir com evidência se o investimento no gateway se justifica.

**Por que P3**: é o retorno estratégico da feature, mas só tem sentido depois que US0 e US1 estiverem no ar acumulando dados.

**Teste de aceitação**
1. É possível obter, por consulta ao banco, a contagem de organizações por intenção declarada (`waba` / `qr` / `later`) num período.
2. A consulta distingue quem nunca viu a tela de quem viu e escolheu "depois".
3. Organizações de teste (`isTestAccount`) ficam fora da contagem.

---

### Edge Cases

- Usuário que já conectou WhatsApp antes de a feature existir: não vê a tela, e a ausência de intenção declarada não é contada como recusa.
- Usuário que escolhe "Importar Dados": o modal de importação abre e o welcome modal permanece aberto atrás dele (comportamento atual). A tela de intenção só aparece quando esse fluxo termina.
- Segundo usuário da mesma organização: a intenção é do **usuário** (`OnboardingProgress` tem `userId @unique`), mas a conexão é da **organização**. Se a organização já tem WhatsApp ligado, o segundo usuário não vê a tela.
- Falha de rede ao gravar a intenção: o onboarding não pode travar. A gravação é secundária ao avanço do usuário — mas, ao contrário do bug descrito acima, uma falha não pode gravar um valor errado; ou grava o correto ou não grava nada.
- Usuário fecha o navegador na tela de intenção: conta como "não declarou", não como "depois".

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema **NÃO PODE** gravar `status = SKIPPED` quando o usuário fez uma escolha explícita no welcome modal. `SKIPPED` passa a significar exclusivamente dispensa sem escolha.
- **FR-002**: A correção de FR-001 **DEVE** ser feita pelo menor diff que elimine a segunda gravação, preferindo remover a chamada redundante a acrescentar controle de estado. Nos ramos que navegam via `window.location.href`, o fechamento explícito do modal é redundante.
- **FR-003**: Após a conclusão da escolha do passo 1, o sistema **DEVE** apresentar uma etapa de declaração de intenção de WhatsApp ao usuário que ainda não tem WhatsApp conectado na organização.
- **FR-004**: A etapa **DEVE** oferecer exatamente três saídas mutuamente exclusivas, correspondendo a: possui API oficial; deseja conexão por leitura de QR code; adiar a decisão.
- **FR-005**: A etapa **NÃO PODE** exigir credencial, número de telefone ou qualquer dado do Meta Business Manager para ser concluída. Ela pergunta; não conecta.
- **FR-006**: A intenção declarada **DEVE** ser persistida em `OnboardingProgress.stepData` (campo `jsonb` já existente), sem nova tabela, novo modelo ou migração de schema.
- **FR-007**: A saída "possui API oficial" **DEVE** conduzir ao formulário de conexão WABA já existente, reutilizando-o. Nenhuma duplicação de campos, validação ou criptografia de token é permitida.
- **FR-008**: A saída "adiar" **DEVE** encerrar o onboarding e liberar o dashboard, sem reapresentar a etapa em sessões seguintes.
- **FR-009**: A saída "QR code" **DEVE** registrar a intenção e comunicar o estado real do canal — "em liberação, sem prazo definido" — sem prometer data, disponibilidade ou plano. Não dispara nenhum encaminhamento a comercial nem cria registro de lead; o único efeito é a gravação em `OnboardingProgress.stepData`.
- **FR-010**: O texto de todas as saídas **DEVE** deixar explícito o custo de cada caminho antes do clique (que a opção oficial exige credenciais da Meta; que a opção por QR code não está liberada). O usuário não pode descobrir a barreira só depois de escolher.
- **FR-011**: A etapa **NÃO PODE** ser exibida a usuário cuja organização já tenha `wabaEnabled` ou `evolutionEnabled` verdadeiro.
- **FR-012**: Falha ao persistir a intenção **NÃO PODE** impedir o usuário de concluir o onboarding, nem gravar um valor diferente do declarado.
- **FR-013**: A etapa **DEVE** ser navegável por teclado e anunciável por leitor de tela, com foco inicial previsível e fechamento por ESC — a implementação invoca a skill `accessibility`.
- **FR-014**: O texto final das três saídas **DEVE** passar pela skill `ux-writing` na implementação. Os rótulos citados nesta spec são descritivos, não definitivos.

### Key Entities

- **`OnboardingProgress.stepData`** (`jsonb`, existente, hoje sempre nulo) — passa a carregar a intenção declarada. Forma proposta:

  ```json
  {
    "whatsapp": {
      "intent": "waba | qr | later",
      "declaredAt": "2026-08-25T23:10:00.000Z"
    }
  }
  ```

  Chave `whatsapp` isolada para que outras etapas futuras possam coexistir no mesmo campo sem colisão. Ausência da chave significa "não declarou", que é **distinto** de `later`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Após FR-001, 100% das escolhas explícitas no welcome modal permanecem gravadas como `COMPLETED` numa amostra de verificação — hoje a taxa observada é de 12 em ~78 escolhas identificáveis.
- **SC-002**: Trinta dias após o lançamento, existe um número conhecido para "quantos dos novos cadastros querem conexão por QR code". Hoje esse número não existe em nenhuma fonte — nem no banco, nem em analytics.
- **SC-003**: A proporção de novos cadastros que passam pela etapa de intenção sem abandonar o onboarding não é menor que a taxa de engajamento atual do passo 1 (66/113 = 58%). Esta é a métrica de proteção: se a nova etapa derrubar o engajamento, a feature falhou mesmo que colete dados.
- **SC-004**: Pelo menos uma organização real chega a `wabaEnabled = true` por este caminho — hoje o valor é zero em 105 organizações e em seis meses de operação.
- **SC-005**: Nenhuma regressão no tempo de carregamento do dashboard atribuível à nova etapa.

---

## Assumptions

- O canal não oficial permanece **não oferecido publicamente** durante a vigência desta spec. A etapa apenas mede a demanda por ele; não o entrega, não o anuncia como disponível e não cria expectativa de prazo.
- Os 66 registros com `currentStep = 1` correspondem a escolhas de "Ver Demonstração". Nenhum outro ponto do código escreve esse campo, verificado por varredura em `app/`, `lib/` e `components/` em 25/08/2026.
- `OnboardingProgress.stepData` está livre: nulo em todos os registros hoje, sem leitor no código.
- A saída "QR code" (FR-009) não encaminha a comercial — decisão de produto tomada em 26/08/2026.
- A hipótese comercial que motivou esta feature — perda de negócio pela burocracia do WABA — vem de conversas de venda e permanece **não verificada por dado de produto**. Esta spec existe justamente para que ela deixe de ser não verificável, e não pressupõe que seja falsa.

---

## Fora de escopo

- Construir, contratar ou expor qualquer canal não oficial de WhatsApp. Esta spec mede demanda; não altera a oferta.
- Qualquer trabalho no gateway `whatsmeow`, na Evolution API ou em camadas de evasão de detecção.
- Redesenhar os três cartões atuais do welcome modal.
- Transformar `OnboardingProgress` no fluxo gamificado multi-etapas que os campos `badges`, `totalPoints` e `completedSteps` sugerem e que nunca foi construído.
- Corrigir o checkout do Stripe (zero assinaturas desde a migração de 07/07/2026, último pagamento registrado em 22/04/2026). É um vazamento maior e a montante deste, e merece investigação própria — sem ele, qualquer ganho de ativação desemboca num caminho de pagamento de estado desconhecido.
