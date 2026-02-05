# 📋 Guia de Migração v2.0 - Modular Plans

Guia completo para migrar clientes existentes para a nova estrutura v2.0.

---

## 🎯 Objetivo

Migrar todos os clientes do modelo antigo (FREE/PRO) para o novo modelo modularizado (FREE/STARTER/PRO/BUSINESS).

---

## 🗺️ Estratégia de Migração

### 1. Clientes PRO → BUSINESS
- **Todos** os clientes PRO atuais serão promovidos para BUSINESS
- **Grandfathering:** Preço mantido em R$ 97/mês por 6 meses
- Após 6 meses: Preço atualiza para R$ 149/mês
- Email de comunicação enviado automaticamente

### 2. Clientes FREE com >50 Deals

**Estratégia Híbrida:**

#### A. Clientes antigos (criados antes de 01/01/2026)
- **Grandfathering:** Mantém todos os deals existentes
- `grandfatheredDealLimit` = número atual de deals
- Não podem criar novos deals além do limite
- Email de comunicação: "Você ganhou upgrade de cortesia"

#### B. Clientes recentes (criados após 01/01/2026)
- **Soft Archive:** Deals acima de 50 são arquivados
- Deals 1-50: Normais (read/write)
- Deals 51+: Arquivados (read-only)
- Email de comunicação: "Seus deals foram arquivados"

### 3. Inicialização de Recursos

**ScrapingCredit:**
- FREE: 5 créditos iniciais (apenas uma vez)
- STARTER: 0 créditos
- PRO/BUSINESS: 50 créditos mensais

**AgiQuota:**
- FREE: 3 gerações/mês
- STARTER: 0 (sem acesso)
- PRO/BUSINESS: Ilimitado (-1)

---

## 🚀 Execução da Migração

### Pré-requisitos

1. **Backup do banco de dados:**
   ```bash
   pg_dump -h HOST -U USER -d DATABASE > backup_pre_v2_$(date +%Y%m%d).sql
   ```

2. **Ambiente de staging testado:**
   - Executar migração em staging primeiro
   - Validar resultados
   - Testar rollback

3. **Comunicação preparada:**
   - Templates de email configurados
   - Suporte preparado para dúvidas

### Passo 1: Dry Run (Preview)

```bash
# Visualizar o que será feito SEM alterar dados
tsx scripts/migrate-to-v2.ts --dry-run
```

**Saída esperada:**
```
╔════════════════════════════════════════════════════════╗
║   🚀 Migração v2.0 - Modular Plans                    ║
╚════════════════════════════════════════════════════════╝

⚠️  DRY RUN MODE - Nenhum dado será alterado

Total de organizações: 150

=== 1. Migrar PRO → BUSINESS ===
Encontradas 50 organizações PRO
[DRY RUN] Migraria: Empresa X (org_123) PRO → BUSINESS
  - Grandfathering: R$ 97,00 até 05/08/2026
...

=== 2. Aplicar Soft Archive (FREE >50 deals) ===
Encontradas 100 organizações FREE
[DRY RUN] Grandfathering: Empresa Y (127 deals)
[DRY RUN] Soft Archive: Empresa Z (arquivar 23 deals)
...

=== 3. Inicializar ScrapingCredit ===
[DRY RUN] Criaria ScrapingCredit: Empresa X (tier: BUSINESS, balance: 50)
...

╔════════════════════════════════════════════════════════╗
║   ✅ Migração Concluída                               ║
╚════════════════════════════════════════════════════════╝

Estatísticas:
  Total de organizações: 150
  PRO → BUSINESS: 50
  FREE Grandfathering: 35
  FREE Soft Archive: 15
  ScrapingCredits criados: 150
  AgiQuotas criados: 150
  Erros: 0
  Duração: 2.34s

💡 Execute sem --dry-run para aplicar as mudanças de verdade
```

### Passo 2: Revisar Resultados

1. **Verificar estatísticas:**
   - Número de organizações faz sentido?
   - Grandfathering aplicado corretamente?
   - Soft Archive como esperado?

2. **Verificar logs:**
   - Erros: 0 ✅
   - Warnings normais (emails não enviados em dry-run)

### Passo 3: Executar Migração Real

```bash
# Executar migração REAL (altera dados)
tsx scripts/migrate-to-v2.ts
```

**O que acontece:**
1. Aguarda 5 segundos para cancelamento (Ctrl+C)
2. Migra PRO → BUSINESS
3. Envia emails de upgrade
4. Aplica Soft Archive/Grandfathering em FREE
5. Envia emails de notificação
6. Cria ScrapingCredit e AgiQuota para todos
7. Mostra resumo final

**Duração estimada:**
- 10-50 orgs: ~10 segundos
- 50-200 orgs: ~30 segundos
- 200-1000 orgs: ~2 minutos

### Passo 4: Validação Pós-Migração

```sql
-- 1. Verificar tiers
SELECT tier, COUNT(*) as count
FROM "Organization"
GROUP BY tier
ORDER BY tier;

-- Esperado:
-- FREE     | 100
-- BUSINESS | 50  (antes eram PRO)

-- 2. Verificar grandfathering
SELECT COUNT(*) FROM "Organization"
WHERE "customPricing" IS NOT NULL;
-- Esperado: 50 (ex-PRO agora BUSINESS)

-- 3. Verificar ScrapingCredit
SELECT COUNT(*) FROM "ScrapingCredit";
-- Esperado: 150 (todas as orgs)

-- 4. Verificar AgiQuota
SELECT COUNT(*) FROM "AgiQuota";
-- Esperado: 150 (todas as orgs)

-- 5. Verificar deals arquivados
SELECT COUNT(*) FROM "Deal"
WHERE archived = true AND "archivedReason" = 'PLAN_LIMIT';
-- Esperado: número de deals arquivados (ex: 300)
```

---

## 🔄 Rollback (Reverter Migração)

### Quando usar rollback?

- Erros críticos durante migração
- Churn inesperado (>10%)
- Problemas com emails
- Feedback negativo massivo

### Como fazer rollback

```bash
# 1. Dry run do rollback
tsx scripts/rollback-v2.ts --dry-run

# 2. Executar rollback
tsx scripts/rollback-v2.ts
```

**⚠️ ATENÇÃO:**
- Rollback é **destrutivo**
- Deleta **todos** ScrapingCredits e AgiQuotas
- Perde histórico de uso de créditos
- Usar apenas em emergências

**O que o rollback faz:**
1. BUSINESS → PRO (remove grandfathering)
2. Desarquiva todos os deals
3. Remove grandfathering de FREE
4. **DELETA** todos ScrapingCredits
5. **DELETA** todos AgiQuotas

### Rollback Parcial (Manual)

Se precisar reverter apenas parte:

```sql
-- Reverter apenas BUSINESS → PRO
UPDATE "Organization"
SET tier = 'PRO', "customPricing" = NULL, "customPricingExpiresAt" = NULL
WHERE tier = 'BUSINESS' AND "customPricing" IS NOT NULL;

-- Desarquivar deals de uma org específica
UPDATE "Deal"
SET archived = false, "archivedReason" = NULL, "archivedAt" = NULL
WHERE "organizationId" = 'org_id' AND "archivedReason" = 'PLAN_LIMIT';
```

---

## 📧 Comunicação com Clientes

### Templates de Email

Os emails são enviados automaticamente pelo script:

1. **PRO → BUSINESS:**
   - Assunto: "🎉 Você foi promovido para o Plano BUSINESS!"
   - Conteúdo: Novas features, grandfathering 6 meses

2. **FREE Grandfathering:**
   - Assunto: "🎁 Você ganhou um upgrade de cortesia!"
   - Conteúdo: Mantém todos os deals, agradecimento

3. **FREE Soft Archive:**
   - Assunto: "⚠️ Ação necessária: Seus deals foram arquivados"
   - Conteúdo: Como reativar, link para upgrade

### Suporte Pós-Migração

**Preparar equipe de suporte:**
- FAQs atualizados
- Scripts de atendimento
- Escalação para problemas técnicos

**Perguntas frequentes esperadas:**
1. "Por que meus deals foram arquivados?"
2. "Como faço upgrade para STARTER?"
3. "Quando expira meu grandfathering?"
4. "Como uso os créditos de prospecção?"

---

## 📊 Monitoramento Pós-Migração

### Métricas a Observar (7 dias)

```sql
-- 1. Churn rate
SELECT
  COUNT(*) FILTER (WHERE "deletedAt" > NOW() - INTERVAL '7 days') as churned,
  COUNT(*) as total,
  (COUNT(*) FILTER (WHERE "deletedAt" > NOW() - INTERVAL '7 days')::float / COUNT(*)) * 100 as churn_rate
FROM "Organization";

-- Meta: <5%

-- 2. Conversões FREE → STARTER
SELECT COUNT(*) FROM "Organization"
WHERE tier = 'STARTER'
AND "updatedAt" > NOW() - INTERVAL '7 days';

-- Meta: >10% dos FREE

-- 3. Uso de créditos de scraping
SELECT
  AVG("usedThisMonth") as avg_used,
  MAX("usedThisMonth") as max_used
FROM "ScrapingCredit"
WHERE "organizationId" IN (
  SELECT id FROM "Organization" WHERE tier IN ('PRO', 'BUSINESS')
);

-- 4. Support tickets
-- Verificar volume de tickets relacionados à migração
```

### Alertas

Configurar alertas para:
- Churn rate >5% em 24h
- >10 support tickets sobre migração
- Erro rate >1% em webhooks

---

## ✅ Checklist de Execução

### Antes da Migração
- [ ] Backup do banco de dados criado
- [ ] Migração testada em staging
- [ ] Templates de email revisados
- [ ] Suporte treinado e preparado
- [ ] Comunicação interna (equipe ciente)
- [ ] Rollback testado em staging

### Durante a Migração
- [ ] Dry run executado e revisado
- [ ] Migração real executada
- [ ] Logs salvos
- [ ] Validação SQL executada
- [ ] Amostra de emails recebidos confirmada

### Após a Migração
- [ ] Métricas de churn monitoradas
- [ ] Support tickets monitorados
- [ ] FAQs publicados
- [ ] Changelog atualizado
- [ ] Documentação atualizada
- [ ] Backup pós-migração criado

---

## 🐛 Troubleshooting

### Emails não estão sendo enviados

**Diagnóstico:**
```bash
# Verificar logs
tail -f logs/app.log | grep "email"
```

**Solução:**
- Verificar credenciais de email (Resend)
- Verificar rate limit
- Reenviar manualmente para orgs críticas

### Deals arquivados incorretamente

**Diagnóstico:**
```sql
SELECT o.name, COUNT(d.id) as archived_count
FROM "Organization" o
JOIN "Deal" d ON d."organizationId" = o.id
WHERE d.archived = true AND d."archivedReason" = 'PLAN_LIMIT'
GROUP BY o.id, o.name
ORDER BY archived_count DESC;
```

**Solução:**
```sql
-- Desarquivar manualmente
UPDATE "Deal"
SET archived = false, "archivedReason" = NULL, "archivedAt" = NULL
WHERE "organizationId" = 'org_id' AND "archivedReason" = 'PLAN_LIMIT';
```

### Grandfathering não aplicado

**Diagnóstico:**
```sql
SELECT id, name, "createdAt", tier, "grandfatheredDealLimit"
FROM "Organization"
WHERE tier = 'FREE'
AND "createdAt" < '2026-01-01'
AND "grandfatheredDealLimit" IS NULL;
```

**Solução:**
```sql
-- Aplicar grandfathering manualmente
UPDATE "Organization"
SET
  "grandfatheredDealLimit" = (
    SELECT COUNT(*) FROM "Deal"
    WHERE "organizationId" = "Organization".id AND archived = false
  ),
  "grandfatheredAt" = NOW()
WHERE id = 'org_id';
```

---

## 📚 Referências

- [Roadmap v2.0](ROADMAP_V2_MODULAR_PLANS.md)
- [Executive Summary](V2_EXECUTIVE_SUMMARY.md)
- [Opções FREE >50 Deals](FREE_PLAN_MIGRATION_OPTIONS.md)
- [Setup Mercado Pago](MERCADOPAGO_SETUP.md)

---

**Última atualização:** 2026-02-05
**Versão:** 1.0
**Status:** ✅ Pronto para execução
