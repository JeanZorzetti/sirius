# Landing Page: Vendas Automáticas (Sales Page)

## 🎯 Objetivo

Landing Page de alta conversão focada no modelo **self-service** de R$ 49/mês. Conecta a Calculadora de ROI ao fluxo de cadastro, eliminando fricção e objeções.

## 📍 URL

`/vendas-automaticas`

## 🎨 Design & Estrutura

### Paleta de Cores

- **Primária**: Azul (#3B82F6) - Confiança, profissionalismo
- **Secundária**: Branco/Zinc - Limpeza, clareza
- **CTAs**: Laranja (#F97316) - Urgência, ação
- **Sucesso**: Verde (#10B981) - Garantias, benefícios
- **Alerta**: Vermelho (#EF4444) - Problemas, perdas

### Seções Implementadas

#### 1. **Hero Section** - A Promessa

**Headline:**
> "Seu Processo de Vendas **Organizado** em 5 Minutos."

**Subheadline:**
> "Sem falar com vendedores. Sem reuniões de implantação. **Apenas crie sua conta e comece.**"

**CTAs:**
- Principal: "Começar Teste Grátis" (laranja, leva a `/register`)
- Secundário: "Ver Quanto Estou Perdendo" (outline, leva a `/ferramentas/calculadora-roi`)

**Trust Signals:**
- 🛡️ "Não pedimos cartão de crédito para testar"
- Social Proof: 50+ empresas, R$ 49/mês, 5 min para começar

---

#### 2. **Comparação** - Ancoragem de Preço

Tabela lado a lado comparando:

**CRM Tradicional** (❌ card vermelho):
- R$ 500+/mês
- Implantação cara (R$ 2.000+ de setup)
- Consultor chato (reuniões infinitas)
- Complexidade desnecessária
- Contrato longo (12 meses)
- Demora 2-4 semanas

**Sirius Self-Service** (✅ card azul com badge "Recomendado"):
- R$ 49/mês
- Pronto na hora (5 minutos)
- Você no controle (sem consultores)
- Simples e direto (só o essencial)
- Cancele quando quiser (1 clique)
- Use hoje mesmo

**Estratégia:**
- **Ancoragem de preço**: R$ 500+ faz o R$ 49 parecer barato
- **Contraste visual**: Vermelho (ruim) vs Azul (bom)
- **Linguagem clara**: "Chato", "Enrolando", "Firula" (fala como o usuário)

---

#### 3. **Preview do Produto** - O "Aha Moment"

**Objetivo:** Mostrar o CRM funcionando sem precisar explicar muito.

**Elementos:**
- Visual do pipeline Kanban (placeholder + cards de exemplo)
- 3 benefícios visuais:
  - ⚡ Arraste e Solte
  - 👥 Leads Ilimitados
  - ⏰ Follow-up Automático

**Por quê funciona:**
- **Show, don't tell**: Usuário VÊ o produto
- **Simplicidade visual**: Não precisa de manual

---

#### 4. **Seção de Preços** - O "No-Brainer"

**Card único** com destaque:

**Preço:** R$ 49/mês

**Benefícios incluídos:**
- ✅ Leads e Contatos Ilimitados
- ✅ Pipeline Kanban Visual
- ✅ Importação de Excel/CSV
- ✅ Integração WhatsApp
- ✅ Relatórios e Gráficos
- ✅ Tarefas e Follow-ups
- ✅ Aplicativo Mobile (PWA)
- ✅ Suporte por Email

**Garantia:**
> 🛡️ "Cancele com 1 clique quando quiser. Sem multa, sem burocracia."

**Trust Signals:**
- 💳 Sem cartão para testar
- 🛡️ Dados seguros
- ⏰ Cancele a qualquer momento

**CTA Final:**
- "Começar Agora por R$ 49/mês" (laranja, destaque)
- Link secundário: "Calcular Meu Vazamento de Vendas" (calculadora)

---

#### 5. **FAQ** - Matador de Objeções

**6 Perguntas estratégicas:**

1. **"Preciso de treinamento para usar?"**
   - ❌ Objeção: "É difícil de aprender"
   - ✅ Resposta: "Não. É intuitivo. Tour de 2 minutos."

2. **"Consigo importar meus contatos atuais?"**
   - ❌ Objeção: "Vou perder meus dados"
   - ✅ Resposta: "Sim! Excel, CSV, Google Contacts."

3. **"E se eu não gostar? Como cancelo?"**
   - ❌ Objeção: "Vou ficar preso"
   - ✅ Resposta: "1 clique. Sem motivo, sem multa."

4. **"Meus dados estão seguros?"**
   - ❌ Objeção: "Não confio em cloud"
   - ✅ Resposta: "SSL, backup diário, LGPD, Brasil."

5. **"R$ 49/mês é para sempre ou aumenta depois?"**
   - ❌ Objeção: "É pegadinha promocional"
   - ✅ Resposta: "R$ 49 é o preço. Não aumenta."

6. **"Funciona no celular?"**
   - ❌ Objeção: "Só funciona no computador"
   - ✅ Resposta: "Sim! PWA com offline e notificações."

**Estratégia:**
- **Antecipar objeções**: Responder antes de perguntar
- **Tom honesto**: Sem marketing falso
- **Especificidade**: Detalhes técnicos geram confiança

---

#### 6. **CTA Final** - Última Oportunidade

**Background:** Gradiente azul-indigo (urgência visual)

**Headline:**
> "Pare de Perder Vendas. Comece Hoje."

**Social Proof:**
> "Junte-se a 50+ empresas que organizaram suas vendas com o Sirius."

**CTAs:**
- Principal: "Criar Minha Conta Grátis" (branco, contraste)
- Secundário: "Calcular Meu ROI" (outline branco)

**Trust Signal final:**
> 🛡️ "Sem cartão • Sem contrato • Cancele quando quiser"

---

## 🔗 Fluxo de Conversão

```mermaid
graph TD
    A[Usuário vê anúncio/SEO] --> B[Calculadora de ROI]
    B --> C[Vê perda mensal em vermelho]
    C --> D[Clica: 'Ver Como Organizar por R$ 49']
    D --> E[Landing: /vendas-automaticas]
    E --> F{Convencido?}
    F -->|Sim| G[CTA: Começar Teste Grátis]
    F -->|Dúvida| H[Lê FAQ / Comparação]
    H --> G
    G --> I[/register - Cadastro]
    I --> J[Dashboard com Onboarding]
    J --> K[Usuário ativo]
```

## 🎯 Princípios de Conversão Aplicados

### 1. **Zero Friction**
- Sem formulários longos (só email/senha no /register)
- Sem cartão de crédito obrigatório
- Sem "agendar demo" (auto-atendimento)

### 2. **Ancoragem de Preço**
- Comparação com CRM Tradicional (R$ 500+)
- R$ 49 parece "barato demais para ser verdade"

### 3. **Prova Social**
- "50+ empresas" (credibilidade)
- Números específicos (não vago)

### 4. **Urgência Implícita**
- Calculadora mostra perda HOJE
- "Pare de perder R$ X todos os meses"

### 5. **Garantia Reversa do Risco**
- "Cancele com 1 clique"
- Sem multa, sem burocracia
- Usuário não tem nada a perder

### 6. **Linguagem do Usuário**
- "Consultor chato" (honesto)
- "Sem firula" (direto)
- "Enrolando" (real)

## 📊 Métricas para Acompanhar

### KPIs de Conversão

1. **Taxa de Conversão Geral**
   - `/vendas-automaticas` → `/register`
   - Meta: 5-10%

2. **Taxa de Rolagem**
   - Quantos usuários chegam até o FAQ?
   - Meta: 60%+

3. **Cliques em CTAs**
   - Hero CTA vs CTA Final
   - Qual converte mais?

4. **Tempo na Página**
   - Mínimo 2 minutos (leu conteúdo)
   - Se < 30s: bounce (não engajou)

5. **Origem do Tráfego**
   - Calculadora ROI → Vendas
   - Direto (anúncios)
   - Orgânico (SEO)

### Eventos para Track (GTM/Mixpanel)

```javascript
// Hero CTA
gtag('event', 'cta_click', {
  location: 'hero',
  destination: '/register'
})

// Comparação vista
gtag('event', 'section_view', {
  section: 'comparison_table'
})

// FAQ expandido
gtag('event', 'faq_click', {
  question: 'preciso_de_treinamento'
})

// CTA Final
gtag('event', 'cta_click', {
  location: 'final',
  destination: '/register'
})
```

## 🧪 A/B Tests Sugeridos

### 1. **Headlines**
- A: "Seu Processo de Vendas Organizado em 5 Minutos"
- B: "Pare de Perder Vendas. Organize Tudo em 5 Minutos"
- C: "CRM Self-Service por R$ 49/mês. Pronto em 5 Minutos"

### 2. **CTA Principal**
- A: "Começar Teste Grátis"
- B: "Criar Conta Grátis Agora"
- C: "Testar Sirius por R$ 0"

### 3. **Ancoragem de Preço**
- A: Tabela comparativa (atual)
- B: Lista de problemas → Solução Sirius
- C: Timeline: "Antes vs Depois do Sirius"

### 4. **Ordem das Seções**
- A: Hero → Comparação → Preview → Preço → FAQ (atual)
- B: Hero → Preview → Preço → Comparação → FAQ
- C: Hero → Comparação → Preço → Preview → FAQ

## 🚀 Melhorias Futuras

### Curto Prazo
- [ ] Screenshot real do Kanban no Preview
- [ ] Vídeo demo de 30 segundos
- [ ] Depoimentos de clientes (quando tiver)
- [ ] Chatbot para objeções em tempo real

### Médio Prazo
- [ ] Versões segmentadas por nicho:
  - `/vendas-automaticas/corretores`
  - `/vendas-automaticas/energia-solar`
  - `/vendas-automaticas/agencias`
- [ ] Calculadora de ROI embedded na página
- [ ] Live demo interativo (Kanban fake funcional)

### Longo Prazo
- [ ] Personalização por indústria (detectar origem)
- [ ] Exit-intent popup com desconto/trial estendido
- [ ] Retargeting pixel para remarketing

## 🔧 Manutenção

### Atualizar Quando:
- Mudança de preço (R$ 49 → outro valor)
- Novo recurso importante (adicionar no card de preços)
- Novo depoimento/case (adicionar social proof)
- Mudança na política de cancelamento

### SEO
- **Title:** "Sirius CRM - Vendas Organizadas em 5 Minutos | R$ 49/mês"
- **Description:** "CRM self-service sem implantação cara. Organize suas vendas agora por R$ 49/mês. Sem cartão para testar, cancele quando quiser."
- **Keywords:** crm barato, crm self-service, crm simples, crm R$ 49, organizar vendas

### Performance
- Lazy load do preview do Kanban
- Otimizar imagens (quando adicionar)
- Minimizar CSS/JS (Next.js já faz)

---

## 📱 Responsividade

Testado em:
- ✅ Desktop (1920px+)
- ✅ Laptop (1366px)
- ✅ Tablet (768px)
- ✅ Mobile (375px)

Breakpoints do Tailwind CSS:
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px

---

## 💡 Por Que Essa Página Funciona?

### Psicologia de Vendas Aplicada

1. **Contraste (Ancoragem)**
   - CRM Tradicional caro vs Sirius barato
   - Problema vermelho vs Solução azul

2. **Prova Social**
   - "50+ empresas" (não está sozinho)
   - Números específicos (credibilidade)

3. **Garantia Reversa**
   - "Cancele com 1 clique"
   - Remove o risco da decisão

4. **Escassez Implícita**
   - "Pare de perder R$ X **AGORA**"
   - Calculadora cria urgência

5. **Clareza Radical**
   - Sem jargão técnico
   - Linguagem do usuário
   - Visual limpo

### Modelo Self-Service

Esta página é projetada para:
- ❌ **NÃO** ter formulário de "falar com vendas"
- ❌ **NÃO** ter "agendar demo"
- ❌ **NÃO** ter telefone de contato
- ✅ **SIM** ter CTA direto para /register
- ✅ **SIM** ter FAQ completo (self-service)
- ✅ **SIM** ter transparência total (preço, cancelamento)

---

**Resultado Final:** Uma landing page que converte tráfego frio (da calculadora, SEO, anúncios) em cadastros qualificados, sem precisar de equipe de vendas.

**Custo de Aquisição:** Reduzido drasticamente (CAC baixo).

**Taxa de Conversão Esperada:** 5-10% (vs 1-2% de landing genérica).

---

**Criado para:** Sirius CRM
**Versão:** 1.0
**Data:** Janeiro 2026
