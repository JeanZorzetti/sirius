# 🗺️ Sirius CRM v2.0 - Índice de Documentação

**Data de Criação:** 2026-02-04
**Status:** 🟡 Aguardando Aprovação
**Duração Total:** 9 semanas
**Investimento:** R$ 1.500-3.000 (one-time) + R$ 300-450/mês

---

## 📚 Guia Rápido de Navegação

### Para Decisão Rápida (5 min)
👉 **[V2_EXECUTIVE_SUMMARY.md](V2_EXECUTIVE_SUMMARY.md)**
- Visão geral da mudança
- Timeline (9 semanas)
- Projeção de receita
- Decisões pendentes
- ROI esperado

### Para Planejamento Técnico Completo (30 min)
👉 **[ROADMAP_V2_MODULAR_PLANS.md](ROADMAP_V2_MODULAR_PLANS.md)**
- 4 fases detalhadas
- Schema do banco de dados
- Código de exemplo
- Custos e riscos
- Definition of Done

### Para Decisão sobre Clientes FREE >50 Deals (10 min)
👉 **[FREE_PLAN_MIGRATION_OPTIONS.md](FREE_PLAN_MIGRATION_OPTIONS.md)**
- 4 opções analisadas
- Recomendação: Soft Archive
- Estratégia de comunicação
- Checklist de implementação

### Para Decisão sobre Scraping Provider (10 min)
👉 **[SCRAPING_PROVIDERS_ANALYSIS.md](SCRAPING_PROVIDERS_ANALYSIS.md)**
- 5 providers analisados
- Recomendação: Outscraper
- Custo/benefício
- Código de integração

---

## 🎯 Estrutura da Migração v2.0

```
ATUAL (v1.0):
┌─────────┐              ┌─────────┐
│  FREE   │──────────────│   PRO   │
│  R$ 0   │              │  R$ 97  │
└─────────┘              └─────────┘

NOVA (v2.0):
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  FREE   │────│ STARTER │────│   PRO   │────│BUSINESS │
│  R$ 0   │    │  R$ 49  │    │  R$ 97  │    │ R$ 149  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
    │              │              │              │
    │              │              │              │
 50 deals    Deals ∞      Deals ∞ +      Tudo PRO +
 IA: 3/mês   WhatsApp:    WhatsApp:      Round-robin
 Scraping:   Link         Chat Center    Team Reports
 5 inicial                Scraping:      Distribuição
                          50/mês         de Leads
                          Automação
                          IA: ∞
```

---

## 📋 Checklist de Aprovação

### ✅ Decisões Confirmadas
- [x] Implementação em fases (não tudo de uma vez)
- [x] Prioridade #1: Chat Center (WhatsApp integrado)
- [x] Clientes PRO atuais → BUSINESS com grandfathering 6 meses
- [x] Evolution API: Self-hosted (DigitalOcean)

### ⏳ Decisões Pendentes (Revisar Documentos)

**1. Scraping Provider ([Ver análise completa](SCRAPING_PROVIDERS_ANALYSIS.md))**
- [ ] Outscraper (Google Maps) - R$ 145/mês? **⭐ Recomendado**
- [ ] Apify (LinkedIn) - R$ 245/mês adicional? Apenas se demanda
- [ ] Custom scraper? NÃO recomendado

**2. Clientes FREE >50 Deals ([Ver análise completa](FREE_PLAN_MIGRATION_OPTIONS.md))**
- [ ] Opção A: Grandfathering (mantém todos os deals)?
- [ ] Opção B: Forced Downgrade (bloqueio hard)?
- [x] Opção C: Soft Archive (read-only)? **⭐ Recomendado**
- [ ] Opção D: Free Choice (cliente escolhe)?

**Recomendação:** Híbrido
- Clientes antigos (<2026-01-01): Grandfathering
- Clientes recentes (>=2026-01-01): Soft Archive

**3. Orçamento ([Ver executive summary](V2_EXECUTIVE_SUMMARY.md))**
- [ ] Aprovar R$ 1.500-3.000 (one-time)?
  - Designer: R$ 500-1.000
  - DevOps: R$ 1.000-2.000
- [ ] Aprovar R$ 300-450/mês (recorrente)?
  - DigitalOcean: R$ 48
  - Outscraper: R$ 145
  - Apify (opcional): R$ 245
  - Vercel Pro: R$ 100

**4. Data de Início**
- [ ] Quando começar Fase 1?
- [x] Sugestão: Imediatamente (2026-02-05)

---

## 🚀 Timeline (9 Semanas)

```
Semana 1-2: FASE 1 - Foundation
├─ Database migrations
├─ Entitlements system
├─ Stripe products
└─ Migração clientes PRO → BUSINESS

Semana 3-5: FASE 2 - Chat Center ⭐ PRIORIDADE
├─ Evolution API (self-hosted)
├─ Backend (connections + messages)
├─ Frontend (Chat UI completo)
└─ QR Code connection flow

Semana 6-7: FASE 3 - Scraping + Add-ons
├─ Outscraper integration
├─ Prospecção UI
├─ Marketplace de add-ons
└─ Sistema de créditos

Semana 8-9: FASE 4 - Business Features + Launch
├─ Round-robin (BUSINESS)
├─ Team reports (BUSINESS)
├─ IA quota system
├─ Cron jobs
├─ Documentação
└─ 🎬 LANÇAMENTO
```

---

## 💰 Projeção de Receita

### MRR Esperado (Cenário Conservador)

| Período | MRR | Crescimento |
|---------|-----|-------------|
| **Atual (v1.0)** | R$ 4.850 | - |
| **Mês 1 (v2.0)** | R$ 8.560 | +76% |
| **Mês 3** | R$ 9.305 | +92% |
| **Mês 6** | R$ 11.905 | +145% |

**ARR Projetado (Ano 1):** ~R$ 143.000

### Breakdown Mês 1
```
Clientes Existentes:
- 50 PRO → BUSINESS (grandfathered R$ 97) = R$ 4.850

Novos Clientes (30 dias):
- +10 STARTER × R$ 49 = R$ 490
- +7 PRO × R$ 97 = R$ 679
- +2 BUSINESS × R$ 149 = R$ 298

Add-ons (estimativa):
- 5 orgs × R$ 30/mês = R$ 150

TOTAL MRR: R$ 6.467 (Mês 1 conservador)
          R$ 8.560 (Mês 1 otimista)
```

---

## 📊 Métricas de Sucesso

### Adoção (30 dias)
- ✅ >70% dos PRO usam Chat Center
- ✅ >50% dos PRO usam Prospecção
- ✅ >20% conversão FREE → STARTER

### Financeiro (90 dias)
- ✅ MRR growth >30%
- ✅ LTV/CAC ratio >3.0
- ✅ Churn rate <5%

### Add-ons (60 dias)
- ✅ >10% de PRO compram add-ons
- ✅ AOV >R$ 50

---

## 🛠️ Stack Técnico Novo

### Infraestrutura Nova
- **Evolution API** (WhatsApp): DigitalOcean VPS (R$ 48/mês)
- **Outscraper** (Scraping): Starter plan (R$ 145/mês)
- **Apify** (LinkedIn - opcional): Starter plan (R$ 245/mês)

### Database Schema Novo
- `ScrapingCredit` - Controle de créditos de prospecção
- `Addon` - Add-ons comprados
- `WhatsAppConnection` - Conexões WhatsApp
- `AgiQuota` - Controle de quota de IA
- `LeadDistributionRule` - Regras de round-robin

### Features Novas
1. **Chat Center** - WhatsApp integrado no CRM
2. **Prospecção Automática** - Google Maps + LinkedIn scraping
3. **Add-ons Marketplace** - Compra de créditos extras
4. **Round-Robin** - Distribuição automática de leads (BUSINESS)
5. **Team Reports** - Ranking de vendedores (BUSINESS)
6. **IA Degustação** - 3 gerações grátis/mês (FREE)

---

## 🚨 Principais Riscos

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Evolution API instável | Alto | Média | Uptime monitoring + auto-restart |
| Scraping providers ban | Médio | Baixa | 3 providers de fallback |
| Churn em migração | Alto | Baixa | Comunicação clara + grandfathering |
| Bugs em produção | Médio | Média | Testes E2E + canary deployment |
| Custo scraping alto | Baixo | Baixa | Rate limiting + monitoring |

**Plano de Contingência:** Rollback em <2h se error rate >10% ou churn >5%

---

## 📞 Próximos Passos (Ordem de Prioridade)

### 1. APROVAR Decisões Pendentes (Hoje)
- [ ] Revisar [V2_EXECUTIVE_SUMMARY.md](V2_EXECUTIVE_SUMMARY.md)
- [ ] Decidir sobre [FREE_PLAN_MIGRATION_OPTIONS.md](FREE_PLAN_MIGRATION_OPTIONS.md)
- [ ] Decidir sobre [SCRAPING_PROVIDERS_ANALYSIS.md](SCRAPING_PROVIDERS_ANALYSIS.md)
- [ ] Aprovar orçamento

### 2. CONTRATAR Recursos (Esta Semana)
- [ ] Designer freelance (mockups Chat Center) - R$ 500-1.000
- [ ] DevOps consultoria (setup Evolution API) - R$ 1.000-2.000

### 3. PROVISIONAR Infraestrutura (Esta Semana)
- [ ] VPS DigitalOcean (Evolution API)
- [ ] Conta Outscraper (scraping)
- [ ] Configurar DNS (api-whatsapp.siriuscrm.com)

### 4. INICIAR Desenvolvimento (Próxima Semana)
- [ ] Começar [Fase 1: Foundation](ROADMAP_V2_MODULAR_PLANS.md#fase-1-foundation--schema-semanas-1-2)
- [ ] Setup do projeto no GitHub
- [ ] Comunicar equipe/stakeholders

---

## 📖 Glossário

**MRR:** Monthly Recurring Revenue (Receita Recorrente Mensal)
**ARR:** Annual Recurring Revenue (MRR × 12)
**LTV:** Lifetime Value (Valor do cliente ao longo da vida)
**CAC:** Customer Acquisition Cost (Custo de aquisição)
**Churn:** Taxa de cancelamento de clientes
**Grandfathering:** Manter condições antigas para clientes existentes
**AOV:** Average Order Value (Valor médio do pedido)
**Round-Robin:** Distribuição rotativa de leads entre vendedores

---

## 🔗 Links Úteis

**Documentação Interna:**
- [Roadmap Completo](ROADMAP_V2_MODULAR_PLANS.md)
- [Executive Summary](V2_EXECUTIVE_SUMMARY.md)
- [Análise FREE >50 Deals](FREE_PLAN_MIGRATION_OPTIONS.md)
- [Análise Scraping Providers](SCRAPING_PROVIDERS_ANALYSIS.md)

**Documentação Técnica (Criar depois):**
- `CHAT_CENTER_API.md` - API do Chat Center
- `SCRAPING_API.md` - API de Scraping
- `ENTITLEMENTS_GUIDE.md` - Guia de feature gates
- `MIGRATION_SCRIPT.md` - Script de migração

**External Resources:**
- [Evolution API Docs](https://doc.evolution-api.com/)
- [Outscraper API Docs](https://app.outscraper.com/api-docs)
- [Apify Docs](https://docs.apify.com/)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)

---

## ✅ Critérios de Sucesso Final

A migração v2.0 é considerada **COMPLETA E BEM-SUCEDIDA** quando:

**Técnico:**
- [ ] 100% dos testes E2E passando
- [ ] Chat Center funcionando em produção (PRO+)
- [ ] Scraping funcionando em produção (PRO+)
- [ ] Add-ons marketplace ativo
- [ ] Zero critical bugs em produção por 7 dias
- [ ] Performance: LCP <2.5s, FID <100ms

**Produto:**
- [ ] 100% dos clientes PRO migrados para BUSINESS
- [ ] FREE >50 deals: estratégia aplicada (0 reclamações)
- [ ] >50% dos PRO testaram Chat Center (primeiros 30 dias)
- [ ] >30% dos PRO usaram Prospecção (primeiros 30 dias)
- [ ] Pricing page atualizada e publicada

**Negócio:**
- [ ] Churn <5% nos primeiros 30 dias
- [ ] MRR growth >20% em 30 dias
- [ ] NPS >40 (primeiros 30 dias)
- [ ] >5% de PRO compraram add-ons (60 dias)
- [ ] Zero downtime crítico (>5min)

**Comunicação:**
- [ ] Changelog publicado
- [ ] Blog post publicado
- [ ] Emails de migração enviados (100%)
- [ ] Help center atualizado
- [ ] Support team treinado

---

## 📞 Contato

**Owner:** Jean (Dev Full-stack)
**Email:** [seu-email]
**Última Atualização:** 2026-02-04
**Versão:** 1.0

---

**Status:** 🟡 Aguardando Aprovação Final

👉 **PRÓXIMA AÇÃO:** Revisar [V2_EXECUTIVE_SUMMARY.md](V2_EXECUTIVE_SUMMARY.md) e aprovar decisões pendentes
