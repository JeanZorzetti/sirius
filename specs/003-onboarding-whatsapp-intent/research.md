# Research — Intenção de WhatsApp no onboarding

Sem "NEEDS CLARIFICATION" pendente no Technical Context: a feature é 100% interna a um codebase já mapeado na spec (evidência em `spec.md`) e no handoff de 25/08. As decisões abaixo resolvem os pontos de design que restavam.

## Onde a nova etapa se encaixa no fluxo

**Decisão**: a etapa de intenção é renderizada pelo mesmo `WelcomeModal`/`OnboardingWrapper`, como uma segunda "tela" trocada por estado local (`useState`) após `handleChoice` concluir — não é um modal separado nem uma rota própria.

**Motivo**: os três cartões já vivem num `Dialog` (`welcome-modal.tsx`). Abrir um segundo `Dialog` empilhado exigiria coordenar dois componentes montados via `OnboardingWrapper`; trocar o conteúdo do mesmo `Dialog` por uma flag de etapa (`step: 'choice' | 'intent'`) é o menor diff e reaproveita o `Dialog` já acessível (foco, ESC, `onOpenChange`) citado em FR-013.

**Alternativas consideradas**: rota dedicada (`/onboarding/whatsapp-intent`) — rejeitada por exigir navegação inteira e SSR extra para uma pergunta de 3 botões; segundo `Dialog` — rejeitada por duplicar a lógica de foco/ESC que o primeiro já resolve.

## Onde persistir a intenção

**Decisão**: estender `POST /api/onboarding/complete` para aceitar um campo opcional `intent: 'waba' | 'qr' | 'later'` no corpo, e mesclar em `stepData.whatsapp` via `upsert` (o mesmo upsert que já grava `status`).

**Motivo**: FR-006 proíbe nova tabela/migração; a rota já faz `prisma.onboardingProgress.upsert` por `userId`. Criar uma segunda rota (`/api/onboarding/whatsapp-intent`) duplicaria o upsert e o carregamento de `user.organizationId` que a rota atual já resolve.

**Alternativas consideradas**: rota nova — rejeitada por duplicação; gravação direto do client via Prisma — inviável (client component, sem acesso a Prisma).

## Gate de exibição (FR-011)

**Decisão**: `app/[locale]/dashboard/page.tsx` passa a selecionar `organization.wabaEnabled` e `organization.evolutionEnabled` junto do restante do `select` já existente, e repassa um booleano `hasWhatsApp` para `OnboardingWrapper` → `WelcomeModal`. Quando `true`, `handleChoice` pula direto para `window.location.href` sem montar a etapa de intenção.

**Motivo**: o `select` do Prisma já é montado nesse arquivo para outros campos; adicionar duas colunas booleanas é uma linha, sem query extra.

## Reuso do formulário WABA (FR-007)

**Decisão**: a saída "possui API oficial" só grava `intent: 'waba'` e navega para `/dashboard/settings/integrations/whatsapp-official` — a página existente, com seu próprio gate de tier (`BUSINESS` ou `wabaGrandfathered`) intacto.

**Motivo**: a página já existe, já valida tier e já teria o comportamento de redirecionar para `/upgrade` se a organização não tiver acesso — reaproveitar é literal, não adaptação. Nenhum código novo de formulário.

**Nota**: o gate de tier da página (`BUSINESS`/`wabaGrandfathered`) é mais restritivo que o do endpoint de settings (`PRO`/`BUSINESS`) — inconsistência pré-existente, fora do escopo desta feature (não mencionada em nenhum FR).

## Leitura para US3 (objeção vira número)

**Decisão**: script standalone (`scripts/whatsapp-intent-report.ts`, no padrão de `scripts/audit-dead-code.js` já existente no repo) que roda uma query Prisma agrupando `OnboardingProgress` por `stepData->whatsapp->>intent`, excluindo `organization.isTestAccount`. Não é uma rota de API — SC-002 pede "um número conhecido", não um endpoint público.

**Motivo**: FR não pede painel nem API; US3 é para quem toma decisão de produto rodar sob demanda. Um script é o menor artefato que satisfaz o teste de aceitação ("é possível obter, por consulta ao banco").
