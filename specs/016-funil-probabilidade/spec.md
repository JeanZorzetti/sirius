# Feature Specification: Etapa com chance de fechar e cor, previsão ponderada e temperatura no card

**Feature Branch**: `016-funil-probabilidade`

**Created**: 2026-09-27

**Status**: Implemented (PR)

**Input**: decisão do dono de 27/09/2026. O site promete probabilidade por etapa, cor de etapa, previsão valor ×
probabilidade × data, e temperatura no card.

## Pergunta que a tela responde

"Quanto deve fechar até o fim do mês, pesado pela etapa em que cada negócio está, e o que ficou de fora dessa conta?"

## User Stories

### US1 - Chance de fechar por etapa (P1)

O gestor define a chance de fechar de cada etapa. Sem definir, vale um padrão:

- 100% na etapa de ganho;
- 0% na etapa de perda;
- uma escada entre as abertas (5 abertas: 15, 35, 50, 65, 85).

O cabeçalho da coluna mostra a chance.

### US2 - Previsão ponderada (P1)

O cartão "Previsão" do analytics mostra Σ valor × chance dos negócios abertos com data de fechamento na janela. Logo
abaixo vêm o total bruto e a contagem. Os abertos sem valor ou sem data aparecem nomeados como "fora da conta".

- Dado real de 27/09: só 111 de 970 negócios abertos têm valor e data. Um número sem esse aviso pareceria completo.

### US3 - Cor de etapa (P2)

Uma paleta fechada de 6 cores com nome, mostrada como uma faixa sobre o cabeçalho. A cor não carrega informação
sozinha: o nome da etapa segue sendo o identificador.

### US4 - Temperatura no card (P2)

Uma palavra antes do fato de tempo: "quente · 3 d na etapa", "morna · 12 d na etapa", "fria · parado há 40 d".

- É a mesma contagem de dias do fato de tempo: até 7 dias, de 8 a 30 dias, mais de 30 dias. O limite de 30 é o
  mesmo "parado" da fila Hoje.
- Não aparece em negócio ganho, perdido ou com retorno vencido, que já têm um fato próprio.

## Requirements

- **FR-001**: `PipelineStage.probability` (0–100 ou nulo) e `color` (chave da paleta). A migration traz um CHECK de
  faixa.
- **FR-002**: `probabilidadeDaEtapa`, `previsaoPonderada` e `temperatura` MUST ficar numa única lib
  (`lib/pipeline/previsao.ts`), com teste.
- **FR-003**: `updateStage` MUST recusar uma chance fora de 0–100 e uma cor fora da paleta.
- **FR-004**: O diálogo "Editar etapa" MUST ter rótulos visíveis e dizer, em texto, o que a chance faz e qual é o
  padrão.

## Success Criteria

- **SC-001**: O número da previsão é igual à soma calculada à mão para a conta de teste.
- **SC-002**: Todo aberto fora da conta aparece contado na tela.
