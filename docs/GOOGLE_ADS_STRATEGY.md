# Estratégia Google Ads — Sirius CRM
**Versão:** 1.0
**Data:** 2026-03-26
**Contexto:** 3 vendas orgânicas validadas (2 PRO + 1 Business) entre 17-25/03/2026.
**Objetivo:** Escalar aquisição com CAC ≤ R$200 e payback ≤ 2 meses.

---

## 1. Premissas Estratégicas

### Por que Google Ads agora?
- SEO validou demanda real: o mercado existe e converte
- Keywords orgânicas já identificadas → transferir para Search Ads com alto intent
- 3 clientes reais = personas concretas para targeting
- GTM já configurado → rastreamento de conversão pronto para ativar

### Tese central
> Capturar a mesma intenção de compra que gerou as 3 vendas orgânicas, mas em escala e velocidade 10x maior. SEO demora 3 meses; Google Ads entrega tráfego qualificado em 48h.

---

## 2. Estrutura de Campanhas (Account Architecture)

```
Conta Google Ads
│
├── Campanha 1: Search — Branded
│   └── Ad Group: Sirius CRM
│       Keywords: "sirius crm", "sirius crm brasil", "siriuscrm"
│
├── Campanha 2: Search — Problema/Solução (TOPO)
│   ├── Ad Group: CRM Geral
│   │   Keywords: "crm para vendedores", "software crm pme", "crm barato brasil"
│   ├── Ad Group: Representante Comercial
│   │   Keywords: "crm para representante comercial", "crm representante de vendas"
│   └── Ad Group: Corretor de Imóveis
│       Keywords: "crm corretor de imóveis", "crm imobiliário"
│
├── Campanha 3: Search — Comparação/Alta Intenção (FUNDO)
│   └── Ad Group: Alternativas
│       Keywords: "alternativa ao pipedrive", "crm mais barato que pipedrive",
│                 "alternativa rdstation crm", "crm sem contrato", "crm gratuito brasil"
│
└── Campanha 4: Remarketing — Display/YouTube
    ├── Ad Group: Visitantes site (sem conversão)
    └── Ad Group: Abandonaram trial/cadastro
```

---

## 3. Palavras-chave Prioritárias

### Tier 1 — Alta Intenção (começar aqui)
| Keyword | Intenção | Est. CPC (BR) | Est. Volume/mês |
|---------|----------|---------------|-----------------|
| crm para representante comercial | Alta | R$4–8 | 500–1k |
| crm para vendedores | Alta | R$5–10 | 1k–5k |
| software crm pme | Alta | R$6–12 | 500–1k |
| crm sem contrato | Alta | R$4–7 | 100–500 |
| alternativa ao pipedrive | Alta | R$8–15 | 100–500 |
| crm barato brasil | Alta | R$3–6 | 500–1k |

### Tier 2 — Médio Intent (escalar após validar Tier 1)
| Keyword | Intenção | Est. CPC (BR) |
|---------|----------|---------------|
| crm corretor de imóveis | Alta | R$5–10 |
| gestão de leads | Média | R$3–6 |
| pipeline de vendas software | Alta | R$4–8 |
| crm com inteligência artificial | Alta | R$6–12 |

### Negativar (desde o início)
```
-emprego -vaga -curso -apostila -grátis para sempre -open source
-salesforce enterprise -hubspot enterprise (se budget for low)
```

---

## 4. Criativos dos Anúncios (RSA)

### Template por Ad Group

**Headline 1–3 (testar variações):**
- `CRM com IA para Vendedores | Sem Contrato`
- `Organize suas Vendas em 5 Minutos`
- `Feche Mais Negócios com Sirius CRM`
- `R$97/mês — Cancele Quando Quiser`
- `CRM Brasileiro com IA Nativa`

**Description 1–2:**
- `Pipeline visual + IA que qualifica leads e sugere próximos passos. Teste grátis 7 dias.`
- `Substitua planilhas Excel por um CRM que funciona. +100 representantes usam. Ative hoje.`

**Call to Action:** `Começar Grátis` ou `Testar 7 Dias`

### Para campanha "Alternativas/Comparação":
- `Pipedrive Caro Demais? Conheça o Sirius CRM`
- `CRM Completo por R$97/mês — 50% mais barato que Pipedrive`

---

## 5. Landing Pages

### Regra: 1 keyword group = 1 landing page dedicada

| Campanha | URL de destino | Foco |
|----------|---------------|------|
| Representante Comercial | `/representante-comercial` | Dores específicas do rep |
| CRM Geral | `/` (homepage) ou `/crm-para-vendedores` | Proposta geral |
| Alternativas | `/vs-pipedrive` | Comparação direta |
| Remarketing | `/oferta` | Urgência + social proof |

### Checklist de cada LP (Score de Qualidade Google):
- [ ] Keyword principal no `<h1>`
- [ ] CTA acima do fold
- [ ] Prova social (clientes reais, depoimentos)
- [ ] Core Web Vitals: LCP < 2.5s (verificar Vercel Analytics)
- [ ] Form de cadastro simples (email + nome)
- [ ] Pixel de conversão via GTM ativo

---

## 6. Rastreamento de Conversões (GTM)

### Eventos a rastrear (Google Ads Conversion)
```
1. Cadastro trial (Primary) → Valor: R$0 (mas é o evento principal)
2. Upgrade para PRO/Business (Primary) → Valor: R$97 ou R$X
3. Lead form submit (Secondary) → Valor: R$0
```

### Setup via GTM (já configurado):
1. Criar Conversão no Google Ads → copiar Conversion ID + Label
2. No GTM: Trigger = evento `cadastro_realizado` (já deve existir)
3. Tag = Google Ads Conversion Tracking
4. Verificar com Google Tag Assistant

---

## 7. Orçamento e Projeções

### Fase 1 — Teste e Calibração (Semanas 1–4)
**Budget:** R$1.500 – R$2.000/mês (R$50–65/dia)

| Campanha | Budget/dia | Objetivo |
|----------|-----------|---------|
| Search Tier 1 | R$35–40 | Validar CPL |
| Branded | R$5 | Proteger marca |
| Remarketing | R$10–15 | Reativar visitantes |

**Métricas alvo (Fase 1):**
- CTR Search: > 5%
- CPL (lead/trial): < R$80
- Conv. lead → pago: > 10% (com base no orgânico)
- CAC estimado: R$80/0.10 = R$800 → reduzir com otimização

> **Nota:** CAC inicial será alto. É normal. O SEO converteu com 0 custo de mídia, mas Google Ads tem custo. O objetivo é checar se o funil funciona antes de escalar.

### Fase 2 — Otimização (Semanas 5–8)
**Budget:** R$3.000 – R$5.000/mês
**Objetivo:** CAC ≤ R$400 (2x target, aceitável no início)

### Fase 3 — Escala (Mês 3+)
**Budget:** R$8.000 – R$15.000/mês
**Objetivo:** CAC ≤ R$200 (target original)

---

## 8. Estratégia de Lances (Bidding)

### Fase 1 (sem dados históricos):
- **Tipo:** CPC Manual ou Maximizar Cliques com teto de R$12
- **Razão:** Não usar Smart Bidding sem dados — o algoritmo precisa de 30+ conversões/mês para funcionar bem

### Fase 2 (após 30+ conversões):
- Migrar para **tCPA** (target CPA) = R$300–400 primeiro, reduzir gradualmente

### Fase 3 (escala):
- **tROAS** ou **Maximizar Conversões** com meta de CAC ≤ R$200

---

## 9. Audiências e Remarketing

### Audiências de Remarketing (Google Analytics → Google Ads):
1. **Todos os visitantes (últimos 30 dias)** — base
2. **Visitou /pricing mas não cadastrou** — Alta intenção, bid +30%
3. **Iniciou cadastro mas abandonou** — Maior intenção, mensagem de urgência
4. **Usuários trial não convertidos** — Sequência de nurturing via Display

### Audiências In-Market (Google):
- "CRM Software"
- "Business Software"
- "Sales Management Tools"

### Customer Match (se tiver emails):
- Criar lista com emails de leads existentes → excluir de aquisição, incluir em upsell

---

## 10. Cronograma de Implementação

### Semana 1 (Setup)
- [ ] Criar conta Google Ads (ou acessar existente)
- [ ] Linkar Google Ads ↔ Google Analytics 4
- [ ] Configurar conversões no GTM (cadastro + upgrade)
- [ ] Criar estrutura de campanhas (sem ativar)
- [ ] Escrever RSA para cada ad group (3 headlines, 2 descriptions mínimo)
- [ ] Verificar landing pages (Core Web Vitals, CTA, form)

### Semana 2 (Lançamento Campanha 2 e Branded)
- [ ] Ativar Branded + Search Tier 1 (representante comercial + crm vendedores)
- [ ] Budget: R$50/dia
- [ ] Monitorar diariamente: impressões, CTR, clicks por keyword
- [ ] Ajustar negativos conforme search terms aparecem

### Semana 3–4 (Análise e Ajuste)
- [ ] Avaliar CTR por ad group (meta > 5%)
- [ ] Pausar keywords com CPC > R$15 sem conversão
- [ ] Adicionar keywords de baixo CPC que aparecem no search term report
- [ ] Ativar remarketing com visitantes acumulados

### Semana 5–8 (Otimização)
- [ ] Analisar CPL por campanha
- [ ] Expandir budget nas campanhas lucrativas
- [ ] Testar campanha "Alternativas" (vs Pipedrive)
- [ ] Migrar para tCPA se tiver 30+ conversões

---

## 11. KPIs e Dashboard de Acompanhamento

### Métricas semanais:
| Métrica | Meta Fase 1 | Meta Fase 3 |
|---------|-------------|-------------|
| CTR | > 4% | > 6% |
| CPC médio | < R$10 | < R$8 |
| CPL (trial) | < R$100 | < R$60 |
| Trial → Pago | > 8% | > 15% |
| CAC final | < R$600 | < R$200 |
| ROAS | > 0.3x | > 2x |

### Red flags (pausar e revisar):
- CPC > R$20 sem conversão em 100+ cliques
- CTR < 2% em ad group → reescrever criativos
- Quality Score < 5 → melhorar landing page relevância

---

## 12. Pré-requisitos Técnicos

### Antes de lançar:
- [ ] Google Analytics 4 configurado e recebendo dados
- [ ] GTM publicado com eventos de conversão
- [ ] Conversão de "cadastro" ou "trial" testada via Tag Assistant
- [ ] Landing pages com LCP < 2.5s (testar em PageSpeed Insights)
- [ ] Form de cadastro funcionando e registrando via GA4

### Nice to have (antes de Fase 2):
- [ ] Página `/vs-pipedrive` criada
- [ ] Depoimentos/social proof visíveis no fold
- [ ] Chat ou chat popup nas landing pages de alta intenção

---

## 13. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| CAC inicial muito alto (> R$800) | Alta | Normal no início; focar em otimizar funil antes de escalar budget |
| Quality Score baixo | Média | Garantir relevância keyword → ad → landing page |
| Concorrentes com bid alto | Média | Focar em long-tail + nichos (representante comercial > crm geral) |
| Budget gasto sem conversão | Baixa | Negativar agressivamente + teto de CPC no início |
| Landing page lenta | Baixa | Vercel + Next.js já é rápido; verificar imagens |

---

## Próximo Passo Imediato

1. **Confirmar acesso:** Tem conta Google Ads criada ou precisamos criar?
2. **Confirmar conversões GTM:** Os eventos de `cadastro_realizado` e `upgrade_realizado` já estão disparando no GTM?
3. **Confirmar pricing Business:** Qual é o valor exato do plano Business (para calcular LTV e ROAS)?
4. **Identificar qual keyword trouxe as 3 vendas orgânicas** → essas são as primeiras a ativar no Ads
