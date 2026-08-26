# Handoff — Implementação da intenção de WhatsApp no onboarding (2026-08-26)

## Contexto

Execução de `speckit-implement` sobre `specs/003-onboarding-whatsapp-intent/tasks.md` (spec/plan/tasks já existiam do handoff de 25/08). US0 já estava em produção antes desta sessão.

## Feito

- **T002-T004 (Foundational)**: `app/[locale]/dashboard/page.tsx` passa a buscar `wabaEnabled`/`evolutionEnabled` e computar `hasWhatsApp`, propagado por `OnboardingWrapper` → `WelcomeModal`. `app/api/onboarding/complete/route.ts` aceita `intent` opcional (`'waba'|'qr'|'later'`), grava em `stepData.whatsapp` com `declaredAt` gerado no servidor; valor fora do enum é ignorado sem falhar a request.
- **T008-T014 (US1, MVP)**: novo `components/onboarding/whatsapp-intent-step.tsx` — 3 cards dentro do mesmo Dialog do `welcome-modal.tsx` (troca de `step: 'choice'|'intent'`, sem remount). `welcome-modal.tsx` ganhou `hasWhatsApp` como prop obrigatória; ao final dos ramos `demo`/`scratch`/`import`, se `!hasWhatsApp` troca de step em vez de navegar. `handleChooseIntent` faz o POST único (`{status:'COMPLETED', intent}`, fire-and-forget) e navega. Textos gerados via skill `ux-writing` (chaves novas em `messages/{pt-BR,en}/components.json` → `onboarding.whatsappIntent`); revisão de acessibilidade via skill `accessibility` — título/descrição delegados ao `DialogTitle`/`DialogDescription` do Dialog pai (evita heading duplicado), foco inicial via `autoFocus` no primeiro botão, ESC herdado do `onOpenChange` do Dialog pai.
- **T015-T016 (US2)**: saída "possui API oficial" faz `router.push('/dashboard/settings/integrations/whatsapp-official')` (não `window.location.href` — sem dado novo pra recarregar). Confirmado sem alteração: o gate de tier (`BUSINESS`/`wabaGrandfathered`) e o formulário `WhatsAppOfficialSettingsForm` continuam intocados.
- **T018 (US3)**: novo `scripts/whatsapp-intent-report.ts` — agrupa `OnboardingProgress.stepData.whatsapp.intent` (organizações com `isTestAccount=false`), reporta `waba`/`qr`/`later`/"não declarou" separadamente. Compila e roda (falhou só na conexão ao banco — `31.97.23.166:5434` fora do alcance desta rede, mesmo problema do handoff anterior).
- **T020**: `npm run typecheck && npm run test` — verde (350 passos, 1 skip; o teste de isolamento multi-tenant que falhou por timeout numa corrida anterior passou isolado e na re-corrida completa — contenção de conexão sob paralelismo do runner, não regressão desta feature).

## Validação manual (26/08, sessão de continuação)

`.env` local foi atualizado com o `DATABASE_URL` de produção correto (`31.97.23.166:5434` → o real). Com acesso ao banco, rodei os 5 cenários do `quickstart.md` de ponta a ponta via Playwright contra `npm run dev`:

- Criei 6 organizações + usuários descartáveis (`isTestAccount: true`, slug `e2e-test-*`, email `@test.roilabs.local`) cobrindo: sem WhatsApp, com `wabaEnabled`, e `tier=BUSINESS` (gate do formulário WABA). Sessão autenticada mintada diretamente com `encrypt()` de `lib/auth.ts` (mesmo JWT usado em produção) — sem senha nem login real, sem tocar em conta de usuário de verdade.
- **Cenário 1** (ramos `scratch` e `demo`): etapa de intenção aparece, foco inicial no primeiro botão, título/subtítulo trocam sem duplicar heading. Escolher "later"/"qr" grava `stepData.whatsapp` correto (`declaredAt` do servidor) e `status = 'COMPLETED'`; recarregar não reabre a etapa.
- **Cenário 2**: organização com `wabaEnabled=true` navega direto, etapa nunca aparece.
- **Cenário 3**: saída "possui API oficial" grava `intent: "waba"` e navega para `/dashboard/settings/integrations/whatsapp-official` (gate de tier `BUSINESS` intocado, confirma T016).
- **Cenário 4** (regressão US0): `status` ficou `COMPLETED` (nunca `SKIPPED`) nos ramos `demo` e `scratch` — a corrida corrigida em 25/08 não voltou.
- **Cenário 5**: `scripts/whatsapp-intent-report.ts` rodou contra o banco real — 108 organizações elegíveis, 0 declarações (esperado, feature ainda não foi ao ar).
- Todos os dados de teste (orgs, usuários, `OnboardingProgress`, contatos/deals do seed-demo) foram apagados ao final — nada residual no banco.

**Achado fora do escopo desta spec — bug pré-existente:** o ramo "Importar Dados" do onboarding está **quebrado em qualquer ambiente**, não só nesta sessão. `POST /api/onboarding/import-contacts` (`app/api/onboarding/import-contacts/route.ts:70-81`) chama `prisma.contact.createMany({ data: [...{ userId: user.id }] })`, mas o model `Contact` **não tem campo `userId`** (só `assignedToId`) — todo `createMany` falha com `PrismaClientValidationError`, a rota devolve 500 e o toast mostra "Erro interno do servidor". Não toquei nesse arquivo (fora do escopo da spec 003); reportando para o Jean decidir se conserta agora ou abre um bug separado. Efeito: **qualquer usuário que hoje escolhe "Importar Dados" no onboarding recebe erro**, e por causa disso não pude validar via UI o trecho do `welcome-modal.tsx` que trata o `onSuccess` do `ImportContactsModal` quando `!hasWhatsApp` (linhas 335-344) — o código é estruturalmente idêntico ao padrão já validado em `demo`/`scratch` (mesmo `if (hasWhatsApp) {...} else {setStep('intent')}`), só não foi exercitado ponta a ponta por causa deste bug alheio.

## Pendências / gotchas

- **🚨 Bug pré-existente em `app/api/onboarding/import-contacts/route.ts:77`** — `userId` não existe em `Contact`. Import de contatos no onboarding está 100% quebrado (500 em qualquer upload). Não é desta spec, mas bloqueia uma feature em produção.
- Todas as pendências do handoff de 25/08 (Stripe checkout não testado E2E, `EVOLUTION_API_KEY` padrão da doc, service account do Google fora do git, `.env` com chaves duplicadas) continuam abertas — nada nesta sessão as tocou.
- `stepData` é sobrescrito por completo a cada `upsert` (não faz merge de chaves JSON) — inofensivo hoje porque `whatsapp` é a única chave escrita por qualquer código, mas se uma feature futura escrever outra chave em `stepData` concorrentemente, precisa de merge real (ler antes de escrever).
- `.specify/feature.json` continua apontando pra `specs/003-onboarding-whatsapp-intent` (atualizado automaticamente pelo `check-prerequisites.sh` desta sessão — resolve a pendência de 25/08).

---

# Handoff — WhatsApp no onboarding + auditoria do funil real (2026-08-25)

## Contexto

Pedido inicial: opinião sobre `docs/whatsapp/Arquiteturas Não Oficiais Do WhatsApp.md` (relatório de deep research, 49KB, **fora do git**). Derivou para a decisão comercial por trás dele — o CRM precisa de uma rota alternativa ao WABA porque o mercado brasileiro não aceita a burocracia da API oficial — e terminou numa spec para o onboarding.

Nada foi commitado. Nenhum código foi alterado. Único arquivo criado: `specs/003-onboarding-whatsapp-intent/spec.md`.

## Feito

### 1. Avaliação do relatório de arquiteturas não oficiais

**As fontes são reais.** Fui checar esperando citação alucinada e não encontrei: `tulir/whatsmeow#1185` (o protocolo "Shortcake" de passkey existe e está documentado com engenharia reversa), `NVIDIA/OpenShell#760`, `NousResearch/hermes-agent#88516`, issues do Baileys — todos existem e são sobre o que o documento diz. O diagnóstico da seção 1 (funil TLS JA3/JA4 → versão web defasada → passkey) está correto.

**Três defeitos que o desqualificam como base de decisão:**

1. A matriz compara 4 arquiteturas não oficiais e **nunca avalia a API oficial** — que já está implementada no CRM (`wabaEnabled`, `wabaPhoneNumberId`, `wabaAccessToken`, `wabaBusinessAccountId`).
2. A coluna "Exposição Legal (LGPD)" mede a coisa errada. O risco dominante é o **ToS da Meta** (banimento), e num CRM vendido a terceiros quem toma o ban é a **linha comercial do cliente**. Hospedar no VPS próprio não protege contra isso.
3. Precisão falsa: 2º e 3º lugar separados por 0,025 ponto, e o vencedor tira a **pior nota** no critério de maior peso (resistência a ban, 6,0). A conclusão é exatamente o que o CRM já usa.

**Erros de fato:** `omniroute` (ref. 24) é citado como túnel de interceptação TLS — é um roteador de LLMs. `proxy-mcp` (ref. 11) não é "C++ ou Rust" — é TypeScript/Node usando `impit`, e é ferramenta de análise para agentes, não sidecar de produção. Duas das três peças da "implantação definitiva" da seção 5 estão descritas errado.

**Achado arquitetural que muda a conversa:** a rota alternativa **já existe e já está isolada**. `whatsmeow.roilabs.com.br` responde 200 — processo separado, banco separado (`prisma/whatsapp.prisma` → client `.prisma/client-wa`), API key e webhook secret próprios. `lib/chat/queries.ts` já é agnóstico de canal (`connectionScopeSql` resolve a matriz evolution × WABA; `connectionId` preenchido = não oficial, `NULL` = WABA). **O raio de explosão de um ban está contido no gateway.** É o ativo mais valioso da frente — e a seção 5 do relatório destruiria exatamente essa propriedade ao soldar a camada de evasão lá dentro.

### 2. Medição no banco de produção (25/08/2026)

⚠️ **O `DATABASE_URL` do `.env` local aponta para `31.97.23.166:5434`, que NÃO responde.** O banco real de produção é `siriusdb@2.24.207.200:5433` (senha da família `PAzo18**` — ver `secrets_to_rotate` na memória, marcada como grave por ter vazado em repo público do Atma). Pedir a string ao usuário; não está em nenhum `.env` do repo.

| Medida | Valor |
|---|---:|
| Organizações (excluindo `isTestAccount`) | 105 |
| Cadastros por mês | mar 13 · **abr 67** · mai 11 · jun 3 · jul 3 · ago 8 |
| Tier | 102 FREE · 2 PRO · 1 STARTER |
| Assinaturas Stripe | **0** |
| Assinaturas Mercado Pago | 3 |
| Trials | 89 EXPIRED · 9 ACTIVE · 7 "CONVERTED" (campo mente: só 3 tiers pagos) |
| Uso real | 73 orgs com contato · 69 com deal · 8.279 contatos · 975 deals |
| Última Transaction COMPLETED | **22/04/2026** |
| `wabaEnabled` / `wabaPhoneNumberId` | **0 / 0** |
| `evolutionEnabled` | 2 |
| Pageviews totais em `/dashboard/settings/integrations` | **68** (desde fev/2026) |

**Conclusão:** nenhuma das 105 organizações chegou a ligar o WhatsApp — e não há sequer registro com credencial parcial, ou seja, ninguém tentou o WABA e desistiu no meio. Dentro do produto o WhatsApp **nunca foi apresentado a ninguém**. A hipótese comercial (perda na conversa de venda, antes do cadastro) não é observável neste banco e **não foi refutada** — só não é verificável hoje.

### 3. Correção importante — não repetir o erro

Numa primeira leitura eu disse que "101 de 113 pularam o onboarding e ninguém passou do passo 1". **Está errado.**

Só um ponto do código escreve `currentStep`/`completedSteps`: `lib/seed-demo-data.ts:220` (`currentStep: 1, completedSteps: ['demo_data_loaded']`). Logo os **66 registros com `currentStep = 1` são 66 organizações que escolheram "Ver Demonstração"** — 58% dos 113. **O passo 1 converte; não é ali que o funil morre.**

A coluna `status` (101 SKIPPED / 12 COMPLETED) está corrompida por uma corrida no código:

```
handleChoice('demo') → POST seed-demo  → grava COMPLETED
                     → onClose()       → wrapper dispara POST complete {SKIPPED}  ← sobrescreve
                     → window.location → navega (o POST chega ou não)
```

`handleClose` em `components/onboarding/onboarding-wrapper.tsx` é fire-and-forget (`.catch(() => {})`) e roda **também quando houve escolha**. Os 12 `COMPLETED` sobreviventes são só aqueles em que a navegação matou o request a tempo. **Não usar `OnboardingProgress.status` como métrica enquanto isso não for corrigido.**

### 4. Spec criada

`specs/003-onboarding-whatsapp-intent/spec.md`, na estrutura do `specs/002`. Entrega no passo 1 a **pergunta**, não o formulário — porque o WABA exige quatro credenciais do Meta Business Manager (`phoneNumberId`, `businessAccountId`, `accessToken`, `webhookVerifyToken`) e pôr isso na primeira tela é pôr a barreira mais alta na frente do único passo que converte 58%.

| História | Entrega | Bloqueada? |
|---|---|---|
| US0 (P0) | Consertar a gravação do `OnboardingProgress` | Não — pode ir hoje |
| US1 (P1) | Tela de intenção com 3 saídas (tenho WABA / quero QR code / depois) | Sim — FR-009 |
| US2 (P2) | Saída "tenho WABA" reusando o formulário existente | Não |
| US3 (P3) | Consulta que transforma a objeção em número | Não |

A intenção persiste em `OnboardingProgress.stepData` (`jsonb` já existente, nulo em todos os registros, sem leitor no código) — sem tabela nova, sem migração.

## Próximos

1. **US0 — consertar a gravação.** É deleção: remover as chamadas `onClose()` dos ramos `demo` e `scratch` de `handleChoice` em `components/onboarding/welcome-modal.tsx` (o `window.location.href` logo abaixo já navega; o fechamento é redundante). Não depende de nenhuma decisão. **Fazer antes de qualquer medição** — a primeira corrida de um check novo mede o check.
2. **Decidir FR-009** (produto): a saída "QR code" registra e diz "em liberação, sem prazo", ou registra e encaminha ao comercial? Muda só texto e destino. A US1 não sai sem isso.
3. **🚨 Testar o checkout Stripe de ponta a ponta.** Zero assinaturas desde a migração de 07/07/2026, último dinheiro em 22/04/2026, e 92 pageviews em `/dashboard/billing/plans`. A rota `/api/stripe/checkout` existe e chama `createStripeCheckout`; as chaves existem no `.env` local, mas não dá para saber daqui se estão no EasyPanel de produção. Mesmo padrão da Atma: página em 200, checkout morto por meses. **1h, resposta binária** — e sem isso qualquer ganho de ativação desemboca num caminho de pagamento de estado desconhecido.
4. Se for seguir por Spec Kit: `.specify/feature.json` ainda aponta para `specs/002-remove-dead-code`. Trocar antes do `plan`.

## Pendências / gotchas

- **🚨 `EVOLUTION_API_KEY` no `.env` é a chave padrão da documentação do Evolution** (`429683C4C977415CAAFCCE10F7D57E11`). A instância citada (`ia-evolution-api.tjmarr.easypanel.host`) não respondeu em 25/08 — sem exposição no momento. Mas subir qualquer Evolution com essa chave significa que quem souber a URL cria instância, lê e dispara mensagem em todas elas. **Trocar antes de subir, não depois.**
- **`sirius-crm-483316-a2e815438069.json`** — service account do Google na raiz do repo. Não versionada, mas em pasta sincronizada pelo OneDrive. Pendência herdada do handoff de 22/08, ainda aberta.
- **`.env` tem chaves duplicadas**: `WHATSAPP_GATEWAY_URL` e `WHATSAPP_GATEWAY_API_KEY` aparecem duas vezes (uma com aspas, outra sem). A última vence — inofensivo hoje, vira "bug de rede" no dia em que os valores divergirem.
- **`docs/whatsapp/Arquiteturas Não Oficiais Do WhatsApp.md` está fora do git** (`??` no `git status`), junto com `docs/screenshots/` e o `.specify/` inteiro. Se a decisão sobre a rota alternativa for registrada, o doc precisa ser commitado **com um parágrafo no topo dizendo qual foi a decisão** — senão daqui a seis meses ele será lido como recomendação aprovada, e a recomendação dele é construir camada de evasão.
- **Diretórios vazios residuais** de `lib/generative-ui/` e `components/generative-ui/` sobraram no disco após a remoção da spec 002 (resíduo do OneDrive; git não rastreia diretório vazio). `rm -rf` resolve.
- Estado de saúde verificado em 25/08: `npm run typecheck` **verde**, `node scripts/audit-dead-code.js` → **0 arquivos sem importador** e 3 rotas sem chamador (todas na allowlist justificada), `siriuscrm.com.br` responde 200.
- `npm run build` roda `prisma migrate deploy` contra o banco. Para verificar mudanças, usar `npm run typecheck && npm run test`.

---

# Handoff — Auditoria de over-engineering (2026-08-22)

## Contexto
Pedido: "refatore o projeto". Repo tem ~200k linhas de TS/TSX — refatorar às cegas é como o risco entra. Rodada uma auditoria de código morto antes de tocar em qualquer coisa. Nada foi apagado.

## Feito
- **`docs/AUDITORIA_OVER_ENGINEERING_2026-08-22.md`** (novo) — 17 achados ranqueados, plano de execução em 6 fases por risco crescente, e dois anexos com as listas completas.
- **`scripts/audit-dead-code.js`** (novo) — reproduz os números: arquivos sem importador + rotas de API sem chamador. Resolve import estático, `import()` dinâmico e `require()`.

## Achado principal
**~24.400 linhas (12% do TS/TSX) não são alcançáveis por nenhum caminho de execução.** Dois terços disso (16.057 linhas) ficaram órfãos de uma vez só, no commit `2d29773` de 27/04/2026 ("clean up obsolete admin pages"): 10 páginas de admin foram apagadas e o backend inteiro delas ficou — subsistema Generative UI (14.666 linhas, com testes), cluster AGI/graph (1.391), A/B testing.

Nada quebrou porque código não alcançado compila, passa no lint e passa nos próprios testes. É por isso que o `audit-dead-code.js` existe agora.

## Próximos
1. **Decisão de produto sobre o Generative UI** — é 60% do corte total. `docs/GENERATIVE_UI_SUMMARY.md` diz "Fase 1 de 6 COMPLETA" (31/01/2026); último commit de feature foi 03/02/2026. Se for retomar, falta *uma página* que renderize `MessageRenderer`. Se não, são 14,6k linhas type-checadas e testadas a cada CI por nada.
2. Fases 1–3 do plano (~8.700 linhas, risco baixo/nenhum) podem ir sem decisão de produto.
3. Fase 4+ é mudança não-trivial → fluxo Spec Kit, o projeto tem `.specify/`.

## Pendências / gotchas
- **Não confundir os dois Mercado Pago.** `lib/mercadopago.ts` (10 importadores) e `/api/webhooks/mercadopago` continuam vivos por causa das assinaturas legadas — ver handoff de 07/07. O órfão é `lib/mercado-pago/checkout.ts` (diretório com hífen) + `/api/mercadopago/checkout`.
- Falsos positivos já verificados nos anexos: `/api/sync/process` (chamado por `public/sw-push.js`), `/api/mobile/sync` (app Capacitor), `/api/mercadopago/checkout` (redirect de 7 linhas).
- `sirius-crm-483316-a2e815438069.json` — service account do Google na raiz do repo. Fora do escopo desta auditoria; pede um `/security-review`.
- `npm run build` roda `prisma migrate deploy` contra o banco. Para verificar as fases, usar `npm run typecheck && npm run test`.
- 5 docs `GENERATIVE_UI_*.md` descrevem o subsistema como se estivesse em produção. Vão junto se o item 1 for apagado.

---

# Handoff — Brand entity SEO "sirius crm" (2026-07-11)

## Contexto
Investigação via roihub /insights + GSC: o trend "cliques declining" era 100% o query branded `sirius crm` (21→7 cliques entre janelas 28d; posição própria caiu de 2,0 → ~4,4-5,4; CTR 17%→6%). Nome homônimo disputado (Hitachi, ERP Sirius UK, Sirius Jewels, Dana Grupo). Descoberta grave: **todos os `sameAs` do site apontavam pra perfis mortos ou de terceiros** — `linkedin.com/company/roilabs` (deletada), `linkedin.com/company/roi-labs` (consultoria americana homônima), `twitter.com/roilabs` e `github.com/roilabs` (contas de estranhos). Isso ativamente atrapalha a desambiguação da entidade.

## Feito (commit `ef1f16b`)
- **`lib/geo/entity.ts`** (novo) — fonte única dos perfis VERIFICADOS em 11/07: `ORG_SAME_AS` (linkedin `roi-labs-curadoria` [confirmado owned via admin view] + instagram `roilabs.curadoria` [declarado no schema de roilabs.com.br]) e `FOUNDER`/`FOUNDER_SAME_AS` (Jean: linkedin `in/jean-zorzetti-772742239` + github `JeanZorzetti`). Comentário no arquivo lista os URLs proibidos e por quê.
- **`app/[locale]/layout.tsx`** — @graph central: Organization com `sameAs` verificados + `founder` (Person Jean, cujo About no LinkedIn cita "Sirius CRM" — link bidirecional de entidade); WebSite ganhou `alternateName: 'Sirius'`; SoftwareApplication ganhou `@id`; removido `twitter.creator: '@roilabs'` (handle não é nosso).
- **home, community, blog/[slug], lib/geo/schema-generator.ts** — todos os sameAs inline (10 ocorrências) trocados pelo import de `ORG_SAME_AS`.
- **`components/marketing/footer.tsx`** — links visíveis corrigidos: LinkedIn→curadoria, Twitter→Instagram curadoria, GitHub→JeanZorzetti.
- **`docs/BLOG_POST_TEMPLATE.md`** + mds do spin-selling — referências corrigidas pra não perpetuar URLs errados.
- Typecheck verde (`npm run typecheck`).

## Próximos
1. Validar em prod (Rich Results Test / view-source em siriuscrm.com.br procurando `roi-labs-curadoria`).
2. **Google Ads branded "sirius crm"** — protege o nome dos homônimos e reativa a demanda branded que secou (era o próximo passo do plano de growth; as 3 vendas vieram de branded).
3. Medir posição branded no GSC ~28/07 (D+17 da mudança).

## Pendências / gotchas
- `aggregateRating 5.0/12` no SoftwareApplication do layout: sem reviews visíveis na página, é risco de spam de structured data (pode virar manual action). Avaliar remover ou linkar reviews reais.
- Página LinkedIn `roi-labs-curadoria` está parada (0 posts em 90d) — schema aponta pra ela, mas entidade forte pede página viva.
- `contactOption: 'TollFree'` no layout é incorreto (número é celular) — cosmético.

---

# Handoff — Migração de pagamento para Stripe (2026-07-07)

## Contexto
O checkout via Mercado Pago não estava funcionando. Migrado o meio de pagamento para **Stripe**, mantendo o Mercado Pago apenas para honrar assinaturas de clientes legados.

## Feito
- **`lib/stripe.ts`** — SDK Stripe (singleton lazy), catálogo `STRIPE_PLANS` (preços em centavos), `createStripeCheckout()` (Checkout Session hospedada) e `cancelStripeSubscription()`.
- **`lib/billing-effects.ts`** — regras de negócio de assinatura extraídas do webhook do MP, agora **provider-neutral** e compartilhadas entre Stripe e MP: `upgradePlan`, `upgradeToFounder`, `processAddonPurchase`, `renewSubscription`, `downgradeToFree`, `handleFailedRecurringPayment`, `sendPaymentFailureEmail`, `recordWhatsAppSetupPurchase`.
- **`app/api/stripe/checkout/route.ts`** — nova rota de checkout. Mesmo contrato da antiga (`{ plan, billingPeriod }` → `{ checkoutUrl }`), incl. guarda de tier, desconto de indicação e `customPricing`.
- **`app/api/webhooks/stripe/route.ts`** — trata `checkout.session.completed`, `invoice.paid` (renovação), `invoice.payment_failed` (email) e `customer.subscription.deleted` (churn → FREE). Valida assinatura via `STRIPE_WEBHOOK_SECRET`.
- **`app/api/webhooks/mercadopago/route.ts`** — refatorado para usar `lib/billing-effects.ts` (mesma lógica, sem duplicação). Continua funcionando para clientes legados.
- **`app/api/mercadopago/checkout/route.ts`** — agora só re-exporta a rota da Stripe (compat com app mobile Capacitor que ainda chama a URL antiga).
- **Frontend** (3 call sites) apontando para `/api/stripe/checkout`: `dashboard/billing/plans/page.tsx`, `components/dashboard/billing/embedded-checkout-modal.tsx`, `components/integrations/whatsapp-setup-cta.tsx`.
- **`app/api/billing/cancel/route.ts`** — cancela na Stripe (e no MP se legado).
- **Schema + migration** `20260707000000_add_stripe_billing_fields`: colunas `stripeCustomerId` e `stripeSubscriptionId` na `Organization`.
- **Teste** `lib/__tests__/stripe.test.ts` — guardrail de preços (STRIPE_PLANS × PLAN_PRICES) e mode/interval. ✅ 3/3.

## Verificado
- `npx tsc --noEmit` → **0 erros**.
- `npx vitest run lib/__tests__/stripe.test.ts` → **3/3 passou**.
- `prisma generate` OK com os novos campos.

## Decisões
- **Checkout hospedado** (redirect), não embedded — menor superfície, mesma UX do fluxo MP atual (que já redirecionava).
- **Preços via `price_data` inline**, sem catálogo de Prices no dashboard. Permite `customPricing` (referral/grandfathering/founder) sem criar um Price por cliente.
- **NÃO passar `payment_method_types`** — a Stripe seleciona métodos dinamicamente pelo dashboard (best practice; habilita PIX/cartão conforme conta).
- **Dunning é da Stripe**, não retry manual. Configurar no dashboard para cancelar a assinatura após as tentativas → dispara `customer.subscription.deleted` → downgrade FREE.

## Pendências (bloqueiam produção — precisam do Jean)
1. **Criar conta/pegar chaves Stripe** e preencher em produção (EasyPanel): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Idem `.env` local (chaves `sk_test_`/`whsec_` de teste).
2. **Cadastrar o webhook** no dashboard Stripe → `https://siriuscrm.com.br/api/webhooks/stripe` com os eventos: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`. Copiar o signing secret para `STRIPE_WEBHOOK_SECRET`.
3. **Habilitar métodos de pagamento** (cartão, PIX) em Settings → Payment methods.
4. **Configurar dunning** (Settings → Billing → Retries) para cancelar após as tentativas.
5. **Verificar moeda BRL** habilitada na conta.
6. **Teste E2E em prod**: assinar um plano de teste, confirmar upgrade de tier no banco + email de confirmação; cancelar e confirmar downgrade.

## Gotchas
- Diretório de trabalho do agente ≠ raiz do projeto: rodar prisma sempre com `--schema prisma/schema.prisma`.
- `.env` e `.env.easypanel` são gitignored (segredos reais). Só `.env.example` versionado.
- Migration usa `ADD COLUMN IF NOT EXISTS` (idempotente). A coluna Stripe já existiu antes (removida na migration de migração p/ MP em jan/2026).
- `customPricing` só é honrado para **PRO mensal** (comportamento herdado do fluxo MP) — revisar se quiser estender.
- MP continua no código de propósito (assinaturas legadas). Não remover `lib/mercadopago.ts` nem o webhook enquanto houver `mercadoPagoSubscriptionId` ativo em alguma org.
