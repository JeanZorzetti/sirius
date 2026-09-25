# Feature Specification: O pipeline abre pela fila de quem pede ação hoje

**Feature Branch**: `009-dashboard-fila-de-hoje`

**Created**: 2026-09-24

**Status**: Implemented (`e72be85`, `f10dde0`, `fb4ec18`)

**Input**: Escolha do Jean em 24/09, por imagem, na terceira folha de contato da direção de arte do `/dashboard`:
**I · Hoje**, "mas precisa de um tema claro que ressoe com a home, e o tema claro será padrão".

## Contexto

O `/dashboard` é o quadro Kanban do pipeline: a primeira tela depois do login. Ainda veste a cara herdada do gerador
(índigo, botão do assistente em gradiente roxo→azul, colunas vazias ocupando a dobra) e não conversa com a home Fluxo
(`d5b9d8c`) nem com as páginas públicas (spec 008).

**O dado real** (produção, só leitura, 24/09 20:22 UTC, 26 contas com negócio próprio, isto é, criado 5 min ou mais
depois da conta):

| O que | Real |
|---|---|
| Cartões por quadro | mediana 4 · p90 33 · máximo 274 (32 numa coluna) |
| Etapas por funil | mediana 5 · máximo 10; 81 de 140 colunas do funil padrão vazias (58%) |
| Valor | 44,6% nulo + 35,9% zero: **80,5% sem valor**. O "Total: R$ 0,00" de cada coluna afirma zero onde ninguém preencheu |
| Prazo de retorno (`dueDate`) | 90,5% sem prazo; 9,4% vencido (mediana de atraso 146 d). A urgência de hoje é só cor de borda e quase nunca aparece |
| Dias na etapa (última mudança de etapa, ou criação) | mediana 106 · p90 164 |
| Negócios de exemplo do cadastro | 247 em 45 contas, nunca apagados, indistinguíveis dos reais |
| Uso | 2 contas mexeram em algum negócio nos últimos 30 dias |

**A escolha**: três folhas, nove direções (`.art/log.json`). Oito re-vestiam o mesmo quadro; a escolhida, **Hoje**,
muda o que a tela responde primeiro: no alto, a fila dos negócios que pedem ação (retorno vencido primeiro, depois o
parado há mais tempo), com a conversa à mão; o quadro vira contexto embaixo. A folha mostrou a Hoje em banda escura
(noite azul, luz âmbar); o Jean pediu o **tema claro como padrão, ressoando com a home**. O escuro continua para quem
escolheu tema escuro.

**A pergunta da tela**: *em que etapa está cada negócio aberto deste funil, e qual deles pede ação agora?*

**Escopo**: a rota `/dashboard` (desktop e celular) e o que cobre a primeira dobra dela: o botão flutuante do
assistente muda de cor só nesta rota. **Fora**: as outras telas do app, a barra lateral e a barra inferior (herdam só
o que as variáveis de tema já alcançam), os diálogos de negócio (conteúdo intacto), a página de pipelines.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abrir o CRM e saber com quem falar primeiro (Priority: P1)

Uma vendedora de uma PME abre o Sirius de manhã. Antes de olhar o quadro, lê no alto quantos negócios pedem ação hoje e
os três primeiros em tamanho grande: o motivo ("retorno venceu", "parado na etapa"), há quantos dias, o negócio, o
contato e o valor (ou "sem valor"), com um botão para abrir a conversa e outro para abrir o negócio.

**Why this priority**: é a direção escolhida. Hoje a pergunta "com quem falo primeiro?" exige varrer todas as colunas, e
a única pista (cor de borda por prazo) existe em 9,5% dos negócios.

**Independent Test**: com uma conta que tenha negócios com retorno vencido e negócios parados há mais de 30 dias, abrir
`/dashboard` e conferir que a fila mostra a contagem certa, na ordem certa, e que os botões levam à conversa e ao
negócio.

**Acceptance Scenarios**:

1. **Given** um funil com 1 negócio de retorno vencido há 3 dias e 6 parados há 33 a 164 dias, **When** a tela abre,
   **Then** a fila diz "Pedem ação hoje: 7", o primeiro é o de retorno vencido e os seguintes vêm do mais parado ao
   menos parado.
2. **Given** um negócio da fila com contato que tem telefone, **When** a pessoa toca em "Conversar", **Then** abre a
   conversa daquele contato (o mesmo destino do botão de WhatsApp do cartão hoje).
3. **Given** um negócio da fila, **When** a pessoa toca em "Abrir", **Then** abre o diálogo de edição daquele negócio.
4. **Given** um funil sem nenhum negócio pedindo ação, **When** a tela abre, **Then** a fila diz, em texto, que nada
   pede ação hoje (e não some, nem mostra "0" solto).
5. **Given** mais de 3 negócios na fila, **When** a tela abre no desktop, **Then** os 3 primeiros aparecem grandes e o
   resto é contado ("+4 na fila") com a faixa de dias que cobre; no celular, a fila rola para o lado.

---

### User Story 2 - O quadro diz a verdade sobre cada etapa (Priority: P1)

Abaixo da fila, o quadro continua sendo o lugar de trabalho (arrastar, abrir, criar), mas cada coluna diz quantos
negócios tem, quanto somam os que têm valor e em quantos o valor foi preenchido; cada cartão diz há quantos dias está
na etapa, ou que o retorno venceu, ou que foi ganho.

**Why this priority**: sem isso a fila não tem contexto e o quadro continua afirmando R$ 0,00 onde o dado falta.

**Independent Test**: abrir um funil com colunas vazias, negócios sem valor e negócios parados, e ler cada cabeçalho e
cada cartão contra o banco.

**Acceptance Scenarios**:

1. **Given** uma etapa com 9 negócios, 2 com valor (R$ 12.000 e R$ 4.800), **When** a tela abre, **Then** o cabeçalho
   mostra 9, "R$ 16,8 mil" e "valor em 2 de 9".
2. **Given** uma etapa sem nenhum valor preenchido, **When** a tela abre, **Then** o cabeçalho diz "sem valor", nunca
   "R$ 0,00".
3. **Given** uma etapa vazia, **When** a tela abre, **Then** a coluna diz "0 negócios nesta etapa hoje", sem
   ilustração, e continua aceitando cartões arrastados.
4. **Given** um negócio com valor 15000, **When** o cartão aparece, **Then** mostra "R$ 15.000" (formato brasileiro),
   não "R$ 15000.00".
5. **Given** um negócio há 41 dias na etapa, **When** o cartão aparece, **Then** diz "parado há 41 d" e tem a marca de
   "pede ação" (forma e texto, não só cor); um há 9 dias diz "9 d na etapa".

---

### User Story 3 - A tela clara conversa com a home; a escura continua sendo a Hoje (Priority: P2)

Quem nunca escolheu tema vê a tela clara, com o gelo, o grafite, as fontes e o vermelho da home. Quem escolheu tema
escuro vê a versão da folha: noite azul e luz âmbar sobre a fila.

**Why this priority**: é a condição da escolha. Sem ela a tela entra no ar com a banda que o Jean pediu para trocar.

**Independent Test**: retratar `/dashboard` com tema claro, com tema escuro salvo e sem preferência salva.

**Acceptance Scenarios**:

1. **Given** um usuário sem preferência de tema, **When** abre `/dashboard`, **Then** vê o tema claro.
2. **Given** um usuário com tema escuro salvo, **When** abre `/dashboard`, **Then** vê a versão escura, com a mesma
   estrutura e o mesmo conteúdo.
3. **Given** qualquer um dos dois temas, **When** se mede o contraste, **Then** todo texto passa de 4,5:1 e toda marca
   que carrega informação passa de 3:1.

---

### User Story 4 - Negócio de exemplo não se passa por negócio real (Priority: P3)

Os negócios que o cadastro cria como exemplo aparecem marcados como "exemplo", no cartão e na fila.

**Why this priority**: 247 exemplos em 45 contas nunca foram apagados; numa conta nova a fila e o quadro misturariam
exemplo com negócio real.

**Independent Test**: abrir uma conta recém-criada e conferir que os negócios semeados trazem a marca.

**Acceptance Scenarios**:

1. **Given** um negócio criado até 5 minutos depois da conta, **When** aparece no quadro ou na fila, **Then** traz a
   palavra "exemplo".

### Edge Cases

- **Funil sem etapas ou conta sem funil**: o seletor de funil continua oferecendo criar um; a fila diz que não há
  negócios.
- **Negócio sem contato (27% dos reais)**: o cartão diz "sem contato"; na fila, "Conversar" fica indisponível e diz
  por quê (sem telefone), em vez de sumir.
- **Negócio sem registro de mudança de etapa**: a idade na etapa conta da criação do negócio.
- **Retorno vencido e parado ao mesmo tempo**: aparece uma vez, pelo retorno vencido.
- **Negócio ganho ou perdido**: nunca entra na fila; perdido continua na coluna "Perdido".
- **Negócio arquivado**: não entra na fila.
- **Pior caso real**: 274 negócios numa conta e 32 numa coluna; a fila mostra 3 grandes e conta o resto; as colunas
  rolam.
- **Busca e filtro ativos**: a fila segue o funil selecionado, não a busca de texto.
- **Troca de funil**: a fila recalcula para o funil novo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela MUST mostrar, acima do quadro, a fila dos negócios abertos do funil selecionado que pedem ação:
  retorno vencido (prazo de retorno anterior a hoje) ou mais de 30 dias na mesma etapa.
- **FR-002**: A fila MUST ordenar retorno vencido primeiro (do mais atrasado ao menos) e depois os parados (do mais
  antigo ao mais recente), e dizer o critério na própria tela.
- **FR-003**: Cada item grande da fila MUST mostrar o motivo, os dias, o título, o contato (ou "sem contato"), o valor
  (ou "sem valor") e as ações "Conversar" e "Abrir".
- **FR-004**: A fila MUST mostrar a contagem total; acima de 3 itens, os 3 primeiros grandes e o resto contado com a
  faixa de dias (desktop), ou rolagem lateral (celular).
- **FR-005**: Sem nenhum negócio pedindo ação, a fila MUST dizer isso em texto, ocupando o mesmo lugar.
- **FR-006**: O cabeçalho de cada coluna MUST mostrar a contagem, a soma dos valores preenchidos (ou "sem valor") e
  "valor em n de m"; quando houver, "k pedem ação".
- **FR-007**: Cada cartão MUST mostrar título, contato (ou "sem contato"), valor em formato brasileiro (ou "sem
  valor") e um fato de tempo em texto: "N d na etapa", "parado há N d", "retorno venceu há N d" ou "ganho em DD/MM".
- **FR-008**: O cartão que pede ação MUST ter uma marca de forma além da cor; a cor sozinha não carrega estado.
- **FR-009**: A coluna vazia MUST dizer "0 negócios nesta etapa hoje" em texto e continuar recebendo cartões.
- **FR-010**: O topo MUST virar uma linha só: o funil como título (com o seletor), a busca por contato, a busca por
  valor, exportar e "Novo Deal"; o filtro por nome e "Adicionar" etapa continuam acima do quadro.
- **FR-011**: O tema claro MUST usar a paleta, as fontes e o acento da home; o escuro MUST seguir a folha escolhida.
- **FR-012**: O botão flutuante do assistente MUST vestir a paleta da tela nesta rota (sem gradiente roxo→azul).
- **FR-013**: Negócios criados até 5 minutos depois da conta MUST levar a marca "exemplo".
- **FR-014**: A tela MUST respeitar `prefers-reduced-motion` (sem animação de entrada) e ser navegável por teclado
  (fila e ações alcançáveis por Tab, com foco visível).
- **FR-015**: No celular, o subtítulo da barra do topo MUST dizer o número de negócios e a soma com a cobertura, não
  "R$ 0".

### Key Entities

- **Negócio no quadro**: título, valor (pode faltar), etapa, contato (pode faltar), prazo de retorno (pode faltar),
  situação (aberto, ganho, perdido), arquivado, criação, **entrada na etapa atual** (última mudança de etapa
  registrada, ou a criação) e **exemplo** (criado até 5 min depois da conta).
- **Item da fila**: um negócio aberto, não arquivado, do funil selecionado, com o motivo (retorno vencido ou parado) e
  os dias que o justificam.
- **Resumo da etapa**: contagem, soma dos valores preenchidos, quantos têm valor, quantos pedem ação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Olhando só a tela, sem clicar, uma pessoa responde em 5 segundos "com qual negócio falo primeiro e por
  quê".
- **SC-002**: Nenhuma coluna afirma "R$ 0,00" quando o valor não foi preenchido: 0 ocorrências numa varredura dos
  funis de teste.
- **SC-003**: 100% dos cartões mostram o fato de tempo em texto; 0 estados carregados só por cor.
- **SC-004**: Contraste: 100% dos textos acima de 4,5:1 e das marcas informativas acima de 3:1, nos dois temas.
- **SC-005**: A primeira pintura da tela não piora mais de 10% contra a atual, medida lado a lado nas mesmas
  condições.
- **SC-006**: Com 6 colunas, as 6 aparecem sem rolagem lateral numa tela de 1440 px.

## Assumptions

- O limite de "parado" é 30 dias para toda etapa (provisório, o mesmo das folhas). Limite por etapa fica para depois.
- "Hoje" é o dia no fuso de Brasília.
- A barra lateral, a barra inferior e as outras telas do app não mudam nesta spec; a direção só se propaga depois de
  aprovada no ar.
- "Conversar" usa o mesmo destino do botão de WhatsApp do cartão atual (`/dashboard/chat?phone=`).
- O tema claro já é o padrão do app (`defaultTheme="light"`); nada muda para quem salvou uma preferência.
