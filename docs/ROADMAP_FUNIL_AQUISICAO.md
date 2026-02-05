# Roadmap de Implementação: Funil de Aquisição Digital
## CRM para Representante Comercial

**Versão:** 1.0
**Data:** 2026-02-04
**Objetivo:** Transformar a fundamentação teórica em sistema executável de aquisição de clientes
**Palavra-chave alvo:** "crm para representante comercial"

---

## 📊 Visão Geral da Estratégia

### Jornada do Cliente (SPIN Framework)
```
Atração (Blog) → Conversão (GenUI/Lead Magnet) → Nutrição (Email 14 dias) → Vendas (Inside Sales) → Retenção
    ↓                    ↓                              ↓                         ↓                    ↓
 Situação             Problema                     Implicação              Necessidade            Sucesso
```

### Métricas Macro de Sucesso
- **Tráfego Orgânico:** +10% MoM
- **Conversão Blog → Lead:** > 5%
- **MQL → SQL:** > 15%
- **CAC:** < 1/3 do LTV
- **Churn:** < 2% ao mês

---

## 🎯 Fase 1: Setup e Infraestrutura Técnica
**Objetivo:** Preparar ambiente para implementação do funil

### 1.1 Configuração do Ambiente de Blog/Landing

**Decisão de Stack:**
- [ ] **Opção A:** Criar `/blog` dentro do Next.js existente (Recomendado)
  - Vantagem: Mesma base de código, Vercel AI SDK já disponível
  - Arquivos: `app/blog/[slug]/page.tsx`
- [ ] **Opção B:** WordPress separado + integração via API
  - Vantagem: Facilita produção de conteúdo por não-devs
  - Desvantagem: Complexidade de integração com GenUI

**Tarefas:**
```bash
# Se Opção A (Recomendado)
mkdir -p app/blog/\[slug\]
mkdir -p content/articles
mkdir -p components/blog
mkdir -p lib/blog
```

- [ ] Criar estrutura de pastas para blog
- [ ] Implementar MDX ou Markdown para artigos
- [ ] Configurar `generateStaticParams` para SEO
- [ ] Setup de metadados dinâmicos (OpenGraph, Twitter Cards)

**Arquivos a criar:**
```
app/blog/
├── page.tsx                    # Listagem de artigos
├── [slug]/
│   └── page.tsx                # Artigo individual
content/articles/
├── crm-representante-comercial.mdx  # Artigo pilar
components/blog/
├── article-layout.tsx          # Layout padrão
├── table-of-contents.tsx       # TOC dinâmico
├── reading-time.tsx            # Tempo de leitura
lib/blog/
├── get-articles.ts             # Loader de artigos
└── mdx-components.tsx          # Componentes customizados
```

### 1.2 Configuração do Vercel AI SDK

- [ ] Instalar dependências
```bash
npm install ai @ai-sdk/openai @ai-sdk/react
npm install zod  # Para validação de schemas
```

- [ ] Configurar variáveis de ambiente
```env
# .env.local
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo
```

- [ ] Criar Server Actions base
```typescript
// app/actions/ai-consultant.ts
'use server'

import { streamUI } from 'ai/rsc'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

export async function consultantChat(messages: Message[]) {
  // Implementação na Fase 3
}
```

### 1.3 Setup de Analytics e Tracking

- [ ] Configurar GA4 com eventos customizados
```typescript
// lib/analytics/events.ts
export const trackBlogEngagement = (articleSlug: string, timeOnPage: number) => {
  gtag('event', 'blog_engagement', {
    article_slug: articleSlug,
    time_on_page: timeOnPage,
    engagement_level: timeOnPage > 240 ? 'deep' : 'surface'
  })
}

export const trackGenUIInteraction = (stepName: string, userData: any) => {
  gtag('event', 'genui_interaction', {
    step: stepName,
    user_data: JSON.stringify(userData)
  })
}

export const trackLeadMagnetDownload = (magnetType: string) => {
  gtag('event', 'lead_magnet_download', {
    magnet_type: magnetType,
    conversion_source: 'blog'
  })
}
```

- [ ] Configurar Hotjar para heatmaps (opcional)
- [ ] Setup de tracking de scroll depth

**Checklist Fase 1:**
- [ ] Stack de blog definido e implementado
- [ ] Vercel AI SDK configurado
- [ ] Analytics tracking funcionando
- [ ] Ambiente de dev + staging configurado

---

## 🎯 Fase 2: Conteúdo - Artigo Pilar SEO
**Objetivo:** Criar artigo de atração otimizado para "crm para representante comercial"

### 2.1 Estrutura do Artigo (Arquitetura Semântica)

**Arquivo:** `content/articles/crm-representante-comercial.mdx`

**Outline obrigatório:**

```markdown
# CRM para Representante Comercial: Por que sua Planilha de Excel está custando 30% da sua Comissão (e como resolver)

## Introdução: A Realidade do Representante 4.0
- Cenário: 4 pastas, 15 clientes/dia, memória não é confiável
- Validação empática: "tirar pedido vs. vender valor"
- Thesis: O custo invisível da desorganização

## 1. Mobilidade & Offline: O Escritório no Bolso
- **Dor:** Perda de dados em áreas sem sinal
- **Solução:** Input offline, sincronização automática
- **Caso de uso:** Representante em zona rural
- [CTA: Calculadora de ROI - GenUI]

## 2. Gestão de Comissão: Auditoria Automática
- **Dor:** Desconfiança nos relatórios da representada
- **Estatística:** X% dos representantes já perderam comissão por erro de cálculo
- **Solução:** CRM como "cofre pessoal de dados"
- [CTA: Download Planilha de Comissão]

## 3. Mix de Produtos: Inteligência de Vendas
- **Dor:** Venda viciada só em curva A, baixo ticket médio
- **Solução:** Alertas de cross-sell, histórico de compras por cliente
- **Exemplo:** "Cliente compra produto X mas nunca comprou complemento Y"
- [CTA: Consultor Virtual - GenUI]

## 4. Roteirização: O Trajeto Mais Lucrativo
- **Dor:** Custo de combustível, tempo improdutivo
- **Solução:** Algoritmo de rota otimizada
- **ROI:** Economia de X km/mês = R$ Y economizados

## 5. O Custo Real da Desorganização (Implicação SPIN)
- Cálculo: 2 itens de mix não vendidos/dia × 22 dias = R$ Z/mês perdido
- Pergunta retórica: "Isso pagaria suas férias?"

## 6. Como Escolher um CRM (Necessidade SPIN)
- Checklist: Mobile-first, offline, multi-representada, auditoria de comissão
- Comparativo: CRM da fábrica vs. CRM próprio (propriedade de dados)

## Conclusão: A Virada Tecnológica
- CTA principal: "Teste grátis por 14 dias"
- CTA secundário: "Fale com consultor de vendas"

## FAQ
- Quanto custa?
- Funciona offline?
- Posso importar minha base de Excel?
- E se eu mudar de representada?
```

### 2.2 Tarefas de Produção de Conteúdo

- [ ] **Research de keywords relacionadas** (usar GSC + Ahrefs)
  - Variações: "crm para representação comercial", "sistema para representante", "app para vendedor externo"
  - Long-tail: "crm para representante farmacêutico", "crm para representante de alimentos"

- [ ] **Análise de SERP competitors**
  - Top 3 concorrentes para a keyword
  - Identificar gaps de conteúdo (o que eles NÃO cobrem)

- [ ] **Escrever rascunho do artigo** (3000-4000 palavras)
  - Aplicar linguagem do nicho: pasta, preposto, comissão, rota, mix
  - Evitar jargão corporativo: "pipeline", "gestão de funil"

- [ ] **Otimização On-Page**
  - [ ] Title tag: "CRM para Representante Comercial: Guia Completo 2026 [+ Calculadora Grátis]"
  - [ ] Meta description: "Descubra como CRM aumenta sua comissão em 30% gerenciando rotas, mix e comissões. Teste grátis + Calculadora de ROI."
  - [ ] H1, H2, H3 com keywords
  - [ ] Internal links para `/pricing`, `/features`, `/casos-de-sucesso`
  - [ ] Alt text em imagens
  - [ ] Schema.org Article markup

- [ ] **Elementos visuais**
  - [ ] Infográfico: "Antes vs. Depois do CRM" (Excel caótico vs. Dashboard organizado)
  - [ ] Screenshot: Interface mobile do CRM
  - [ ] Vídeo (opcional): Depoimento de representante real

**Checklist Fase 2:**
- [ ] Artigo escrito e revisado
- [ ] SEO on-page completo
- [ ] Visuais criados
- [ ] Artigo publicado em `/blog/crm-representante-comercial`

---

## 🎯 Fase 3: Generative UI - Consultor Virtual de Rentabilidade
**Objetivo:** Implementar chat interativo que gera análise personalizada em tempo real

### 3.1 Arquitetura do Consultor Virtual

**Componente embarcado no artigo:**
```typescript
// components/blog/roi-consultant-chat.tsx
'use client'

import { useChat } from 'ai/react'
import { SalesChart } from './sales-chart'
import { CommissionProjectionTable } from './commission-table'

export function ROIConsultantChat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/consultant-chat',
  })

  return (
    <div className="genui-consultant">
      <h3>💬 Consultor Virtual: Calcule seu Potencial</h3>
      <p>Responda 3 perguntas e descubra quanto você está perdendo:</p>

      {messages.map(m => (
        <div key={m.id}>
          {m.role === 'user' ? <UserMessage>{m.content}</UserMessage> : null}
          {m.role === 'assistant' ? <AIMessage>{m.content}</AIMessage> : null}
          {m.ui ? m.ui : null} {/* Componentes gerados dinamicamente */}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit">Enviar</button>
      </form>
    </div>
  )
}
```

### 3.2 Server Action com streamUI

**Arquivo:** `app/actions/consultant-chat.ts`

```typescript
'use server'

import { streamUI } from 'ai/rsc'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { SalesChart } from '@/components/blog/sales-chart'
import { CommissionProjectionTable } from '@/components/blog/commission-table'
import { LeadCaptureForm } from '@/components/blog/lead-capture-form'

const systemPrompt = `
Você é um consultor sênior especialista em produtividade para representantes comerciais.

Sua meta é diagnosticar ineficiências na rota e no mix de produtos do usuário.

Use a metodologia SPIN para fazer perguntas:
1. SITUAÇÃO: Quantas representadas você possui? Quantos clientes atende por semana?
2. PROBLEMA: Quanto tempo gasta organizando rotas e calculando comissões manualmente?
3. IMPLICAÇÃO: Se você deixar de vender 2 itens do mix por dia, quanto perde por mês?

Ao detectar dados suficientes (número de representadas, ticket médio, frequência de visitas),
chame a ferramenta 'generate_report' para mostrar um gráfico de perda financeira potencial.

Mantenha o tom:
- Profissional, empático
- Focado na realidade de vendas externa (estrada, visitas, catálogo)
- Use termos: "pasta", "preposto", "comissão", "rota", "mix"
- Evite: "pipeline", "funil", "lead"
`

interface UserData {
  numRepresentadas: number
  ticketMedio: number
  clientesPorSemana: number
  mixProdutos: number
}

export async function consultantChat(messages: Message[]) {
  const result = await streamUI({
    model: openai('gpt-4-turbo'),
    system: systemPrompt,
    messages,
    text: ({ content }) => <AIMessage>{content}</AIMessage>,
    tools: {
      generate_report: {
        description: 'Gera relatório visual de potencial de ganho',
        parameters: z.object({
          numRepresentadas: z.number().describe('Número de representadas'),
          ticketMedio: z.number().describe('Ticket médio mensal em R$'),
          clientesPorSemana: z.number().describe('Clientes atendidos por semana'),
          mixProdutos: z.number().describe('Número médio de produtos por representada'),
        }),
        generate: async function* ({ numRepresentadas, ticketMedio, clientesPorSemana, mixProdutos }) {
          yield <LoadingSpinner message="Calculando seu potencial..." />

          // Lógica de cálculo
          const vendaPotencialMensal = numRepresentadas * ticketMedio * 1.3 // 30% de potencial
          const perdaMensal = vendaPotencialMensal - (numRepresentadas * ticketMedio)
          const comissaoMedia = 0.05 // 5%
          const perdaComissao = perdaMensal * comissaoMedia

          const userData: UserData = {
            numRepresentadas,
            ticketMedio,
            clientesPorSemana,
            mixProdutos,
          }

          return (
            <div className="space-y-4">
              <SalesChart
                current={numRepresentadas * ticketMedio}
                potential={vendaPotencialMensal}
              />

              <CommissionProjectionTable
                perdaMensal={perdaMensal}
                perdaComissao={perdaComissao}
                scenario="sem_crm"
              />

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="font-bold text-lg">
                  💰 Você está deixando de ganhar R$ {perdaComissao.toFixed(2)} por mês em comissões!
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Isso representa R$ {(perdaComissao * 12).toFixed(2)} por ano.
                </p>
              </div>

              <LeadCaptureForm
                userData={userData}
                reportType="roi_analysis"
                ctaText="Baixar Relatório Completo + Plano de Ação Personalizado"
              />
            </div>
          )
        }
      },

      ask_follow_up: {
        description: 'Faz pergunta de follow-up para aprofundar diagnóstico',
        parameters: z.object({
          question: z.string().describe('Pergunta SPIN para o usuário'),
          context: z.enum(['situacao', 'problema', 'implicacao', 'necessidade'])
        }),
        generate: async function* ({ question, context }) {
          return <QuestionCard question={question} spinContext={context} />
        }
      }
    }
  })

  return result.value
}
```

### 3.3 Componentes de UI Gerados

**Arquivo:** `components/blog/sales-chart.tsx`

```typescript
'use client'

import { Bar } from 'recharts'
import { BarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface SalesChartProps {
  current: number
  potential: number
}

export function SalesChart({ current, potential }: SalesChartProps) {
  const data = [
    {
      name: 'Situação Atual',
      valor: current,
      fill: '#ef4444' // red
    },
    {
      name: 'Potencial com CRM',
      valor: potential,
      fill: '#22c55e' // green
    }
  ]

  const gap = potential - current

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h4 className="text-xl font-bold mb-4">Análise de Potencial de Vendas</h4>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => `R$ ${value.toLocaleString()}`} />
          <Legend />
          <Bar dataKey="valor" />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 p-4 bg-blue-50 rounded">
        <p className="text-sm text-gray-700">
          <strong>Gap de Oportunidade:</strong> R$ {gap.toLocaleString()} por mês
        </p>
        <p className="text-xs text-gray-500 mt-2">
          * Projeção baseada em otimização de mix e eliminação de perda de oportunidades
        </p>
      </div>
    </div>
  )
}
```

**Arquivo:** `components/blog/lead-capture-form.tsx`

```typescript
'use client'

import { useState } from 'react'
import { trackLeadConversion } from '@/lib/analytics/events'

interface LeadCaptureFormProps {
  userData: UserData
  reportType: string
  ctaText: string
}

export function LeadCaptureForm({ userData, reportType, ctaText }: LeadCaptureFormProps) {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1. Salvar lead no banco de dados
    const leadData = {
      email,
      phone,
      source: 'blog_genui',
      report_type: reportType,
      user_data: userData,
      score: calculateLeadScore(userData), // Função de scoring
      created_at: new Date().toISOString()
    }

    await fetch('/api/leads', {
      method: 'POST',
      body: JSON.stringify(leadData)
    })

    // 2. Enviar para automação de email (HubSpot/ActiveCampaign)
    await fetch('/api/email-automation/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        email,
        phone,
        tags: ['genui_roi_calculator', 'mql'],
        custom_fields: {
          num_representadas: userData.numRepresentadas,
          ticket_medio: userData.ticketMedio
        }
      })
    })

    // 3. Track conversão
    trackLeadConversion('genui_roi_calculator', email)

    // 4. Gerar e enviar relatório PDF
    const reportUrl = await generateReport(userData, email)

    // 5. Redirecionar para página de obrigado
    window.location.href = `/obrigado?report=${reportUrl}`

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
      <h4 className="text-xl font-bold mb-2">🎯 {ctaText}</h4>
      <p className="text-sm mb-4 opacity-90">
        Receba por email um relatório detalhado com seu plano de ação personalizado
      </p>

      <div className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu melhor email"
          required
          className="w-full px-4 py-2 rounded text-gray-900"
        />

        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="WhatsApp (opcional)"
          className="w-full px-4 py-2 rounded text-gray-900"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded transition"
        >
          {loading ? 'Gerando relatório...' : 'Baixar Relatório Grátis'}
        </button>
      </div>

      <p className="text-xs mt-3 opacity-75">
        ✓ Sem compromisso • ✓ Relatório instantâneo • ✓ Dados 100% seguros
      </p>
    </form>
  )
}

function calculateLeadScore(userData: UserData): number {
  let score = 0

  // Scoring demográfico
  if (userData.numRepresentadas > 2) score += 10
  if (userData.numRepresentadas > 4) score += 10 // Bonus
  if (userData.ticketMedio > 10000) score += 15
  if (userData.clientesPorSemana > 15) score += 10

  return score
}
```

### 3.4 Tarefas de Implementação

- [ ] Criar componente `ROIConsultantChat`
- [ ] Implementar Server Action `consultantChat`
- [ ] Criar componentes de UI: `SalesChart`, `CommissionProjectionTable`, `LeadCaptureForm`
- [ ] Implementar API `/api/leads` para salvar leads
- [ ] Integrar com HubSpot/ActiveCampaign via API
- [ ] Criar gerador de relatório PDF
- [ ] Criar página `/obrigado` com download do relatório
- [ ] Testes de fluxo completo

**Checklist Fase 3:**
- [ ] GenUI funcionando no artigo
- [ ] Componentes sendo gerados dinamicamente
- [ ] Lead capture funcionando
- [ ] Integração com email automation funcionando
- [ ] Taxa de conversão > 5% (meta)

---

## 🎯 Fase 4: Lead Magnets Tradicionais (Fallback)
**Objetivo:** Oferecer alternativas de conversão para usuários menos tech-savvy

### 4.1 Planilha de Cálculo de Comissão Complexa

**Arquivo:** `public/downloads/planilha-calculo-comissao.xlsx`

**Funcionalidades da planilha:**
- [ ] Múltiplas abas (uma por representada)
- [ ] Tabela de produtos com preços e % de comissão
- [ ] Faixas de comissão escalonadas (ex: 0-10k = 3%, 10-20k = 5%, >20k = 7%)
- [ ] Cálculo automático de comissão líquida
- [ ] Dashboard resumo mensal
- [ ] Comparativo: "Com CRM automatizado" vs "Manual"

**Landing page:** `app/recursos/planilha-comissao/page.tsx`

```typescript
export default function PlanilhaComissaoPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1>Planilha Gratuita: Calculadora de Comissão para Representantes</h1>

      <div className="grid md:grid-cols-2 gap-8 my-8">
        <div>
          <img src="/images/planilha-preview.png" alt="Preview da planilha" />
        </div>
        <div>
          <h2>O que você vai receber:</h2>
          <ul>
            <li>✅ Cálculo automático de comissões escalonadas</li>
            <li>✅ Suporte para até 5 representadas</li>
            <li>✅ Dashboard visual de performance</li>
            <li>✅ Vídeo tutorial de uso</li>
          </ul>

          <LeadCaptureForm
            magnetType="planilha_comissao"
            ctaText="Baixar Planilha Grátis"
          />
        </div>
      </div>

      <div className="bg-yellow-50 p-6 rounded mt-8">
        <h3>⚠️ Cansado de planilhas manuais?</h3>
        <p>
          O CRM faz tudo isso automaticamente, sem você precisar digitar nada.
          Descubra como em uma demonstração gratuita.
        </p>
        <button>Agendar Demonstração</button>
      </div>
    </div>
  )
}
```

### 4.2 Guia SPIN Selling para Representantes (PDF)

**Conteúdo do PDF:**
- [ ] Introdução: Por que representantes precisam vender consultivamente
- [ ] Seção 1: Perguntas de Situação (exemplos específicos)
- [ ] Seção 2: Perguntas de Problema (como descobrir dores)
- [ ] Seção 3: Perguntas de Implicação (agitar a dor)
- [ ] Seção 4: Perguntas de Necessidade (apresentar solução)
- [ ] Scripts prontos por segmento (farmácia, alimentos, construção)
- [ ] Checklist de preparação pré-visita
- [ ] CTA: "O CRM te lembra das perguntas certas em cada visita"

**Landing page:** `app/recursos/guia-spin-selling/page.tsx`

### 4.3 Tarefas

- [ ] Criar planilha Excel avançada
- [ ] Design do PDF (Canva ou Figma)
- [ ] Escrever conteúdo do guia SPIN
- [ ] Criar landing pages de download
- [ ] Setup de download tracking (GA4 events)
- [ ] Integrar com email automation (enviar email com material + sequência de nutrição)

**Checklist Fase 4:**
- [ ] Planilha criada e testada
- [ ] PDF do guia criado
- [ ] Landing pages publicadas
- [ ] Downloads sendo trackados
- [ ] Leads entrando na sequência de nutrição

---

## 🎯 Fase 5: Automação de Email - Sequência de Nutrição (14 dias)
**Objetivo:** Educar leads usando SPIN Selling e levá-los a solicitar demo/trial

### 5.1 Setup da Plataforma de Email

**Opções:**
- [ ] **HubSpot** (Recomendado para startups com budget)
  - Workflows avançados, lead scoring nativo, CRM integrado
- [ ] **ActiveCampaign** (Melhor custo-benefício)
  - Automações robustas, segmentação comportamental
- [ ] **Resend + Custom Logic** (Máximo controle)
  - API simples, React Email para templates

**Decisão:** ___________________

### 5.2 Estrutura da Sequência (14 dias)

#### Email 1 - Dia 0: Situação (Welcome)
**Assunto:** "Aqui está seu [Material] + O Segredo do Representante 4.0"

**Conteúdo:**
```
Olá [Nome],

Obrigado por baixar [Material]. O arquivo está anexo neste email.

Enquanto você explora o material, quero te fazer uma pergunta rápida:

💭 Atualmente, quanto tempo você gasta por semana organizando sua rota
   e calculando suas comissões manualmente?

A maioria dos representantes que atendemos gastava 8-10 horas por semana
nessas tarefas. E descobriram que esse tempo poderia estar sendo usado
para... vender mais.

Nos próximos dias, vou te mostrar como representantes estão dobrando
suas comissões sem trabalhar mais horas. Tudo através de um sistema
que trabalha por você.

Até breve,
[Assinatura]

P.S.: Respondeu a pergunta acima? Me conta por email, quero entender
sua rotina!
```

**Setup técnico:**
```typescript
// lib/email/sequences/representante-nurture.ts
import { Resend } from 'resend'
import WelcomeEmail from '@/emails/welcome-representante'

export async function sendWelcomeEmail(lead: Lead) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'Consultor CRM <consultor@seucrm.com>',
    to: lead.email,
    subject: `Aqui está seu ${lead.magnet_type} + O Segredo do Representante 4.0`,
    react: WelcomeEmail({
      name: lead.name,
      magnetType: lead.magnet_type,
      downloadUrl: lead.download_url
    }),
    tags: [
      { name: 'sequence', value: 'nurture-representante' },
      { name: 'day', value: '0' }
    ]
  })

  // Agendar próximo email
  await scheduleEmail(lead.id, 'day_2', 2) // 2 dias depois
}
```

#### Email 2 - Dia 2: Problema (A Armadilha da Memória)
**Assunto:** "A venda de R$ 5.000 que você perdeu sem perceber"

**Conteúdo:**
```
[Nome],

Deixa eu te contar uma história real...

Semana passada, conversei com um representante de produtos de limpeza.
Ele me disse que perdeu um cliente grande porque esqueceu de fazer
o follow-up de reposição.

O cliente ligou direto para a fábrica. E a fábrica colocou outro
representante no lugar.

💔 Você já passou por isso?

→ Esqueceu que o cliente precisava de reposição?
→ Não sabia que ele tinha comprado um produto concorrente?
→ Perdeu uma venda porque não lembrava do histórico dele?

A memória humana falha. Principalmente quando você atende 50, 80,
100 clientes diferentes.

Por isso representantes top estão usando CRM como "memória externa".
O sistema lembra por você.

Amanhã vou te mostrar QUANTO essa "falha de memória" está custando.

Abraço,
[Assinatura]

P.S.: Quantos clientes você perdeu nos últimos 12 meses? (responda com sinceridade)
```

#### Email 3 - Dia 5: Implicação (O Custo Financeiro)
**Assunto:** "R$ 18.000 deixados na mesa (e como evitar)"

**Conteúdo:**
```
[Nome],

Vamos fazer um exercício rápido:

Se você deixar de vender APENAS 2 itens do mix por dia...
E cada item tem um ticket de R$ 150...
E sua comissão é 5%...

→ Perda diária: R$ 15 em comissão
→ Perda mensal: R$ 330 (22 dias úteis)
→ Perda anual: R$ 3.960

Agora multiplica isso por 5 anos: R$ 19.800

🤯 Isso pagaria quantas férias em família?

E eu estou sendo CONSERVADOR. Muitos representantes deixam de vender
5-10 itens por dia simplesmente porque:

1. Não lembram de oferecer
2. Não sabem o histórico de compras do cliente
3. Não têm visibilidade do mix completo na hora da visita

Representantes que usam CRM reportam aumento médio de 20-30% nas vendas
SEM adicionar novos clientes. Apenas vendendo melhor para a base atual.

Quer saber como?

Agende uma conversa rápida comigo: [Link Calendly]

Até lá,
[Assinatura]
```

#### Email 4 - Dia 8: Necessidade de Solução (A Virada)
**Assunto:** "Como seria sua rotina com um 'assistente pessoal' 24/7?"

**Conteúdo:**
```
[Nome],

Imagine a seguinte cena:

Você chega no cliente. Antes de entrar, abre o celular.

O sistema te mostra:

✅ Último pedido: 15 dias atrás (produtos X, Y, Z)
✅ Alertas: Cliente não compra produto W há 3 meses (ele costumava comprar)
✅ Oportunidade: Novo produto lançado, perfeito para o perfil dele
✅ Margem de negociação: Desconto máximo autorizado é 8%

Você entra sabendo EXATAMENTE o que oferecer.
Sem ligar para a fábrica.
Sem depender da memória.
Sem perder oportunidades.

Resultado: venda de R$ 3.500 em 20 minutos.

Isso é o que um CRM faz por você.

📊 Dados reais dos nossos clientes:
- 50% menos tempo em tarefas administrativas
- 20% mais vendas (mesma base de clientes)
- 95% de precisão no cálculo de comissões
- 0 clientes perdidos por "esquecimento"

Quer ver como funciona na prática?

[Botão: Assistir Demo de 5 minutos]
[Botão: Falar com Consultor]

Abraço,
[Assinatura]

P.S.: 14 dias de teste grátis. Sem pedir cartão de crédito.
Comece hoje: [Link Trial]
```

#### Emails 5-7 (Dias 10, 12, 14): Sequência de Fechamento

**Dia 10:** Estudos de caso (Prova Social)
**Dia 12:** FAQ + Objeções (Responder "é caro", "dá trabalho")
**Dia 14:** Última chamada (Urgência + Oferta especial)

### 5.3 Implementação Técnica

**Arquivo:** `lib/email/scheduler.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { sendEmail } from './sender'

export async function scheduleEmail(leadId: string, emailType: string, delayDays: number) {
  const scheduledFor = new Date()
  scheduledFor.setDate(scheduledFor.getDate() + delayDays)

  await prisma.emailSchedule.create({
    data: {
      lead_id: leadId,
      email_type: emailType,
      scheduled_for: scheduledFor,
      status: 'pending'
    }
  })
}

// Cron job (Vercel Cron ou similar)
export async function processPendingEmails() {
  const now = new Date()

  const pending = await prisma.emailSchedule.findMany({
    where: {
      status: 'pending',
      scheduled_for: {
        lte: now
      }
    },
    include: {
      lead: true
    }
  })

  for (const schedule of pending) {
    try {
      await sendEmailByType(schedule.lead, schedule.email_type)

      await prisma.emailSchedule.update({
        where: { id: schedule.id },
        data: { status: 'sent', sent_at: new Date() }
      })

      // Agendar próximo email da sequência
      if (schedule.email_type === 'day_2') {
        await scheduleEmail(schedule.lead_id, 'day_5', 3)
      } else if (schedule.email_type === 'day_5') {
        await scheduleEmail(schedule.lead_id, 'day_8', 3)
      }
      // ... continua

    } catch (error) {
      await prisma.emailSchedule.update({
        where: { id: schedule.id },
        data: { status: 'failed', error: error.message }
      })
    }
  }
}
```

**Configurar Vercel Cron:**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/process-emails",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

### 5.4 Templates com React Email

**Arquivo:** `emails/welcome-representante.tsx`

```tsx
import { Html, Head, Body, Container, Section, Text, Button, Img } from '@react-email/components'

interface WelcomeEmailProps {
  name: string
  magnetType: string
  downloadUrl: string
}

export default function WelcomeEmail({ name, magnetType, downloadUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>

          <Section style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '40px' }}>
            <Img
              src="https://seucrm.com/logo.png"
              alt="Logo CRM"
              width="150"
              style={{ marginBottom: '30px' }}
            />

            <Text style={{ fontSize: '18px', color: '#333', marginBottom: '20px' }}>
              Olá {name},
            </Text>

            <Text style={{ fontSize: '16px', color: '#555', lineHeight: '1.6' }}>
              Obrigado por baixar <strong>{magnetType}</strong>.
            </Text>

            <Button
              href={downloadUrl}
              style={{
                backgroundColor: '#0070f3',
                color: '#fff',
                padding: '12px 30px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: '20px'
              }}
            >
              📥 Baixar Agora
            </Button>

            <Text style={{ fontSize: '16px', color: '#555', lineHeight: '1.6', marginTop: '30px' }}>
              Enquanto você explora o material, quero te fazer uma pergunta rápida:
            </Text>

            <Section style={{ backgroundColor: '#f0f7ff', padding: '20px', borderRadius: '6px', marginTop: '15px' }}>
              <Text style={{ fontSize: '15px', color: '#0066cc', fontWeight: 'bold', margin: 0 }}>
                💭 Atualmente, quanto tempo você gasta por semana organizando sua rota
                e calculando suas comissões manualmente?
              </Text>
            </Section>

            <Text style={{ fontSize: '14px', color: '#777', marginTop: '30px' }}>
              Até breve,<br />
              Equipe CRM
            </Text>
          </Section>

          <Text style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '20px' }}>
            Você está recebendo este email porque se inscreveu em nosso site.
            <br />
            <a href="{{unsubscribe_url}}" style={{ color: '#999' }}>Cancelar inscrição</a>
          </Text>

        </Container>
      </Body>
    </Html>
  )
}
```

### 5.5 Tarefas

- [ ] Escolher plataforma de email (HubSpot/ActiveCampaign/Resend)
- [ ] Escrever todos os 7 emails da sequência
- [ ] Criar templates com React Email
- [ ] Implementar scheduler de emails
- [ ] Configurar Vercel Cron
- [ ] Testar sequência completa (end-to-end)
- [ ] Setup de tracking (opens, clicks, conversions)
- [ ] Criar regras de segmentação (ex: se abriu email X, enviar Y)

**Checklist Fase 5:**
- [ ] Sequência de 14 dias implementada
- [ ] Emails sendo enviados automaticamente
- [ ] Open rate > 25%
- [ ] Click rate > 5%
- [ ] Conversão MQL → SQL > 15%

---

## 🎯 Fase 6: Sales Enablement - Inside Sales
**Objetivo:** Equipar o time de vendas com roteiros e ferramentas baseadas em SPIN

### 6.1 CRM de Vendas - Lead Management

**Implementação no Prisma:**

```prisma
// prisma/schema.prisma

model Lead {
  id                String   @id @default(cuid())
  email             String   @unique
  phone             String?
  name              String?

  // Source tracking
  source            String   // 'blog_genui', 'planilha_comissao', 'guia_spin'
  landing_page      String?
  utm_campaign      String?

  // Demographic data (from forms/chat)
  num_representadas Int?
  ticket_medio      Float?
  setor             String?

  // Behavioral data
  pages_visited     Json     // Array de URLs visitadas
  time_on_site      Int      // Segundos
  genui_interactions Int     @default(0)

  // Lead scoring
  score             Int      @default(0)
  grade             String   @default('C') // A, B, C, D

  // Status
  status            String   @default('new') // new, contacted, qualified, demo_scheduled, won, lost
  stage             String   @default('MQL') // MQL, SQL, Opportunity, Customer

  // Assignment
  assigned_to       String?  // User ID do vendedor

  // Timestamps
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  last_contact      DateTime?

  // Relations
  activities        Activity[]
  emails            EmailSchedule[]
  notes             Note[]
}

model Activity {
  id          String   @id @default(cuid())
  lead_id     String
  lead        Lead     @relation(fields: [lead_id], references: [id])

  type        String   // 'email_open', 'link_click', 'page_visit', 'form_submit', 'call', 'demo'
  description String
  metadata    Json?

  created_at  DateTime @default(now())
}

model Note {
  id          String   @id @default(cuid())
  lead_id     String
  lead        Lead     @relation(fields: [lead_id], references: [id])

  content     String   @db.Text
  author_id   String   // User ID do vendedor

  created_at  DateTime @default(now())
}
```

### 6.2 Lead Scoring Automatizado

**Arquivo:** `lib/sales/lead-scoring.ts`

```typescript
export function calculateLeadScore(lead: Lead, activities: Activity[]): number {
  let score = 0

  // === SCORING DEMOGRÁFICO ===

  // Número de representadas (fit de ICP)
  if (lead.num_representadas && lead.num_representadas > 2) score += 10
  if (lead.num_representadas && lead.num_representadas > 4) score += 10 // Bonus

  // Ticket médio (capacidade de pagamento)
  if (lead.ticket_medio) {
    if (lead.ticket_medio > 5000) score += 10
    if (lead.ticket_medio > 10000) score += 15
    if (lead.ticket_medio > 20000) score += 20
  }

  // Setor (fit de produto)
  const highValueSectors = ['farmaceutico', 'alimentos', 'construcao']
  if (lead.setor && highValueSectors.includes(lead.setor)) {
    score += 15
  }

  // === SCORING COMPORTAMENTAL ===

  // Interação com GenUI (alta intenção)
  if (lead.genui_interactions > 0) score += 25
  if (lead.genui_interactions > 3) score += 15 // Bonus

  // Visitas a páginas chave
  const keyPages = ['/pricing', '/features', '/demo']
  const visitedKeyPages = (lead.pages_visited as string[]).filter(
    url => keyPages.some(key => url.includes(key))
  )
  score += visitedKeyPages.length * 10

  // Engajamento com emails
  const emailOpens = activities.filter(a => a.type === 'email_open').length
  const emailClicks = activities.filter(a => a.type === 'link_click').length
  score += Math.min(emailOpens * 2, 20) // Máximo 20 pontos
  score += emailClicks * 5

  // Tempo no site (engajamento)
  if (lead.time_on_site > 300) score += 10 // 5+ minutos
  if (lead.time_on_site > 600) score += 10 // 10+ minutos

  // === GRADING ===

  let grade = 'D'
  if (score >= 80) grade = 'A' // SQL - Pronto para demo
  else if (score >= 60) grade = 'B' // MQL qualificado - Ligar
  else if (score >= 40) grade = 'C' // MQL - Continuar nutrição
  else grade = 'D' // Lead frio

  return { score, grade }
}

// Atualizar score automaticamente
export async function updateLeadScore(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { activities: true }
  })

  const { score, grade } = calculateLeadScore(lead, lead.activities)

  await prisma.lead.update({
    where: { id: leadId },
    data: { score, grade, updated_at: new Date() }
  })

  // Se atingiu SQL, notificar vendedor
  if (grade === 'A' && lead.grade !== 'A') {
    await notifySalesTeam(lead, 'New SQL - Schedule demo ASAP')
  }
}
```

### 6.3 Dashboard de Vendas

**Arquivo:** `app/admin/sales/page.tsx`

```typescript
export default async function SalesDashboardPage() {
  const leads = await prisma.lead.findMany({
    where: {
      stage: { in: ['SQL', 'Opportunity'] }
    },
    include: {
      activities: {
        orderBy: { created_at: 'desc' },
        take: 5
      }
    },
    orderBy: [
      { grade: 'asc' }, // A primeiro
      { score: 'desc' }
    ]
  })

  const stats = {
    totalSQLs: leads.filter(l => l.stage === 'SQL').length,
    totalOpportunities: leads.filter(l => l.stage === 'Opportunity').length,
    avgScore: leads.reduce((sum, l) => sum + l.score, 0) / leads.length,
    conversionRate: 0.15 // Calcular dinamicamente
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Sales Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="SQLs Ativos" value={stats.totalSQLs} />
        <StatCard label="Oportunidades" value={stats.totalOpportunities} />
        <StatCard label="Score Médio" value={Math.round(stats.avgScore)} />
        <StatCard label="Conv. MQL→SQL" value={`${stats.conversionRate * 100}%`} />
      </div>

      {/* Lead List */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th>Grade</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Score</th>
              <th>Representadas</th>
              <th>Última Atividade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} className="border-t hover:bg-gray-50">
                <td>
                  <GradeBadge grade={lead.grade} />
                </td>
                <td>{lead.name || 'N/A'}</td>
                <td>{lead.email}</td>
                <td>
                  <ScoreBadge score={lead.score} />
                </td>
                <td>{lead.num_representadas || 'N/A'}</td>
                <td>
                  {lead.activities[0]?.created_at
                    ? formatDistanceToNow(new Date(lead.activities[0].created_at), { addSuffix: true, locale: ptBR })
                    : 'Nunca'
                  }
                </td>
                <td>
                  <Button onClick={() => openLeadDetails(lead.id)}>
                    Ver Detalhes
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

### 6.4 Script de Vendas SPIN (Playbook)

**Arquivo:** `docs/SALES_PLAYBOOK.md`

```markdown
# Sales Playbook: CRM para Representantes Comerciais

## Pré-Call: Diagnóstico do Lead

Antes de ligar, revisar:

1. **Source:** Como o lead chegou?
   - GenUI ROI Calculator → Focar em ROI financeiro
   - Planilha de Comissão → Focar em segurança e auditoria
   - Guia SPIN → Focar em venda consultiva

2. **Score e Grade:**
   - Grade A (80+) → Ir direto para demo
   - Grade B (60-79) → Qualificar primeiro, depois demo
   - Grade C (40-59) → Educar mais, não vender ainda

3. **Dados demográficos:**
   - Número de representadas, ticket médio, setor

4. **Comportamento:**
   - Páginas visitadas, emails abertos, tempo no site

---

## Script SPIN

### 1. Abertura (Rapport)

> Oi [Nome], aqui é [Seu Nome] da [Empresa]. Tudo bem?
>
> Vi que você baixou nosso [Material] e queria entender melhor
> como está sua rotina hoje para ver se consigo te ajudar.
>
> Você tem uns 10 minutos agora?

### 2. Situação (Entender contexto)

**Objetivo:** Mapear a operação atual

Perguntas:
- "Quantas representadas você trabalha hoje?"
- "Como você organiza suas rotas e visitas atualmente?"
- "Você usa algum sistema hoje ou é tudo Excel/papel?"
- "Como você consolida os pedidos de cada fábrica?"

**Ouvir ativamente. Tomar notas.**

### 3. Problema (Descobrir dores)

**Objetivo:** Identificar ineficiências

Perguntas baseadas nas respostas de Situação:

Se usa Excel:
- "Quanto tempo você gasta por semana atualizando essas planilhas?"
- "Já aconteceu de perder dados ou não conseguir acessar quando precisava?"

Se tem múltiplas representadas:
- "Como você faz para lembrar qual produto ofertar para cada cliente?"
- "Já perdeu venda porque esqueceu que o cliente comprava determinado item?"

Sobre comissões:
- "Como você confere se a comissão que a fábrica te paga está correta?"
- "Já teve problema com erro de cálculo?"

### 4. Implicação (Agitar a dor)

**Objetivo:** Tornar o problema insuportável

Técnica: Quantificar a perda

> "Deixa eu te fazer uma conta rápida... Se você deixar de vender
> apenas 2 itens do mix por dia por falta de organização, e cada
> item tem ticket de R$ 150, com 5% de comissão..."
>
> "Você está perdendo R$ 15 por dia. R$ 330 por mês.
> Quase R$ 4.000 por ano."
>
> "Faz sentido esse cálculo? Você acha que está deixando dinheiro
> na mesa por desorganização?"

Outras perguntas de Implicação:
- "Esse tempo que você gasta em tarefas administrativas está te impedindo
  de abrir novos clientes?"
- "Quantos clientes você já perdeu por falta de follow-up nos últimos 12 meses?"
- "Se isso continuar assim, como vai estar sua operação daqui 2 anos?"

### 5. Necessidade de Solução (Apresentar CRM)

**Objetivo:** Fazer o lead pedir a solução

Perguntas:
- "Se eu te mostrasse um sistema que centraliza todas as suas representadas
  em uma única tela no celular, te avisa o que cada cliente precisa comprar,
  e calcula sua comissão automaticamente... isso resolveria?"

- "Como seria sua rotina se você tivesse um 'assistente digital' que lembrasse
  de tudo por você?"

**Aguardar resposta positiva.**

Então:
> "Perfeito. É exatamente isso que nosso CRM faz. Quer que eu te mostre
> como funciona em uma demonstração rápida de 15 minutos?"

---

## Agendamento de Demo

- "Que dia/horário funciona melhor para você?"
- Enviar convite de calendário (Calendly ou Google Calendar)
- Email de confirmação com:
  - Link da demo (Zoom/Meet)
  - Checklist de preparação (ter em mãos lista de representadas, exemplo de pedido)

---

## Matriz de Objeções

### "Já uso o sistema da fábrica"

**Resposta:**
> "Entendo. A questão é: o sistema da fábrica protege os DADOS DA FÁBRICA,
> não os seus. Se você sair dessa representada ou for desligado, você perde
> toda a sua base de clientes.
>
> Nosso CRM é o SEU cofre pessoal de dados. Você é dono da informação.
> Sempre. Isso faz sentido para você?"

### "É mais um custo fixo"

**Resposta:**
> "Eu entendo a preocupação. Mas pensa comigo: você tem carro, certo?
> É um custo fixo, mas é uma ferramenta de trabalho essencial.
>
> O CRM é a mesma coisa. Se ele te ajudar a recuperar UMA comissão
> errada ou fazer UMA venda a mais por mês, ele já se paga.
>
> Baseado no que você me contou [referenciar dados do lead], acredito
> que o retorno seria de [X]x o investimento. Faz sentido testarmos?"

### "Não tenho tempo para alimentar sistema"

**Resposta:**
> "Essa é exatamente a razão pela qual criamos nosso CRM! Ele foi
> desenhado para representantes que vivem na estrada.
>
> Você não precisa ficar digitando. O sistema:
> - Importa dados das fábricas automaticamente
> - Usa voz-para-texto (você fala, ele escreve)
> - Preenche campos automáticos
>
> O objetivo é você trabalhar MENOS, não mais. Posso te mostrar
> como isso funciona na demo?"

### "Vou pensar"

**Resposta (SPIN Implicação):**
> "Claro, entendo. Posso te fazer uma pergunta rápida antes?
>
> O que você me contou sobre [problema X] e [problema Y]... quanto
> tempo faz que você está lidando com isso?
>
> E quanto tempo mais você acha que consegue continuar assim antes
> de perder mais clientes ou comissões?
>
> Por isso eu sugiro: vamos fazer o teste grátis de 14 dias.
> Sem cartão, sem compromisso. Você só tem a ganhar. O que acha?"

---

## Fechamento

Se o lead aceitou demo:
- ✅ Agendar demo
- ✅ Enviar email de confirmação
- ✅ Adicionar lead no CRM como "Opportunity"
- ✅ Preparar apresentação personalizada

Se o lead ainda resiste:
- ✅ Enviar case study relevante
- ✅ Agendar follow-up em 3-5 dias
- ✅ Adicionar tarefa no CRM: "Follow-up - Enviar vídeo demo"
```

### 6.5 Tarefas

- [ ] Implementar schema de Lead no Prisma
- [ ] Criar função de lead scoring automatizado
- [ ] Criar dashboard de vendas (`/admin/sales`)
- [ ] Escrever Sales Playbook completo
- [ ] Treinar time de vendas no script SPIN
- [ ] Criar biblioteca de objeções + respostas
- [ ] Setup de call recording (Gong/Chorus.ai - opcional)
- [ ] Criar template de email de follow-up pós-call

**Checklist Fase 6:**
- [ ] CRM de vendas funcionando
- [ ] Lead scoring automático
- [ ] Vendedores treinados em SPIN
- [ ] Conversão SQL → Oportunidade > 50%
- [ ] Tempo médio até primeira call < 24h

---

## 🎯 Fase 7: Analytics e Otimização Contínua
**Objetivo:** Medir, analisar e otimizar cada etapa do funil

### 7.1 Dashboard de Métricas do Funil

**Arquivo:** `app/admin/analytics/funnel/page.tsx`

```typescript
export default async function FunnelAnalyticsPage() {
  const metrics = await calculateFunnelMetrics()

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Funil de Aquisição: Analytics</h1>

      {/* Funil Visual */}
      <FunnelChart data={metrics.funnelStages} />

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 my-8">
        <KPICard
          label="Tráfego Orgânico (Blog)"
          value={metrics.organicTraffic}
          change={metrics.organicTrafficGrowth}
          target={"+10% MoM"}
        />
        <KPICard
          label="Taxa de Conversão (Lead)"
          value={`${metrics.conversionRate}%`}
          change={metrics.conversionRateChange}
          target="> 5%"
        />
        <KPICard
          label="MQL → SQL"
          value={`${metrics.mqlToSqlRate}%`}
          change={metrics.mqlToSqlChange}
          target="> 15%"
        />
        <KPICard
          label="CAC"
          value={`R$ ${metrics.cac}`}
          change={metrics.cacChange}
          target="< R$ 500"
        />
      </div>

      {/* Tabela detalhada */}
      <MetricsTable metrics={metrics.detailed} />

      {/* Cohort Analysis */}
      <CohortAnalysis cohorts={metrics.cohorts} />
    </div>
  )
}

async function calculateFunnelMetrics() {
  // Query do banco de dados
  const totalVisitors = await prisma.pageView.count({
    where: { page_path: { contains: '/blog/crm-representante-comercial' } }
  })

  const totalLeads = await prisma.lead.count({
    where: { source: { in: ['blog_genui', 'planilha_comissao', 'guia_spin'] } }
  })

  const totalMQLs = await prisma.lead.count({
    where: { stage: 'MQL', grade: { in: ['A', 'B'] } }
  })

  const totalSQLs = await prisma.lead.count({
    where: { stage: 'SQL' }
  })

  const totalCustomers = await prisma.lead.count({
    where: { status: 'won' }
  })

  const conversionRate = (totalLeads / totalVisitors) * 100
  const mqlToSqlRate = (totalSQLs / totalMQLs) * 100

  return {
    funnelStages: [
      { stage: 'Visitantes', count: totalVisitors },
      { stage: 'Leads', count: totalLeads },
      { stage: 'MQLs', count: totalMQLs },
      { stage: 'SQLs', count: totalSQLs },
      { stage: 'Clientes', count: totalCustomers },
    ],
    organicTraffic: totalVisitors,
    conversionRate: conversionRate.toFixed(2),
    mqlToSqlRate: mqlToSqlRate.toFixed(2),
    // ... outros cálculos
  }
}
```

### 7.2 Tracking de Eventos Customizados

**Arquivo:** `lib/analytics/events.ts`

```typescript
// Eventos GA4 customizados

export const trackBlogView = (articleSlug: string) => {
  gtag('event', 'blog_view', {
    article_slug: articleSlug,
    content_type: 'blog_post',
  })
}

export const trackBlogEngagement = (articleSlug: string, scrollDepth: number, timeOnPage: number) => {
  gtag('event', 'blog_engagement', {
    article_slug: articleSlug,
    scroll_depth: scrollDepth,
    time_on_page: timeOnPage,
    engagement_level: timeOnPage > 240 ? 'deep' : 'surface'
  })
}

export const trackGenUIStart = (chatType: string) => {
  gtag('event', 'genui_start', {
    chat_type: chatType,
  })
}

export const trackGenUIStep = (chatType: string, step: string, userData: any) => {
  gtag('event', 'genui_step', {
    chat_type: chatType,
    step: step,
    user_data: JSON.stringify(userData)
  })
}

export const trackGenUIConversion = (chatType: string, email: string, userData: any) => {
  gtag('event', 'genui_conversion', {
    chat_type: chatType,
    email: email,
    value: calculateLeadValue(userData), // Valor estimado do lead
  })
}

export const trackLeadMagnetDownload = (magnetType: string, email: string) => {
  gtag('event', 'lead_magnet_download', {
    magnet_type: magnetType,
    email: email,
  })
}

export const trackEmailOpen = (emailType: string, leadId: string) => {
  gtag('event', 'email_open', {
    email_type: emailType,
    lead_id: leadId,
  })
}

export const trackEmailClick = (emailType: string, linkUrl: string, leadId: string) => {
  gtag('event', 'email_click', {
    email_type: emailType,
    link_url: linkUrl,
    lead_id: leadId,
  })
}

export const trackDemoScheduled = (leadId: string, source: string) => {
  gtag('event', 'demo_scheduled', {
    lead_id: leadId,
    source: source,
    value: 500, // Valor estimado de uma demo agendada
  })
}

export const trackDemoCompleted = (leadId: string, outcome: string) => {
  gtag('event', 'demo_completed', {
    lead_id: leadId,
    outcome: outcome, // 'won', 'lost', 'follow_up'
  })
}

export const trackSale = (leadId: string, value: number, plan: string) => {
  gtag('event', 'purchase', {
    transaction_id: leadId,
    value: value,
    currency: 'BRL',
    items: [{
      item_name: plan,
      price: value
    }]
  })
}
```

### 7.3 Feedback Loop: Vendas → Marketing

**Arquivo:** `lib/analytics/feedback-loop.ts`

```typescript
// Análise de objeções mais comuns

export async function analyzeCommonObjections() {
  // Query de todas as notas de vendas que mencionam objeções
  const notes = await prisma.note.findMany({
    where: {
      content: {
        contains: 'objeção' // ou usar NLP para detectar
      }
    }
  })

  // Categorizar objeções
  const objections = categorizeObjections(notes)

  // Top 3 objeções
  const top3 = objections.slice(0, 3)

  // Se "preço/caro" está no top 3, sugerir ação
  if (top3.some(o => o.category === 'price')) {
    await createMarketingTask({
      type: 'content_update',
      priority: 'high',
      description: 'Reforçar ROI e casos de sucesso no blog e emails. Objeção de preço está alta.',
      suggested_actions: [
        'Adicionar calculadora de ROI mais visível no artigo',
        'Criar case study com payback < 3 meses',
        'Email Dia 5 (Implicação) precisa ser mais forte'
      ]
    })
  }

  return top3
}

function categorizeObjections(notes: Note[]): Objection[] {
  const categories = {
    price: ['caro', 'custo', 'preço', 'investimento'],
    time: ['tempo', 'trabalho', 'complexo', 'complicado'],
    competition: ['já uso', 'fábrica', 'outro sistema'],
    trust: ['não confio', 'inseguro', 'não sei'],
  }

  const objections: Objection[] = []

  notes.forEach(note => {
    Object.entries(categories).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (note.content.toLowerCase().includes(keyword)) {
          objections.push({
            category,
            keyword,
            lead_id: note.lead_id,
            date: note.created_at
          })
        }
      })
    })
  })

  // Agrupar e contar
  const grouped = objections.reduce((acc, obj) => {
    const key = obj.category
    if (!acc[key]) acc[key] = { category: key, count: 0, examples: [] }
    acc[key].count++
    acc[key].examples.push(obj)
    return acc
  }, {} as Record<string, { category: string, count: number, examples: Objection[] }>)

  return Object.values(grouped).sort((a, b) => b.count - a.count)
}
```

### 7.4 Tarefas

- [ ] Implementar dashboard de analytics do funil
- [ ] Configurar todos os eventos GA4 customizados
- [ ] Criar script de análise de objeções
- [ ] Setup de relatório semanal automatizado (email para time)
- [ ] Implementar A/B testing no artigo (headlines, CTAs)
- [ ] Configurar alertas automáticos (ex: conversão caiu 20%)
- [ ] Criar processo de review mensal de métricas

**Checklist Fase 7:**
- [ ] Dashboard de analytics funcionando
- [ ] Todos os eventos sendo trackados
- [ ] Feedback loop implementado
- [ ] Relatórios semanais automatizados
- [ ] Otimização contínua em prática

---

## 📅 Cronograma Sugerido e Priorização

### Sprint 1-2: Fundação (Base Técnica)
- ✅ Fase 1: Setup e Infraestrutura
- Deliverables: Blog funcionando, AI SDK configurado, Analytics tracking

### Sprint 3-4: Conteúdo (Atração)
- ✅ Fase 2: Artigo Pilar SEO
- Deliverables: Artigo publicado, otimizado, indexado

### Sprint 5-7: Conversão (Diferencial Competitivo)
- ✅ Fase 3: Generative UI
- ✅ Fase 4: Lead Magnets
- Deliverables: Consultor Virtual funcionando, Planilha + PDF prontos

### Sprint 8-10: Automação (Nutrição)
- ✅ Fase 5: Email Automation
- Deliverables: Sequência de 14 dias rodando, segmentação funcionando

### Sprint 11-12: Vendas (Conversão Final)
- ✅ Fase 6: Sales Enablement
- Deliverables: CRM de vendas, lead scoring, time treinado

### Sprint 13+: Otimização (Contínua)
- ✅ Fase 7: Analytics e Feedback Loop
- Deliverables: Dashboard, relatórios, processo de otimização

---

## 🎯 Critérios de Sucesso por Fase

### Fase 1: Setup
- [ ] Blog rodando em produção
- [ ] AI SDK respondendo corretamente
- [ ] GA4 tracking funcionando

### Fase 2: Artigo
- [ ] Artigo indexado no Google
- [ ] Rankando nas primeiras 3 páginas para keyword alvo
- [ ] Tempo médio na página > 4 minutos

### Fase 3: GenUI
- [ ] Taxa de inicialização do chat > 10%
- [ ] Taxa de conclusão do fluxo > 60%
- [ ] Conversão GenUI → Lead > 5%

### Fase 4: Lead Magnets
- [ ] Downloads de lead magnets > 50/mês
- [ ] Taxa de conversão landing page > 15%

### Fase 5: Email Automation
- [ ] Open rate > 25%
- [ ] Click rate > 5%
- [ ] Conversão MQL → SQL > 15%

### Fase 6: Sales
- [ ] Leads sendo qualificados automaticamente
- [ ] Vendedores usando script SPIN
- [ ] Conversão SQL → Demo > 70%
- [ ] Conversão Demo → Cliente > 30%

### Fase 7: Analytics
- [ ] Dashboard atualizado diariamente
- [ ] Feedback loop gerando ações semanais
- [ ] CAC diminuindo MoM

---

## 🚀 Próximos Passos Imediatos

1. **Decisão de Stack:**
   - [ ] Blog dentro do Next.js ou WordPress separado?
   - [ ] Plataforma de email: HubSpot, ActiveCampaign ou Resend?

2. **Setup Inicial:**
   - [ ] Clone este roadmap para projeto management tool (Linear/Jira/Notion)
   - [ ] Criar issues/tasks para cada checkbox
   - [ ] Atribuir responsáveis por fase
   - [ ] Definir datas de milestone

3. **Começar Fase 1:**
   - [ ] Criar branch `feature/blog-setup`
   - [ ] Implementar estrutura de pastas
   - [ ] Configurar Vercel AI SDK
   - [ ] Setup de analytics

---

## 📚 Recursos e Referências

### Documentação Técnica
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [React Email](https://react.email/)
- [Prisma](https://www.prisma.io/docs)
- [GA4 Custom Events](https://developers.google.com/analytics/devguides/collection/ga4/events)

### Metodologia de Vendas
- [SPIN Selling - Neil Rackham](https://www.amazon.com/SPIN-Selling-Neil-Rackham/dp/0070511136)
- [Predictable Revenue - Aaron Ross](https://www.amazon.com/Predictable-Revenue-Business-Practices-Salesforce-com/dp/0984380213)

### Marketing de Conteúdo
- [Content Marketing Institute](https://contentmarketinginstitute.com/)
- [Ahrefs Blog](https://ahrefs.com/blog/)

### Generative UI
- [Generative UI Examples - Vercel](https://sdk.vercel.ai/examples)
- [AI SDK RSC Documentation](https://sdk.vercel.ai/docs/ai-sdk-rsc)

---

## ✅ Checklist Final de Implementação

- [ ] Todas as 7 fases implementadas
- [ ] Artigo pilar rankando nas primeiras 2 páginas
- [ ] GenUI convertendo > 5%
- [ ] Sequência de email com open rate > 25%
- [ ] Lead scoring funcionando automaticamente
- [ ] Dashboard de analytics atualizado
- [ ] CAC < 1/3 do LTV
- [ ] Churn < 2% ao mês
- [ ] Feedback loop gerando otimizações semanais
- [ ] Time de vendas atingindo meta de conversão

---

**Última atualização:** 2026-02-04
**Próxima revisão:** Após conclusão de cada fase

---

**Pronto para começar? Faça fork deste roadmap e comece pela Fase 1!** 🚀
