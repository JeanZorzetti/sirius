# Feature Specification: As páginas públicas vestem a pele da home

**Feature Branch**: `008-fluxo-skin-public-pages`

**Created**: 2026-09-24

**Status**: Implemented

**Input**: Escolha do Jean em 24/09, por imagem: opção **B** da folha A/B/C sobre `/pricing` e `/blog` (a pele da
direção Fluxo em todas as páginas públicas, com a diagramação de cada página intacta).

## Contexto

A home ganhou a direção de arte **Fluxo** em 23/09 (`d5b9d8c`), aprovada pelo Jean. Ela foi construída isolada no
próprio grupo de rotas, com as cores, as fontes e o espaçamento presos a ela, para poder ser descartada sem mexer
no resto do site, como aconteceu com a "Carta de Bayer" no mesmo dia. Depois da aprovação, ninguém estendeu a
direção. A marca (wordmark e pingos) foi aplicada em todo o site em 24/09 (`49e7466`), mas a marca é só o logo.

Hoje, quem sai da home e clica em Preços ou Blog cai em outro site:

| | Home (Fluxo) | As outras 38 páginas públicas |
|---|---|---|
| Fundo e texto | gelo e grafite | branco/cinza do tema herdado; `/pricing`, `/anuario` e `/register` **escuras** inteiras |
| Acento | um só: o vermelho do pulso | azul nos botões, roxo nos selos, gradientes azul→roxo→rosa, verde nos checks |
| Fonte | Schibsted Grotesk; DM Mono nos rótulos | a do sistema |
| Forma | canto de 4 px, sem sombra | pílulas, cantos de 12–16 px, sombras, manchas coloridas desfocadas ("aurora") no `/blog` |

Inventário de 24/09: **38 rotas** no grupo `(marketing)`; **398 usos de cor fixa** (roxo, violeta, índigo, azul,
fúcsia, rosa, céu, ciano) em **28 arquivos** entre as páginas e os componentes de marketing e do blog. Além das 3
páginas escuras, **22 das 38** páginas têm variantes de tema escuro (`dark:`), que aparecem para quem salvou o tema
escuro no app, porque a preferência de tema do app vale também nas páginas públicas.

**A escolha foi feita por imagem** (processo da skill `art-direction`): três versões de `/pricing` e `/blog` no ar,
com CSS injetado, em desktop e celular. **A** = como está; **B** = a pele da home, diagramação intacta; **C** = B +
a abertura da home em cada página (título grande à esquerda e as linhas penteadas embaixo). O Jean escolheu **B**. As
linhas continuam sendo da home. Registro em `.art/log.json`.

**Escopo — as 38 rotas do grupo `(marketing)`**: `/about`, `/anuario`, `/blog`, `/blog/[slug]`,
`/blog/categoria/[category]`, `/blog/planilha-controle-comissao-corretor`, `/changelog`, `/community`,
`/complete-profile`, `/contact`, `/design-system`, `/download`, `/features`, `/features/[slug]`, `/ferramentas` e as 6
calculadoras, `/followup`, `/forgot-password`, `/help`, `/help/[categoria]/[slug]`, `/indique`, `/login`, `/pricing`,
`/privacy`, `/proposta`, `/r/[code]`, `/register`, `/reset-password`, `/solucoes`, `/solucoes/[slug]`,
`/solucoes/cidade/[slug]`, `/terms`, `/vendas-automaticas`. Mais o 404 e as páginas de erro públicas.
**Fora**: a home (já é Fluxo) e o app (`dashboard`, `admin`, `(ia)`, `checkout`, `debug`, `auth/*`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quem sai da home continua no mesmo site (Priority: P1)

Um gerente comercial chega pela home, gosta do que vê e clica em Preços, Blog ou numa solução para o segmento dele.
A página seguinte tem o mesmo fundo, o mesmo texto, a mesma fonte, o mesmo botão e o mesmo vermelho como único
destaque. Ele não se pergunta se ainda está no Sirius.

**Why this priority**: é o pedido. A home foi aprovada e as páginas que o SEO traz (blog, soluções, calculadoras,
preços) são a maior parte das entradas; hoje cada uma parece outro produto.

**Independent Test**: retratar a home e uma amostra das páginas (`/pricing`, `/blog`, um post, `/solucoes/[slug]`,
uma calculadora, `/login`, `/register`, `/anuario`) em 1366 e 390 px, lado a lado com a folha B da escolha, e
varrer as páginas por cor de interface fora da paleta.

**Acceptance Scenarios**:

1. **Given** qualquer página do escopo, **When** ela abre, **Then** o fundo é o gelo da home, o texto é grafite, o
   texto secundário é o grafite suave, e o único acento cromático é o vermelho do pulso.
2. **Given** qualquer botão principal, **When** ele aparece e quando o ponteiro passa sobre ele, **Then** ele é grafite
   com texto gelo e fica vermelho-escuro sob o ponteiro, como na home.
3. **Given** `/pricing`, `/anuario` e `/register`, **When** abrem, **Then** estão claras como as demais.
4. **Given** o `/blog`, **When** abre, **Then** não há manchas coloridas, gradientes nem pílulas; selos e categorias
   usam a letra de rótulo da home.
5. **Given** um visitante logado que escolheu o tema escuro no app, **When** ele abre uma página pública, **Then** ela
   está clara, como a home já fica.

---

### User Story 2 - Nada some, nada quebra (Priority: P1)

A troca é de pele. O visitante encontra na página o mesmo conteúdo, na mesma ordem, com os mesmos links e o mesmo
menu, e consegue ler e usar tudo, com teclado inclusive.

**Why this priority**: a direção escolhida (B) promete a diagramação intacta. Trocar cor fixa em 28 arquivos é o
tipo de mudança que apaga um texto (grafite sobre grafite) ou esconde um estado sem ninguém ver.

**Independent Test**: para cada página da amostra, retrato antes e depois nas duas larguras e passagem de teclado;
contraste medido nos textos de leitura; os estados das calculadoras e dos formulários (erro, sucesso, carregando)
exercitados.

**Acceptance Scenarios**:

1. **Given** qualquer página do escopo, **When** comparamos antes e depois, **Then** o conteúdo, a ordem das seções,
   os links e o menu (com os dropdowns de funcionalidades, soluções e ferramentas) são os mesmos.
2. **Given** qualquer texto de leitura, **When** medimos o contraste com o fundo, **Then** ele passa AA (4,5:1; 3:1
   para texto grande).
3. **Given** qualquer elemento interativo, **When** ele recebe foco pelo teclado, **Then** o foco é visível.
4. **Given** um formulário (login, cadastro, contato, recuperação de senha), **When** um campo tem erro ou o envio dá
   certo, **Then** o estado continua reconhecível sem depender só da cor.
5. **Given** uma calculadora de ROI, **When** o resultado aparece, **Then** os números e o gráfico continuam legíveis
   e distinguíveis entre si.

---

### User Story 3 - A página não fica mais lenta (Priority: P2)

O visitante no celular, em rede lenta, vê a primeira pintura tão cedo quanto hoje, mesmo com a fonte da home
passando a ser baixada em todas as páginas.

**Why this priority**: as specs 005, 006 e 007 compraram o tempo de carregamento destas páginas byte a byte; a fonte
é o único custo novo e precisa caber no que já foi ganho.

**Independent Test**: mesma régua da 007 (build de produção local, 4G lento 150 ms / 1,6 Mbps, CPU 4×, 390×844,
mediana de 3) em `/`, `/pricing` e `/blog`, antes e depois.

**Acceptance Scenarios**:

1. **Given** `/pricing` e `/blog`, **When** medimos o LCP, **Then** ele não piora mais de 10% em relação à medição de
   antes desta spec, na mesma régua.
2. **Given** qualquer página do escopo, **When** carrega, **Then** nenhum JavaScript novo é baixado por causa desta
   mudança.

---

### User Story 4 - A página pública nova já nasce vestida (Priority: P3)

Quem criar uma página pública depois desta spec não precisa escolher cor, fonte nem botão: usando os componentes de
sempre, ela sai com a pele da home. Se alguém escrever uma cor fixa fora da paleta, a verificação do projeto avisa.

**Why this priority**: sem isso a pele se desfaz em algumas semanas. Das 398 cores fixas de hoje, a maior parte
entrou página a página.

**Independent Test**: criar uma página de teste no grupo com os componentes comuns e ver que ela sai com a pele;
escrever nela uma cor fixa fora da paleta e ver a verificação falhar com o nome do arquivo.

**Acceptance Scenarios**:

1. **Given** uma página nova no grupo `(marketing)` feita com os componentes de sempre, **When** abre, **Then** está
   com a pele da home.
2. **Given** uma cor de interface fora da paleta escrita numa página ou componente público, **When** a verificação do
   projeto roda, **Then** ela falha e diz o arquivo.

### Edge Cases

- **Imagens e fotos** (capas do blog, prints do produto, fotos das soluções) não mudam, mesmo quando têm roxo ou azul.
- **Marcas de terceiros**: o verde do WhatsApp e ícones de redes sociais podem manter a cor da marca deles quando
  representam a marca, não a interface.
- **Conteúdo dos posts**: caixas de destaque, tabelas e citações dentro do texto dos artigos vestem a mesma pele.
- **Gráficos das calculadoras** precisam de mais de uma cor para separar séries; a pele define quais (grafite, pulso e
  tons de grafite), sem voltar ao azul/roxo.
- **Erro vs. destaque**: o vermelho da marca já é o acento; mensagens de erro precisam continuar distintas de um
  destaque (ícone e texto, não só cor).
- **Componentes compartilhados com o app** (botão, cartão, campo, menu suspenso): a pele não pode vazar para o
  dashboard.
- **O rodapé** é o mesmo na home e nas outras páginas; ele já veste a pele na home e deve ficar igual nas duas.
- **Página que imprime** (proposta, termos): a impressão continua legível.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Toda página do escopo MUST usar a paleta da home: fundo gelo, texto grafite, texto secundário grafite
  suave, fios (linhas finas) para separar, e o vermelho do pulso como único acento cromático.
- **FR-002**: Nenhuma página do escopo MUST desenhar roxo, violeta, índigo, azul, fúcsia, rosa, céu ou ciano como cor
  de interface (fundo, texto, borda, botão, selo, link, gradiente, mancha). Imagens e marcas de terceiros ficam de fora.
- **FR-003**: O texto MUST usar a fonte de texto da home (Schibsted Grotesk), e os rótulos pequenos (selos,
  categorias, metadados, contadores) a fonte de rótulo (DM Mono).
- **FR-004**: O botão principal MUST ser grafite com texto gelo e ficar vermelho-escuro sob o ponteiro; o secundário
  MUST ser contorno fino sobre o fundo, como o "Já tenho conta" da home.
- **FR-005**: Botões, cartões, selos e campos MUST ter canto de 4 px; nenhuma pílula.
- **FR-006**: As páginas do escopo MUST NOT ter sombra, desfoque de fundo, mancha decorativa ou gradiente.
- **FR-007**: `/pricing`, `/anuario` e `/register` MUST ficar claras, como as demais.
- **FR-008**: As páginas do escopo MUST ficar claras independentemente do tema salvo no app ou do tema do sistema.
- **FR-009**: Cada página MUST manter o conteúdo, a ordem das seções, os links e o menu completo de hoje. Só a pele muda.
- **FR-010**: A home e o app MUST ficar visualmente idênticos a antes.
- **FR-011**: Todo texto de leitura MUST passar contraste AA, e todo elemento interativo MUST ter foco visível.
- **FR-012**: Estados de erro e de sucesso MUST continuar reconhecíveis sem depender só da cor.
- **FR-013**: Esta mudança MUST NOT acrescentar JavaScript às páginas públicas.
- **FR-014**: O projeto MUST ter uma verificação automática que falha, com o nome do arquivo, quando uma página ou
  componente público usa cor de interface fora da paleta.

### Key Entities

- **Paleta da home**: gelo (fundo), grafite (texto e botão), grafite suave (texto secundário), fio e fio forte
  (separadores), pulso e pulso escuro (o acento). Já existe, presa à home; passa a valer para o grupo público.
- **Tipografia da home**: Schibsted Grotesk (texto) e DM Mono (rótulos). Já baixadas pela home.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Nas 38 rotas do escopo, **zero** elementos de interface visíveis com cor fora da paleta (varredura
  automática da página renderizada, imagens e marcas de terceiros excluídas).
- **SC-002**: **3 de 3** páginas que eram escuras (`/pricing`, `/anuario`, `/register`) abrem claras, também para quem
  salvou o tema escuro.
- **SC-003**: Nos retratos antes/depois da amostra, em 1366 e 390 px, **zero** conteúdo sumido, cortado ou sobreposto,
  e o mesmo número de links por página.
- **SC-004**: **100%** dos textos de leitura da amostra passam AA; **100%** dos elementos interativos têm foco visível
  na passagem de teclado.
- **SC-005**: LCP de `/pricing` e `/blog` no máximo **10% acima** da medição de antes, na régua da 007; **0 kb** de
  JavaScript novo.
- **SC-006**: Home e app: retratos de antes e depois **iguais**.
- **SC-007**: A verificação de cor falha numa página de teste com uma cor fora da paleta, e passa no repositório depois
  da mudança.
- **SC-008**: Olhando lado a lado a home e 3 páginas quaisquer do escopo, o Jean reconhece o mesmo site (a mesma
  pergunta da folha A/B/C, respondida com "sim").

## Assumptions

- A direção está decidida: é a **B** da folha de 24/09. Esta spec não reabre a direção, só a aplica.
- As linhas penteadas e a animação ficam **só na home** (a C foi recusada).
- O menu completo fica, com os dropdowns: ele leva links internos a soluções, calculadoras e recursos em todas as
  páginas, e cortar isso enfraquece o SEO dessas páginas. Muda só a pele.
- As páginas públicas deixam de ter tema escuro. A home já não tem, e o tema escuro continua valendo no app.
- Imagens, capas, prints e ícones de marcas de terceiros não são recoloridos.
- A régua de desempenho é a da 007; o número de antes é medido de novo no começo desta spec, na mesma máquina, em vez
  de reaproveitar o de 24/09 (o ruído de rede entre dias é maior que a margem).
- As imagens de compartilhamento (OG) já usam a marca e não entram aqui.
