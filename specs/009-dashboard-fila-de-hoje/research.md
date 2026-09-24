# Research: spec 009

## R1 · De onde vem "dias na etapa"

- **Decisão**: última `Activity` com `type = 'STAGE_CHANGE'` do negócio; sem nenhuma, `Deal.createdAt`.
- **Por quê**: `STAGE_CHANGE` é gravado nos três caminhos que movem negócio (`app/[locale]/dashboard/actions.ts` ×2,
  `app/[locale]/dashboard/deals/actions.ts`, `app/api/v1/deals/[id]/stage/route.ts`). Em produção, 276 dos 619 negócios
  próprios abertos têm registro; os outros nunca mudaram de etapa (ou mudaram antes do registro existir — nesse caso a
  idade sai maior que a real, e o erro é para o lado de "pede ação", que é o lado seguro).
- **Descartado**: `Deal.updatedAt` — muda com qualquer edição (valor, nota), não com a etapa.
- **Consulta**: `activity.groupBy({ by: ['dealId'], where: { type: 'STAGE_CHANGE', deal: { organizationId } }, _max: { createdAt } })`,
  uma consulta por carga, em paralelo com as que já existem.

## R2 · O que é "exemplo"

- **Decisão**: negócio criado até 5 minutos depois de `Organization.createdAt`.
- **Por quê**: é a definição que o Jean fechou para ativação em 22/09 (spec 053 do roihub): toda conta nova nasce com
  deals e contatos de exemplo no mesmo minuto (`lib/pipeline-defaults.ts`, `DEMO_DEALS`). Não há coluna que marque.
- **Descartado**: casar pelo título de `DEMO_DEALS` — quebra quando o usuário renomeia o exemplo.

## R3 · "Hoje" e o dia corrido

- **Decisão**: diferença em dias de calendário no fuso `America/Sao_Paulo`, calculada com `Intl.DateTimeFormat`.
- **Por quê**: o componente renderiza no servidor (UTC) e no navegador; o dia de calendário no mesmo fuso dá o mesmo
  número nos dois, sem erro de hidratação, e "retorno venceu" vira no mesmo instante para todos.

## R4 · Escopo do tema

- **Decisão**: `data-tela="hoje"` no invólucro da página; tokens claros no seletor, escuros em `.dark [data-tela="hoje"]`;
  as variáveis do shadcn remapeadas em `:root:has([data-tela="hoje"])` para os portais (diálogos, menus) seguirem.
- **Por quê**: `app/theme.css` desliga a variante `dark:` em qualquer página com `[data-art]` (para as páginas públicas
  serem sempre claras). Com `data-art` aqui, o tema escuro salvo sumiria.

## R5 · Dinheiro compacto

- **Decisão**: `formatCurrency` de `lib/format.ts` com `notation: 'compact'` para somas ("R$ 16,8 mil") e sem casas
  para o cartão ("R$ 15.000").
- **Por quê**: o cartão hoje escreve `R$ 15000.00` (`toFixed`); o `lib/format.ts` já é o formatador único do repo.

## R6 · Limite de "parado"

- **Decisão**: 30 dias, igual para toda etapa, numa constante nomeada.
- **Por quê**: é o limite das folhas escolhidas; a mediana real é 106 d, então um limite maior esconderia quase nada e
  um menor acenderia quase tudo. Limite por etapa (como o "rotting" do Pipedrive) fica para spec futura.
