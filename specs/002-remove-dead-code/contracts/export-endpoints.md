# Contrato — rotas de exportação

**Feature**: `002-remove-dead-code` | **Atende**: FR-011, US4 | **História**: US4

As 4 rotas **já existem e não mudam**. Este documento registra o contrato como ele é hoje, verificado no código em 22/08/2026, porque a US4 é uma história de UI construída em cima dele. Se a implementação precisar alterar qualquer linha abaixo, deixou de ser história de UI e precisa voltar para a spec.

## Endpoints

| Método | Rota | Content-Type | Nome do arquivo |
|---|---|---|---|
| `GET` | `/api/export/deals/xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `oportunidades-AAAA-MM-DD.xlsx` |
| `GET` | `/api/export/deals/pdf` | `application/pdf` | `oportunidades-AAAA-MM-DD.pdf` |
| `GET` | `/api/export/contacts/xlsx` | (mesmo do xlsx acima) | `contatos-AAAA-MM-DD.xlsx` |
| `GET` | `/api/export/contacts/pdf` | `application/pdf` | `contatos-AAAA-MM-DD.pdf` |

Todas respondem `Content-Disposition: attachment`, ou seja, o download é do navegador. **A UI não precisa de `fetch` nem de blob**: um link comum resolve.

## Entrada

**Nenhum parâmetro.** As rotas não leem query string, corpo nem header além da sessão. É por isso que o cenário US4-1 foi emendado (ver [research.md R5](../research.md#r5--as-rotas-de-export-não-aceitam-filtro-emenda-ao-cenário-us4-1)): não existe como respeitar filtro de tela sem mudar o backend, e mudar o backend está fora do escopo desta história.

O rótulo do botão precisa dizer a verdade sobre isso. "Exportar tudo" descreve o comportamento; "Exportar" sozinho, numa tela com filtro aplicado, promete o que a rota não faz.

## Escopo dos dados

| Rota | Filtro no banco |
|---|---|
| `deals` (xlsx e pdf) | `where: { userId: session.user.id }` |
| `contacts` (xlsx e pdf) | `where: { organizationId: session.user.organizationId }` |

A divergência é preservada de propósito. Deals é mais restritivo que a tela, o que satisfaz o cenário US4-3 (isolamento entre organizações) com folga. Uniformizar seria mudança de comportamento numa história de UI.

## Respostas de erro

| Situação | Resposta |
|---|---|
| Sem sessão | `401`, via `apiError(ERR.UNAUTHORIZED)` |
| Erro na geração | `500`, via `apiError(ERR.INTERNAL_ERROR)`, com log em `logger.error` |
| **Lista vazia** | **Não tratada** — hoje devolve `200` com um arquivo vazio |

O cenário US4-4 exige mensagem clara em vez de arquivo vazio. Como o backend não muda, isso é resolvido **na UI**: quando a listagem não tem registros, o botão fica desabilitado com a explicação do porquê, e o clique não chega a acontecer. É a solução mais barata e a única que não exige tocar nas rotas.

## O que a US4 entrega

1. Um controle de exportação na listagem de deals e na de contatos, oferecendo os dois formatos.
2. Estado desabilitado, com explicação, quando a listagem está vazia.
3. Nada mais. Sem tela de configuração de exportação, sem seleção de colunas, sem agendamento, sem histórico de exportações.

## Preservação

Estas 4 rotas constam do Anexo B da auditoria como "sem chamador" — e é verdade, era esse o problema. A partir da US4 elas passam a ter chamador de verdade, e o scanner deixa de listá-las **sem precisar de entrada na allowlist**. Nenhuma delas pode ser apagada na US5 (FR-011).
