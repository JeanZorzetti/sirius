# 🆓 Estratégias para Clientes FREE com >50 Deals

**Problema:** Na migração para v2.0, o plano FREE terá limite de 50 deals ativos. Alguns clientes atuais podem ter mais que isso.

**Quantidade Estimada:** ~15-20 clientes (baseado em análise de dados)

---

## 📊 Análise das Opções

### OPÇÃO A: Grandfathering (Mais Generosa) 🎁

**Descrição:**
Clientes FREE criados antes do lançamento da v2.0 mantêm TODOS os deals existentes, mas não podem criar novos além do limite atual.

**Como Funciona:**
```
Cliente tem 127 deals ativos → Limite grandfathered = 127
- Pode ver/editar os 127 deals
- NÃO pode criar o 128º deal
- Prompt de upgrade ao tentar criar novo
```

**Implementação:**
```typescript
// Ao criar cliente FREE antes de v2.0
await prisma.organization.update({
  where: { id: orgId },
  data: {
    grandfatheredDealLimit: currentDealCount, // 127 no exemplo
    grandfatheredAt: new Date()
  }
})

// Ao verificar limite (create deal)
const currentDeals = await getActiveDealCount(orgId)
const limit = org.grandfatheredDealLimit || PLAN_FEATURES[org.tier].max_deals

if (currentDeals >= limit && limit !== -1) {
  throw new Error('Deal limit reached. Upgrade to continue.')
}
```

**UI/UX:**
```
┌─────────────────────────────────────────┐
│  ⚠️ Limite de Deals Atingido            │
├─────────────────────────────────────────┤
│                                         │
│  Você tem 127/127 deals ativos.         │
│                                         │
│  O plano FREE agora limita em 50 deals, │
│  mas como você é cliente antigo,        │
│  mantemos seus 127 deals existentes.    │
│                                         │
│  Para criar novos deals:                │
│                                         │
│  [Upgrade para STARTER - R$ 49/mês]    │
│  Deals ilimitados + muito mais          │
│                                         │
│  ou                                     │
│                                         │
│  [Arquivar deals antigos]               │
│  Mover alguns para arquivo              │
│                                         │
└─────────────────────────────────────────┘
```

**Prós:**
- ✅ Zero fricção para o cliente
- ✅ Goodwill com early adopters
- ✅ Não perde dados
- ✅ UX muito boa
- ✅ Churn baixíssimo

**Contras:**
- ❌ "Inconsistência": alguns FREE têm >50 deals
- ❌ Pode reduzir senso de urgência para upgrade
- ❌ Difícil de explicar para novos clientes

**Custo/Impacto:**
- 💰 Baixo (só storage de dados extras)
- ⏱️ Implementação: ~4h

---

### OPÇÃO B: Grace Period + Forced Downgrade 🔒

**Descrição:**
Dar 30 dias de aviso. Depois, bloqueio hard: não pode criar NEM editar deals acima de 50.

**Como Funciona:**
```
Dia 0: Email de aviso ("Você tem 30 dias para decidir")
Dia 30: Bloqueio ativado
  - Deals 1-50: Normais
  - Deals 51+: Read-only (não pode editar)
  - Não pode criar novos
```

**Implementação:**
```typescript
// Ao atingir deadline
if (org.freeDowngradeDeadline && org.freeDowngradeDeadline < new Date()) {
  const activeDeals = await prisma.deal.count({
    where: { organizationId: org.id, archived: false }
  })

  if (activeDeals > 50) {
    // Bloqueia funcionalidade
    const canEdit = dealIndex <= 50 // Apenas primeiros 50
    const canCreate = false
  }
}
```

**UI/UX:**
```
┌─────────────────────────────────────────┐
│  🔒 Conta Bloqueada                     │
├─────────────────────────────────────────┤
│                                         │
│  Você tem 127 deals, mas o plano FREE   │
│  limita em 50.                          │
│                                         │
│  Seus deals estão em modo SOMENTE       │
│  LEITURA.                               │
│                                         │
│  Para continuar trabalhando:            │
│                                         │
│  [Upgrade para STARTER - R$ 49/mês] ⭐  │
│  Deals ilimitados + muito mais          │
│                                         │
│  ou                                     │
│                                         │
│  [Arquivar 77 deals]                    │
│  Manter apenas 50 ativos                │
│                                         │
└─────────────────────────────────────────┘
```

**Prós:**
- ✅ Força conversão para paying
- ✅ Justo com quem paga
- ✅ Consistente com novo modelo
- ✅ Senso de urgência alto

**Contras:**
- ❌ UX muito ruim (bloqueio hard)
- ❌ Alto risco de churn
- ❌ Má impressão com early adopters
- ❌ Suporte vai receber muitas reclamações

**Custo/Impacto:**
- 💰 Baixo
- ⏱️ Implementação: ~6h
- 😡 Churn estimado: 30-50%

---

### OPÇÃO C: Soft Archive (Recomendada) 📦

**Descrição:**
Deals acima de 50 ficam em "Archive Mode" (read-only). Cliente pode VER, mas não EDITAR. Para reativar, precisa arquivar outros ou fazer upgrade.

**Como Funciona:**
```
Cliente tem 127 deals:
  - Deals 1-50: Normais (read/write)
  - Deals 51-127: Arquivados automaticamente (read-only)

Para reativar deal 51:
  - Opção 1: Arquivar manualmente outro deal (ex: deal 49)
  - Opção 2: Upgrade para STARTER
```

**Implementação:**
```typescript
// Ao ativar limite (migration script)
const activeDeals = await prisma.deal.findMany({
  where: { organizationId: org.id, archived: false },
  orderBy: { updatedAt: 'desc' } // Mais recentes primeiro
})

if (activeDeals.length > 50) {
  // Mantém os 50 mais recentes ativos
  const toKeepActive = activeDeals.slice(0, 50)
  const toArchive = activeDeals.slice(50)

  await prisma.deal.updateMany({
    where: { id: { in: toArchive.map(d => d.id) } },
    data: {
      archived: true,
      archivedReason: 'PLAN_LIMIT',
      archivedAt: new Date()
    }
  })

  // Notificar
  await createNotification({
    organizationId: org.id,
    type: 'deals_archived',
    title: 'Deals arquivados automaticamente',
    message: `${toArchive.length} deals foram arquivados devido ao limite do plano FREE.`
  })
}
```

**UI/UX:**
```
┌─────────────────────────────────────────┐
│  Deals Ativos (50/50) ⚠️                │
├─────────────────────────────────────────┤
│                                         │
│  [Tabs: Ativos | Arquivados (77)]       │
│                                         │
│  ── TAB: ATIVOS ──                      │
│  📌 Deal 1 - Empresa X - R$ 5.000       │
│  📌 Deal 2 - Empresa Y - R$ 3.500       │
│  ...                                    │
│  📌 Deal 50 - Empresa Z - R$ 1.200      │
│                                         │
│  ── TAB: ARQUIVADOS ──                  │
│  📦 Deal 51 - Empresa A - R$ 2.000      │
│     [Reativar] (requer upgrade ou       │
│                 arquivar outro)          │
│                                         │
│  💡 Dica: Faça upgrade para STARTER     │
│  (R$ 49/mês) e tenha deals ilimitados!  │
│                                         │
└─────────────────────────────────────────┘
```

**Reativar Deal:**
```
┌─────────────────────────────────────────┐
│  Reativar "Deal 51 - Empresa A"?        │
├─────────────────────────────────────────┤
│                                         │
│  Você já tem 50 deals ativos (limite    │
│  do plano FREE).                        │
│                                         │
│  Escolha uma opção:                     │
│                                         │
│  ○ Arquivar outro deal antes            │
│    [Selecionar deal para arquivar]      │
│                                         │
│  ● Upgrade para STARTER (R$ 49/mês) ⭐  │
│    Deals ilimitados + muito mais        │
│                                         │
│  [Confirmar]  [Cancelar]                │
│                                         │
└─────────────────────────────────────────┘
```

**Prós:**
- ✅ Não perde dados (goodwill)
- ✅ UX razoável (pode ver tudo)
- ✅ Incentiva upgrade sem forçar
- ✅ Cliente controla o que arquivar
- ✅ Churn baixo

**Contras:**
- ⚠️ Complexo de implementar
- ⚠️ Precisa de UI de "deals arquivados"
- ⚠️ Pode confundir alguns usuários

**Custo/Impacto:**
- 💰 Médio (UI extra)
- ⏱️ Implementação: ~8-12h
- 😊 Churn estimado: 5-10%

---

### OPÇÃO D: Free Choice (Democrática) 🗳️

**Descrição:**
Enviar email perguntando ao cliente o que ele quer fazer.

**Como Funciona:**
```
Email:
"Oi [Nome],

Seu plano FREE tem 127 deals ativos.

A partir de [DATA], o plano FREE terá limite de 50 deals.

Escolha o que prefere:

1. [Manter como está] - Seus 127 deals ficam read-only
2. [Escolher 50 para manter] - Você escolhe quais 50 manter ativos
3. [Upgrade para STARTER] - R$ 49/mês, deals ilimitados

Clique aqui para decidir: [Link]
"
```

**Landing Page de Decisão:**
```
┌─────────────────────────────────────────┐
│  O que você quer fazer?                 │
├─────────────────────────────────────────┤
│                                         │
│  Você tem 127 deals ativos.             │
│  O plano FREE agora limita em 50.       │
│                                         │
│  [Opção 1: Manter Tudo Read-Only]      │
│  Vejo tudo, mas não edito nada          │
│                                         │
│  [Opção 2: Escolher 50 Ativos]         │
│  Eu seleciono quais 50 manter           │
│                                         │
│  [Opção 3: Upgrade - R$ 49/mês] ⭐     │
│  Deals ilimitados forever               │
│                                         │
│  [Opção 4: Arquivar Automaticamente]   │
│  Sistema escolhe os 50 mais recentes    │
│                                         │
└─────────────────────────────────────────┘
```

**Prós:**
- ✅ Democrático (cliente escolhe)
- ✅ Transparente
- ✅ Reduz reclamações
- ✅ Permite diferentes caminhos

**Contras:**
- ⚠️ Complexo de implementar (4 fluxos)
- ⚠️ Muita escolha pode paralisar
- ⚠️ Nem todos vão responder (default?)

**Custo/Impacto:**
- 💰 Alto (UI complexa)
- ⏱️ Implementação: ~16h
- ⏳ Precisa esperar resposta do cliente

---

## 🎯 Comparação Lado a Lado

| Critério | A: Grandfather | B: Forced | C: Soft Archive | D: Free Choice |
|----------|----------------|-----------|-----------------|----------------|
| **UX** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Conversão** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Churn** | 0-2% | 30-50% | 5-10% | 10-15% |
| **Complexidade** | ⭐⭐ | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Custo Dev** | 4h | 6h | 12h | 16h |
| **Goodwill** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Consistência** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## ✅ Recomendação Final

### **OPÇÃO C: Soft Archive** (Implementar imediatamente)

**+ OPÇÃO A: Grandfathering** (Para clientes criados antes de [DATA_CUTOFF])

### Estratégia Híbrida:

```
IF cliente.createdAt < '2026-01-01':
  → OPÇÃO A (Grandfathering)
  → Mantém todos os deals
  → Não pode criar novos além do limite atual

ELSE IF cliente.createdAt >= '2026-01-01':
  → OPÇÃO C (Soft Archive)
  → Deals >50 vão para "Arquivados"
  → Pode reativar mediante upgrade ou swap
```

**Justificativa:**
1. **Grandfathering para clientes antigos** (antes de 01/01/2026):
   - Recompensa early adopters
   - Goodwill máximo
   - Churn zero

2. **Soft Archive para clientes recentes** (depois de 01/01/2026):
   - Já sabiam do limite (comunicado em onboarding)
   - Ainda assim não perde dados
   - Incentiva upgrade

**Comunicação:**

```markdown
# Email para Clientes Antigos (Grandfathering)

Subject: 🎁 Você ganhou um upgrade de cortesia!

Olá [Nome],

Temos boas notícias! Como agradecimento por ser um dos nossos
primeiros clientes, você vai manter TODOS os seus [X] deals ativos
no plano FREE. 🎉

Mudança no plano FREE (a partir de 15/02/2026):
- Novos clientes: Limite de 50 deals
- Você (cliente antigo): Mantém seus [X] deals

Você não precisa fazer nada. Continue usando normalmente!

Quer ainda mais? Conheça o plano STARTER (R$ 49/mês):
- Deals ilimitados
- Gestão de contatos avançada
- Analytics melhorados

Obrigado pela confiança,
Equipe Sirius CRM

---

# Email para Clientes Recentes (Soft Archive)

Subject: ⚠️ Ação necessária: Seus deals foram arquivados

Olá [Nome],

A partir de hoje, o plano FREE tem limite de 50 deals ativos.

Sua conta tinha [X] deals. Para se adequar ao limite:
- ✅ 50 deals mais recentes: ATIVOS (você pode editar)
- 📦 [X-50] deals antigos: ARQUIVADOS (você pode ver)

Como reativar um deal arquivado:
1. Arquivar manualmente outro deal ativo, OU
2. Upgrade para STARTER (R$ 49/mês) - Deals ilimitados

Ver deals arquivados: [Link]

Dúvidas? Responda este email.

Equipe Sirius CRM
```

---

## 📋 Checklist de Implementação

### Fase 1: Schema (Dia 1)
- [ ] Adicionar campo `grandfatheredDealLimit` em Organization
- [ ] Adicionar campo `archivedReason` em Deal
- [ ] Criar index em `Deal.archived`

### Fase 2: Lógica (Dias 2-3)
- [ ] Implementar `checkDealLimit()` com grandfathering
- [ ] Implementar auto-archive em migration
- [ ] Criar notificações de arquivamento

### Fase 3: UI (Dias 4-5)
- [ ] Tab "Arquivados" na lista de deals
- [ ] Modal "Reativar Deal"
- [ ] Upgrade prompts contextuais
- [ ] Badge "Limite Atingido" no header

### Fase 4: Comunicação (Dia 6)
- [ ] Escrever templates de email
- [ ] Criar landing page de decisão
- [ ] Preparar FAQs
- [ ] Treinar suporte

### Fase 5: Rollout (Dia 7)
- [ ] Executar migration script
- [ ] Enviar emails em lotes (10% → 50% → 100%)
- [ ] Monitor churn + support tickets
- [ ] Ajustar comunicação conforme feedback

---

## 🎬 Timeline de Comunicação

```
D-30 (30 dias antes):
  📧 Email de aviso prévio
  "Mudanças chegando no plano FREE..."

D-15:
  📧 Email lembrando
  "Faltam 15 dias! Prepare-se para..."

D-7:
  📧 Email final
  "Última semana! O que vai mudar:"

D-0 (Launch):
  🚀 Aplicar mudanças
  📧 Email confirmando
  📢 In-app notification

D+7 (1 semana depois):
  📊 Analisar métricas
  📧 Email follow-up (quem não fez nada)

D+30:
  📈 Análise final
  🔄 Ajustes conforme aprendizados
```

---

**Aprovação:** ⏳ Aguardando
**Owner:** Jean (Dev)
**Estimativa:** 12h de dev + 6h de comunicação
