# Data Model: spec 009

Nenhuma tabela nova, nenhuma migration. Dois campos derivados no servidor e três estruturas calculadas no render.

## PipelineDeal (serializado por `DashboardTabsWrapper`) — campos novos

| Campo | Tipo | Origem |
|---|---|---|
| `stageEnteredAt` | `string` (ISO) | máx. `Activity.createdAt` com `type = 'STAGE_CHANGE'` do negócio; senão `Deal.createdAt` |
| `exemplo` | `boolean` | `Deal.createdAt <= Organization.createdAt + 5 min` |
| `wonAt` | `string \| null` (ISO) | `Deal.wonAt` (já existe no schema; passa a ser serializado) |

## FatoDeTempo (calculado, `lib/pipeline/hoje.ts`)

`{ tipo: 'etapa' | 'parado' | 'retorno' | 'ganho' | 'perdido', dias: number | null, frase: string }`

| tipo | quando | frase |
|---|---|---|
| `ganho` | `status = WON` | `ganho em DD/MM` (`wonAt`; sem ele, `ganho`) |
| `perdido` | `status = LOST` | `perdido · <motivo>` ou `perdido` |
| `retorno` | aberto e `dueDate` antes de hoje | `retorno venceu há N d` |
| `parado` | aberto, dias na etapa > 30 | `parado há N d` |
| `etapa` | o resto | `N d na etapa` (`hoje na etapa` com 0) |

## Pede ação

Aberto (`ACTIVE`), não arquivado, e `tipo` ∈ {`retorno`, `parado`}.

## Fila

Os que pedem ação no funil selecionado, ordenados: `retorno` antes de `parado`; dentro de cada um, mais dias primeiro.

## ResumoEtapa

`{ n, comValor, soma, pedemAcao }` sobre os negócios da coluna (perdidos excluídos das colunas, como hoje).
