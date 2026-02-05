# 📊 Arquitetura v2.0 - Resumo Executivo

**Data:** 2026-02-04
**Versão:** 1.0
**Duração Total:** 9 semanas
**Investimento:** R$ 1.500-3.000 (one-time) + R$ 300-450/mês (recorrente)

---

## 🎯 Visão Geral

Migração do modelo de 2 planos (FREE/PRO) para 4 planos modularizados com features escalonadas.

### Estrutura Atual → Nova

```
ATUAL:
FREE (R$ 0) ────────────► PRO (R$ 97)

NOVA:
FREE (R$ 0) ► STARTER (R$ 49) ► PRO (R$ 97) ► BUSINESS (R$ 149-197)
```

---

## 💎 Principais Diferenciais por Plano

| Feature | FREE | STARTER | PRO | BUSINESS |
|---------|------|---------|-----|----------|
| **Deals** | 50 | ∞ | ∞ | ∞ |
| **Usuários** | 1 | 1 | ∞ | ∞ |
| **Pipelines** | 1 | 1 | ∞ | ∞ |
| **WhatsApp** | Link | Link | Chat Integrado | Chat Integrado |
| **IA (AGI)** | 3/mês | ✗ | ∞ | ∞ |
| **Scraping** | 5 (inicial) | ✗ | 50/mês | 50/mês |
| **Automação Email** | ✗ | ✗ | ✓ | ✓ |
| **Round-Robin** | ✗ | ✗ | ✗ | ✓ |
| **Team Reports** | ✗ | ✗ | ✗ | ✓ |
| **Analytics** | Básico | Básico | PRO | Business |

---

## 🚀 Timeline (9 Semanas)

```
Semanas 1-2: Foundation
├─ Schema migrations
├─ Entitlements system
├─ Stripe products
└─ Migração clientes

Semanas 3-5: Chat Center ⭐
├─ Evolution API (self-hosted)
├─ Backend (connections + messages)
├─ Frontend (Chat UI)
└─ QR Code flow

Semanas 6-7: Scraping + Add-ons
├─ Outscraper integration
├─ Prospecção UI
├─ Marketplace add-ons
└─ Sistema de créditos

Semanas 8-9: Business + Polish
├─ Round-robin
├─ Team reports
├─ IA quota system
├─ Cron jobs
└─ Documentação + Launch
```

---

## 💰 Projeção de Receita (90 dias)

### Cenário Conservador

**Base Atual:**
- 50 PRO × R$ 97 (grandfathered) = R$ 4.850/mês

**Novos Clientes (90 dias):**
- +30 STARTER × R$ 49 = R$ 1.470/mês
- +20 PRO × R$ 97 = R$ 1.940/mês
- +5 BUSINESS × R$ 149 = R$ 745/mês

**Add-ons:**
- 10 orgs × R$ 30/mês = R$ 300/mês

### MRR Projetado

| Período | MRR | vs Atual |
|---------|-----|----------|
| Atual (v1.0) | R$ 4.850 | - |
| Mês 1 (v2.0) | R$ 8.560 | +76% |
| Mês 3 | R$ 9.305 | +92% |
| Mês 6 | R$ 11.905 | +145% |

**ARR (Ano 1):** ~R$ 143.000

---

## 🎯 Métricas de Sucesso

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

## 🛠️ Decisões Técnicas

### Scraping Provider
**Escolhido:** Outscraper (Google Maps) + Apify (LinkedIn)
- Custo: ~R$ 0,10/100 leads
- Sem infra própria
- Escalável

### Evolution API
**Escolhido:** Self-hosted (DigitalOcean R$ 48/mês)
- Controle total
- Custo fixo
- Docker Compose

### Clientes FREE >50 Deals
**Escolhido:** Soft Archive (Opção C)
- Deals >50 ficam read-only
- Não perde dados
- Incentiva upgrade suave

### Grandfathering PRO → BUSINESS
**Estratégia:** 6 meses de R$ 97, depois R$ 149
- Recompensa early adopters
- Comunicação 30 dias antes

---

## 🚨 Principais Riscos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Evolution API downtime | Alto | Uptime monitoring + auto-restart |
| Scraping providers ban | Médio | 3 providers de fallback |
| Churn em migração | Alto | Comunicação clara + grandfathering |
| Bugs em produção | Médio | Testes E2E + canary deployment |

---

## 💸 Investimento Necessário

### Custos One-Time
- Designer (mockups): R$ 500-1.000
- DevOps (setup): R$ 1.000-2.000
- **Total:** R$ 1.500-3.000

### Custos Mensais Recorrentes
- DigitalOcean: R$ 48
- Outscraper: R$ 100-200
- Apify: R$ 50-100
- Vercel Pro: R$ 100
- **Total:** R$ 300-450/mês

**ROI:** Payback em <1 mês (baseado em +R$ 3.710 MRR no primeiro mês)

---

## ✅ Aprovações Necessárias

### Decisões Confirmadas ✅
- [x] Implementação faseada (9 semanas)
- [x] Prioridade #1: Chat Center
- [x] Clientes PRO → BUSINESS (grandfathering)
- [x] Evolution API self-hosted

### Decisões Pendentes ⏳
- [ ] Scraping provider: Outscraper? (recomendado)
- [x] FREE >50 deals: Soft Archive? (recomendado)
- [ ] Orçamento aprovado: R$ 1.500-3.000?
- [ ] Data de início: Quando?

---

## 🎬 Próximos Passos

1. **Aprovação Final** - Revisar e aprovar roadmap completo
2. **Contratar Designer** - Mockups do Chat Center
3. **Provisionar VPS** - DigitalOcean para Evolution API
4. **Iniciar Fase 1** - Schema migrations + entitlements

---

## 📈 Visão de Longo Prazo

### v2.0 (Atual) - Q1 2026
- 4 planos modularizados
- Chat Center
- Prospecção automática
- Add-ons marketplace

### v2.1 - Q2 2026
- A/B tests de pricing
- Mobile app (PWA++)
- API pública v1

### v3.0 - Q4 2026
- IA para previsão
- Advanced BI
- White-label
- Enterprise plan

---

**Status:** 🟡 Aguardando Aprovação Final
**Owner:** Jean (Dev Full-stack)
**Review Date:** 2026-02-04
