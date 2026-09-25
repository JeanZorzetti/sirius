# Feature Specification: A área logada veste a pele do Pipeline

**Feature Branch**: `010-pele-area-logada`

**Created**: 2026-09-25

**Status**: Draft

**Input**: Pedido do Jean em 25/09: "aplicar a direção de arte em tudo dentro da área logada, na sidebar, modais e todas
as features". Escolha por imagem, depois de três folhas de contato com nove opções: **A** (a pele do Pipeline em tudo,
com cor só onde diz alguma coisa).

## Contexto

O `/dashboard` veste a direção **Hoje** desde 24/09 (spec 009): fundo gelo, tinta grafite, Schibsted Grotesk com DM Mono
nos rótulos e números, canto de 4 px, o vermelho do pulso marcando o que pede ação, e tema escuro em azul-noite com luz
âmbar. A direção ficou presa à tela do Pipeline, de propósito, até ser aprovada. O resto da área logada continua com a
direção herdada do gerador, e a própria barra lateral do Pipeline também:

| | Pipeline (Hoje) | Barra lateral, modais e as outras telas |
|---|---|---|
| Fundo e texto | gelo e grafite | cinza-azulado e preto; branco puro nos cartões |
| Acento | o vermelho do pulso, só onde pede ação | índigo no botão principal e no item ativo; roxo, violeta, azul e ciano em ícones, selos e gradientes |
| Fonte | Schibsted Grotesk; DM Mono nos rótulos | a do sistema |
| Forma | canto de 4 px, sem sombra | cantos de 10–16 px, pílulas, sombras, barra lateral flutuante com vidro desfocado e brilho índigo |
| Escuro | azul-noite com luz âmbar | cinza-ardósia com índigo claro |

Inventário de 25/09 (páginas da área logada e os componentes que elas usam, sem as pastas só públicas): **6.227 usos de
cor fixa** em **245 arquivos**, dos quais **1.427** são matizes decorativas (índigo, violeta, roxo, azul, céu, ciano,
fúcsia, rosa, verde-azulado); **119 gradientes**; **480 cores escritas em hexadecimal** em **46 arquivos**; **1.301**
variantes de tema escuro.

**A escolha foi feita por imagem** (skill `art-direction`), com as telas reais em produção e CSS injetado:

- **Primeira folha**: **A**, a pele com cor de status; **B**, monocromática; **C**, com a moldura em azul-noite.
  Resposta: "Nenhuma".
- **Segunda folha**, com estrutura nova: **D**, fila em cada tela; **E**, fichário; **F**, mesa dividida sem modal.
  Resposta: "Nenhuma".
- **Terceira folha**, com outra matéria: **G**, noite como padrão; **H**, linhas da home na barra lateral; **I**, mesa
  com papel e sombra. O Jean pediu para rever a primeira e escolheu **A**.

O registro está em `.art/log.json` e as recusas em `gosto.md`.

**Escopo: 69 rotas.** Entram todas as telas que carregam a folha de estilo do app:

- `/dashboard/*` (47 rotas);
- `/admin` e o grupo `(admin)` (13 rotas);
- o Modo IA, grupo `(ia)` (8 rotas);
- `/checkout/sucesso`.

Entram também as peças que aparecem em toda tela logada: a barra lateral, a barra inferior do celular, a barra do topo
do celular, a faixa do período de teste, o botão flutuante do assistente, e todas as camadas que abrem por cima (diálogo,
gaveta, menu, lista de opções, dica, aviso).

**Fora do escopo**:

- as páginas públicas, que já vestem a pele da home desde a spec 008;
- e-mails e arquivos exportados (PDF, planilha);
- imagens;
- a própria tela do Pipeline, que já está vestida e deve ficar igual.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - O app inteiro é o mesmo produto do Pipeline (Priority: P1)

Um vendedor abre o Pipeline, vê a fila de hoje e clica em Contatos, Tarefas, Agenda ou Configurações. A tela seguinte
tem o mesmo fundo, a mesma tinta, a mesma fonte, o mesmo botão e o mesmo canto. A barra lateral ao lado do Pipeline
deixa de ser a única coisa índigo da tela.

**Why this priority**: é o pedido. Hoje a direção aprovada existe em uma tela de 69, e a barra lateral e os modais,
que aparecem em todas, ainda são a direção herdada.

**Independent Test**: retratar uma amostra de telas (Pipeline, Contatos com o modal de criar aberto, Tarefas, Agenda,
Chat, Analytics, Produtos, Configurações, Assinatura, Automações, uma tela do admin e uma do Modo IA) em 1440 e 390 px,
lado a lado com a folha A da escolha, e varrer as telas renderizadas atrás de cor de interface fora da paleta.

**Acceptance Scenarios**:

1. **Given** qualquer tela do escopo, **When** ela abre no tema claro, **Then** o fundo é o gelo do Pipeline, o texto é
   grafite, o texto secundário é o grafite suave, os cartões são o branco-gelo do Pipeline e não há índigo, roxo,
   violeta, azul, ciano, fúcsia nem rosa na interface.
2. **Given** a barra lateral, **When** qualquer tela está aberta, **Then** ela é presa à borda, sem vidro, sem brilho e
   sem sombra, e o item ativo aparece em grafite, sem índigo.
3. **Given** o botão principal de qualquer tela, **When** ele aparece, **Then** é grafite com texto gelo, como o "Novo
   Deal" do Pipeline.
4. **Given** qualquer diálogo, gaveta, menu ou lista de opções, **When** abre, **Then** veste a mesma pele da tela e
   continua destacado do fundo (sombra só nas camadas que flutuam).
5. **Given** qualquer texto de interface, **When** aparece, **Then** usa a Schibsted Grotesk, e números tabulares,
   telefones e rótulos pequenos usam a DM Mono.

---

### User Story 2 - A cor continua dizendo alguma coisa (Priority: P1)

O vendedor bate o olho numa lista, num selo ou num gráfico e sabe o que está bem, o que pede atenção e o que atrasou ou
se perdeu, como antes. A diferença é que a cor passa a significar só isso: verde para ganho, âmbar para atenção e o
vermelho do pulso para atraso, perda e erro, todos na mesma luminosidade, sem cor usada como enfeite.

**Why this priority**: é o que separa a opção escolhida (A) da monocromática (B), recusada. Trocar 6.227 cores sem
critério apaga estados que hoje só a cor diz.

**Independent Test**: exercitar em cada tela da amostra os estados com cor (ganho/perdido, tarefa atrasada, prioridade,
conexão do WhatsApp ativa/caída, erro de formulário, aviso de limite do plano) e conferir que cada estado continua
distinguível do vizinho e que nenhuma cor aparece fora dos três significados.

**Acceptance Scenarios**:

1. **Given** um negócio ganho, uma tarefa concluída ou uma integração conectada, **When** aparece, **Then** usa o verde
   da paleta.
2. **Given** um aviso, um limite perto de acabar ou uma prioridade média, **When** aparece, **Then** usa o âmbar da
   paleta.
3. **Given** um atraso, uma perda, um erro ou uma ação destrutiva, **When** aparece, **Then** usa o vermelho do pulso e
   vem com ícone ou texto que diz o estado.
4. **Given** um gráfico com mais de uma série, **When** aparece, **Then** as séries continuam distinguíveis entre si
   usando a paleta (tons de grafite, o pulso, o verde e o âmbar), sem voltar ao azul ou ao roxo.
5. **Given** um elemento que hoje tem cor só para enfeitar (ícone de cartão, gradiente, selo de seção, avatar sem foto),
   **When** aparece, **Then** fica em tons de grafite e gelo.

---

### User Story 3 - Nada some, nada quebra (Priority: P1)

A troca é de pele. Cada tela tem o mesmo conteúdo, na mesma ordem, com os mesmos botões, e tudo continua legível e
usável pelo teclado, inclusive dentro dos modais.

**Why this priority**: a direção escolhida deixa a estrutura intacta. Trocar a paleta inteira do app é o tipo de mudança
que deixa texto grafite sobre fundo grafite ou um anel de foco invisível sem ninguém ver.

**Independent Test**: retratos antes e depois da amostra nas duas larguras; contraste medido nos textos de leitura;
passagem de teclado pela barra lateral, por um formulário de modal e por um menu.

**Acceptance Scenarios**:

1. **Given** qualquer tela do escopo, **When** comparamos antes e depois, **Then** o conteúdo, a ordem, os botões e os
   itens de navegação são os mesmos.
2. **Given** qualquer texto de leitura, nos dois temas, **When** medimos o contraste com o fundo, **Then** ele passa AA
   (4,5:1; 3:1 para texto grande).
3. **Given** qualquer elemento interativo, **When** recebe foco pelo teclado, **Then** o foco aparece como anel grafite,
   no claro, ou âmbar, no escuro, e nunca vermelho, para não parecer erro.
4. **Given** um campo de formulário com erro, **When** o erro aparece, **Then** o campo é distinguível de um campo em
   foco sem depender só da cor.

---

### User Story 4 - O tema escuro é a noite do Pipeline (Priority: P2)

Quem salvou o tema escuro vê o app inteiro em azul-noite, com a luz âmbar nos botões principais e no item ativo, como o
Pipeline no escuro. O claro continua sendo o padrão.

**Why this priority**: o escuro já existe e é escolhido por parte dos usuários. Deixá-lo em cinza-ardósia com índigo
seria manter duas direções no mesmo app.

**Independent Test**: retratos da amostra com o tema escuro salvo; contraste medido; alternância de tema sem recarregar.

**Acceptance Scenarios**:

1. **Given** um usuário com o tema escuro salvo, **When** abre qualquer tela do escopo, **Then** o fundo é o azul-noite
   do Pipeline, o texto é o gelo-quente, e o botão principal e o item ativo são âmbar.
2. **Given** um usuário sem preferência salva, **When** abre o app, **Then** vê o tema claro.

---

### User Story 5 - O app não fica mais lento (Priority: P2)

O vendedor no celular, em rede lenta, vê as telas tão cedo quanto hoje, mesmo com a fonte do Pipeline passando a valer
em todas elas.

**Why this priority**: o Pipeline já baixa as duas fontes. As outras telas passam a baixá-las também; é o único custo
novo e tem de caber.

**Independent Test**: régua da spec 009 (produção, 390×844, 4G lento 150 ms / 1,6 Mbps, CPU 4×, cache desligado,
terceiros bloqueados, mediana de 5) em Contatos, Tarefas e Pipeline, antes e depois.

**Acceptance Scenarios**:

1. **Given** Contatos, Tarefas e Pipeline, **When** medimos o LCP, **Then** ele não piora mais de 10% em relação à
   medição de antes, na mesma régua.
2. **Given** qualquer tela do escopo, **When** carrega, **Then** nenhum JavaScript novo é baixado por causa desta
   mudança.

---

### User Story 6 - Tela nova do app já nasce vestida (Priority: P3)

Quem criar uma tela ou um componente do app depois desta spec, com os componentes de sempre, tem a pele sem escolher
nada. Se escrever uma matiz decorativa fixa, a verificação do projeto avisa com o nome do arquivo.

**Why this priority**: das 6.227 cores fixas de hoje, a maior parte entrou tela a tela. Sem a guarda, a pele se desfaz.

**Independent Test**: escrever uma matiz decorativa fixa num componente de teste do app e ver a verificação falhar com
o arquivo; remover e ver passar.

**Acceptance Scenarios**:

1. **Given** um componente novo do app feito com os componentes comuns, **When** abre, **Then** está com a pele.
2. **Given** uma cor literal (hexadecimal, rgb, hsl) num arquivo do app, fora das exceções de marca e de dado do
   usuário, **When** a verificação roda, **Then** ela falha e diz o arquivo.
3. **Given** uma classe de cor fixa em índigo, roxo ou azul num componente novo, **When** ele abre, **Then** desenha em
   tons de grafite, como o resto.

### Edge Cases

- **A tela do Pipeline** já está vestida: fila, quadro e as duas variantes de tema devem ficar idênticos a antes.
- **Cores que são dado, não interface**: a cor que o usuário escolhe para etapa, etiqueta ou segmento, e as fotos de
  perfil e as mídias do chat, não mudam.
- **Marcas de terceiros**: o verde do WhatsApp, o Instagram e os logos de integração (Google, Meta, n8n, Omie) mantêm a
  cor da marca quando representam a marca, não a interface.
- **O chat do WhatsApp**: os balões e a lista de conversas vestem a pele. O verde fica só no ícone e no botão de
  "Suporte WhatsApp", que representam a marca.
- **Erro vs. destaque**: o vermelho do pulso marca atraso e perda na fila; erro de formulário e ação destrutiva usam o
  mesmo vermelho, então precisam de ícone e texto, não só de cor.
- **Pílulas**: selos e fichas perdem a forma de pílula e ficam com canto de 4 px. Avatar, ponto de status e interruptor
  continuam redondos.
- **Gráficos com muitas séries** (mais de cinco): a paleta define a ordem das cores, e a partir da sexta série a
  distinção vem de rótulo direto, não de mais cor.
- **Modo IA**: tinha identidade própria (ciano e violeta). Passa a vestir a pele. A marca própria da área `/IA`
  continua pendente em outro trabalho.
- **As páginas públicas** carregam outra folha de estilo e não podem mudar.
- **Camadas abertas a partir de uma tela pública** (quando houver) seguem a pele pública, não a do app.
- **Navegador sem OKLCH**: as cores têm alternativa equivalente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Toda tela do escopo MUST usar, no tema claro, a paleta do Pipeline: fundo gelo, cartão branco-gelo, texto
  grafite, texto secundário grafite suave, fios para separar, botão principal grafite com texto gelo.
- **FR-002**: Nenhuma tela do escopo MUST desenhar índigo, violeta, roxo, azul, céu, ciano, fúcsia ou rosa como cor de
  interface (fundo, texto, borda, ícone, botão, selo, link, gradiente, brilho). Dado do usuário, imagens e marcas de
  terceiros ficam de fora.
- **FR-003**: A cor cromática MUST aparecer só com significado: verde para ganho, sucesso e conectado; âmbar para
  atenção e limite; vermelho do pulso para atraso, perda, erro e ação destrutiva. Os três na mesma luminosidade.
- **FR-004**: O texto MUST usar a Schibsted Grotesk; números tabulares, telefones, rótulos pequenos e metadados MUST
  usar a DM Mono.
- **FR-005**: Botões, cartões, campos, selos e camadas MUST ter canto de 4 px; nenhuma pílula (avatar, ponto e
  interruptor continuam redondos).
- **FR-006**: Nada no escopo MUST ter sombra, vidro desfocado, brilho decorativo ou gradiente, exceto a sombra que
  separa as camadas que flutuam (diálogo, gaveta, menu, lista de opções, aviso).
- **FR-007**: A barra lateral MUST ficar presa à borda da tela, sem vidro, sem brilho e sem sombra, com o item ativo em
  grafite, no claro, e âmbar, no escuro.
- **FR-008**: O anel de foco MUST ser grafite no claro e âmbar no escuro, visível em todo elemento interativo, e nunca
  vermelho.
- **FR-009**: No tema escuro, toda tela do escopo MUST usar a noite do Pipeline: fundo azul-noite, texto gelo-quente,
  botão principal e item ativo âmbar.
- **FR-010**: O tema claro MUST continuar sendo o padrão, e a preferência de tema salva MUST continuar valendo.
- **FR-011**: Cada tela MUST manter o conteúdo, a ordem, os botões e os itens de navegação de hoje. Só a pele muda.
- **FR-012**: A tela do Pipeline e as páginas públicas MUST ficar visualmente idênticas a antes. Única exceção: o anel de
  foco do Pipeline passa de vermelho a grafite, pela mesma razão do FR-008.
- **FR-013**: Todo texto de leitura MUST passar contraste AA nos dois temas.
- **FR-014**: Estados de erro, sucesso, atraso e perda MUST continuar reconhecíveis sem depender só da cor.
- **FR-015**: Gráficos MUST manter as séries distinguíveis entre si usando só a paleta.
- **FR-016**: Esta mudança MUST NOT acrescentar JavaScript às telas.
- **FR-017**: O projeto MUST ter uma verificação automática que falha, com o nome do arquivo, quando um arquivo do app
  escreve uma cor literal fora da paleta (fora das exceções de marca e de dado do usuário), e quando alguma matiz da
  paleta fica sem a pele.

### Key Entities

- **Paleta do Pipeline**: gelo, painel (um degrau abaixo), cartão, grafite, grafite suave, fio e fio forte, pulso e
  pulso de texto; no escuro, noite, painel noturno, gelo-quente e âmbar. Já existe, presa à tela do Pipeline. Passa a
  valer para toda a área logada.
- **Cores de significado**: verde (ganho), âmbar (atenção) e pulso (atraso, perda, erro), na mesma luminosidade da
  paleta.
- **Tipografia do Pipeline**: Schibsted Grotesk e DM Mono, já baixadas pelo Pipeline.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Na amostra de telas renderizadas, nos dois temas, **zero** elementos de interface visíveis com matiz
  decorativa: croma acima de 0,04 fora das faixas do verde, do âmbar e do pulso. A varredura é automática e exclui
  imagens, dado do usuário e marcas de terceiros.
- **SC-002**: Nos retratos antes e depois da amostra, em 1440 e 390 px, **zero** conteúdo sumido, cortado ou
  sobreposto, e o mesmo número de botões e links por tela.
- **SC-003**: **100%** dos textos de leitura da amostra passam AA nos dois temas; **100%** dos elementos interativos
  têm foco visível na passagem de teclado.
- **SC-004**: Na amostra, cada estado com cor (ganho, atenção, atraso, perda, erro) é distinguível do vizinho e vem com
  ícone ou texto.
- **SC-005**: LCP de Contatos, Tarefas e Pipeline no máximo **10% acima** da medição de antes, na régua da 009;
  **0 kb** de JavaScript novo.
- **SC-006**: Pipeline e uma amostra de páginas públicas (home, `/pricing`, `/blog`): retratos de antes e depois
  **iguais**.
- **SC-007**: A verificação de cor falha num arquivo de teste do app com uma cor literal fora da paleta e passa no
  repositório depois da mudança.

## Assumptions

- **Admin e Modo IA entram** porque carregam a mesma folha de estilo do app e o pedido foi "tudo dentro da área
  logada". São telas internas; nelas vale o mesmo critério (nada some, nada quebra) e não há ajuste fino além disso.
- **A estrutura das telas não muda.** Mudanças de hierarquia (fila em cada tela, fichário, mesa dividida) foram
  propostas e recusadas nesta rodada.
- **O verde do botão "Suporte WhatsApp"** fica, dentro da paleta, porque representa a marca do WhatsApp (estava assim
  na folha A escolhida).
- **Cores escritas em hexadecimal** que desenham gráfico ou interface entram no escopo; as que são dado (cor de etapa
  escolhida pelo usuário, cor de marca) ficam.
- **Defeitos vistos na folha e fora do escopo** vão para o handoff:
  - o subtítulo do "Criar contato" mostra a chave `components.contacts.addContactDesc`;
  - o botão "Suporte WhatsApp" fica cortado com a barra lateral fechada.
- **A medição de desempenho** usa a régua de produção da 009, porque a máquina local não roda o build standalone.
