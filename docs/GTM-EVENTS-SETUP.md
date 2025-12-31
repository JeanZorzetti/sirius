# 📊 Configuração de Eventos do GTM - Sirius CRM

Este guia mostra como configurar o Google Tag Manager para capturar todos os eventos de conversão implementados no código.

## 🎯 Eventos Implementados

O código do Sirius agora envia os seguintes eventos via `dataLayer.push()`:

1. **`sign_up`** - Usuário completou cadastro
2. **`login`** - Usuário fez login
3. **`create_deal`** - Novo deal criado
4. **`create_contact`** - Novo contato criado
5. **`page_view`** (pricing) - Visualização da página de preços

## 🚀 Configuração Rápida (5 minutos)

### Passo 1: Acessar GTM

1. Acesse [Google Tag Manager](https://tagmanager.google.com/)
2. Selecione seu container: **GTM-5F6LM72D**
3. Clique em **"Workspace"**

### Passo 2: Criar Tag GA4 - Configuration (Base)

**Objetivo:** Configurar a base do GA4 que será usada por todos os eventos.

1. Clique em **Tags** → **Nova**
2. **Nome da tag:** `GA4 - Configuration`
3. **Configuração da tag:**
   - Tipo: **Google Analytics: GA4 Configuration**
   - Measurement ID: `G-WJE82VNKX8`
4. **Acionamento:**
   - Escolha: **Initialization - All Pages**
5. **Salvar**

### Passo 3: Criar Acionadores (Triggers) Personalizados

Agora vamos criar acionadores para cada evento customizado.

#### 3.1 - Trigger: Cadastro (Sign Up)

1. **Triggers** → **Novo**
2. **Nome:** `Custom Event - Sign Up`
3. **Tipo:** Custom Event
4. **Nome do evento:** `sign_up`
5. **Salvar**

#### 3.2 - Trigger: Login

1. **Triggers** → **Novo**
2. **Nome:** `Custom Event - Login`
3. **Tipo:** Custom Event
4. **Nome do evento:** `login`
5. **Salvar**

#### 3.3 - Trigger: Criar Deal

1. **Triggers** → **Novo**
2. **Nome:** `Custom Event - Create Deal`
3. **Tipo:** Custom Event
4. **Nome do evento:** `create_deal`
5. **Salvar**

#### 3.4 - Trigger: Criar Contato

1. **Triggers** → **Novo**
2. **Nome:** `Custom Event - Create Contact`
3. **Tipo:** Custom Event
4. **Nome do evento:** `create_contact`
5. **Salvar**

#### 3.5 - Trigger: View Pricing Page

1. **Triggers** → **Novo**
2. **Nome:** `Custom Event - Page View`
3. **Tipo:** Custom Event
4. **Nome do evento:** `page_view`
5. **Salvar**

### Passo 4: Criar Tags GA4 Event para cada conversão

Agora vamos criar tags que enviam esses eventos pro Google Analytics.

#### 4.1 - Tag: Sign Up Event

1. **Tags** → **Nova**
2. **Nome:** `GA4 - Event - Sign Up`
3. **Configuração da tag:**
   - Tipo: **Google Analytics: GA4 Event**
   - Configuration Tag: `GA4 - Configuration` (selecione a tag criada no Passo 2)
   - Event Name: `sign_up`
4. **Acionamento:**
   - Selecione: `Custom Event - Sign Up`
5. **Salvar**

#### 4.2 - Tag: Login Event

1. **Tags** → **Nova**
2. **Nome:** `GA4 - Event - Login`
3. **Configuração da tag:**
   - Tipo: **Google Analytics: GA4 Event**
   - Configuration Tag: `GA4 - Configuration`
   - Event Name: `login`
4. **Acionamento:**
   - Selecione: `Custom Event - Login`
5. **Salvar**

#### 4.3 - Tag: Create Deal Event

1. **Tags** → **Nova**
2. **Nome:** `GA4 - Event - Create Deal`
3. **Configuração da tag:**
   - Tipo: **Google Analytics: GA4 Event**
   - Configuration Tag: `GA4 - Configuration`
   - Event Name: `create_deal`
4. **Parâmetros do Evento** (clique em "Add Parameter"):
   - `value` → `{{Event - value}}`
   - `currency` → `{{Event - currency}}`
   - `deal_stage` → `{{Event - deal_stage}}`
5. **Acionamento:**
   - Selecione: `Custom Event - Create Deal`
6. **Salvar**

> **Nota:** Para os parâmetros funcionarem, você precisa criar **Variáveis** (próximo passo).

#### 4.4 - Tag: Create Contact Event

1. **Tags** → **Nova**
2. **Nome:** `GA4 - Event - Create Contact`
3. **Configuração da tag:**
   - Tipo: **Google Analytics: GA4 Event**
   - Configuration Tag: `GA4 - Configuration`
   - Event Name: `create_contact`
4. **Acionamento:**
   - Selecione: `Custom Event - Create Contact`
5. **Salvar**

#### 4.5 - Tag: Pricing Page View

1. **Tags** → **Nova**
2. **Nome:** `GA4 - Event - View Pricing`
3. **Configuração da tag:**
   - Tipo: **Google Analytics: GA4 Event**
   - Configuration Tag: `GA4 - Configuration`
   - Event Name: `view_pricing_page`
4. **Acionamento:**
   - Selecione: `Custom Event - Page View`
5. **Salvar**

### Passo 5: Criar Variáveis da Data Layer (opcional mas recomendado)

Para capturar os parâmetros dos eventos (valor do deal, stage, etc.):

1. **Variables** → **New**
2. **Nome:** `Event - value`
3. **Tipo:** Data Layer Variable
4. **Data Layer Variable Name:** `value`
5. **Salvar**

Repita para:
- `Event - currency` → `currency`
- `Event - deal_stage` → `deal_stage`
- `Event - deal_id` → `deal_id`
- `Event - contact_id` → `contact_id`
- `Event - method` → `method`

### Passo 6: Testar (Preview Mode)

1. No GTM, clique em **"Preview"** (Visualizar)
2. Digite: `http://localhost:3000` (ou URL de produção)
3. **Teste cada evento:**
   - Crie uma conta → Deve disparar `sign_up`
   - Faça login → Deve disparar `login`
   - Vá para `/pricing` → Deve disparar `page_view`
   - Crie um deal → Deve disparar `create_deal`
   - Crie um contato → Deve disparar `create_contact`

4. **Verificar no GTM Preview:**
   - No painel de debug, você verá cada evento sendo disparado
   - Clique no evento para ver os parâmetros (value, deal_stage, etc.)
   - Confirme que a tag GA4 correspondente foi acionada

### Passo 7: Publicar

Se tudo estiver funcionando:

1. Clique em **"Submit"** (Enviar)
2. **Nome da versão:** `v2 - Eventos de Conversão`
3. **Descrição:** `Rastreamento de cadastro, login, criação de deals e contatos`
4. Clique em **"Publish"** (Publicar)

## 📈 Verificar no Google Analytics

Após publicar e aguardar alguns minutos:

1. Acesse [Google Analytics](https://analytics.google.com/)
2. Vá em **Reports** → **Realtime** → **Events**
3. Você verá os eventos aparecendo em tempo real:
   - `sign_up`
   - `login`
   - `create_deal`
   - `create_contact`
   - `view_pricing_page`

## 🎯 Criar Conversões no GA4

Para usar esses eventos em campanhas de marketing:

1. No GA4, vá em **Admin** → **Events**
2. Marque os eventos como **Conversões**:
   - ✅ `sign_up` (Principal conversão!)
   - ✅ `create_deal`
   - `login` (opcional)
   - `create_contact` (opcional)

Agora você pode usar essas conversões no Google Ads!

## 🔧 Estrutura do Código (Referência)

### Eventos enviados via dataLayer

```javascript
// Cadastro
window.dataLayer.push({
  event: 'sign_up',
  method: 'email',
  user_id: 'abc123' // opcional
})

// Login
window.dataLayer.push({
  event: 'login',
  method: 'email',
  user_id: 'abc123' // opcional
})

// Criar Deal
window.dataLayer.push({
  event: 'create_deal',
  value: 5000.00,
  currency: 'BRL',
  deal_stage: 'Prospecção',
  deal_id: 'deal-xyz'
})

// Criar Contato
window.dataLayer.push({
  event: 'create_contact',
  contact_id: 'contact-abc'
})

// View Pricing
window.dataLayer.push({
  event: 'page_view',
  page_path: '/pricing',
  page_title: 'Pricing - Sirius CRM'
})
```

## 🚨 Troubleshooting

### Eventos não aparecem no GA4

1. **Verificar GTM Preview:** Os eventos estão sendo disparados?
2. **Verificar Tags:** As tags GA4 estão sendo acionadas?
3. **Verificar Measurement ID:** Está correto? (`G-WJE82VNKX8`)
4. **Aguardar:** Pode levar até 24h para aparecer em relatórios (mas Realtime é imediato)

### Parâmetros não aparecem

1. **Criar Variáveis:** Certifique-se de criar as variáveis da Data Layer
2. **Adicionar em Event Parameters:** Nas tags, adicione os parâmetros customizados

### GTM não carrega

1. **Verificar ID:** `GTM-5F6LM72D` está correto em `lib/analytics-config.ts`?
2. **Verificar bloqueadores:** Desative ad blockers para testar
3. **Console do navegador:** Procure por erros JavaScript

## 📊 Próximos Passos (Opcional)

### Adicionar Meta Pixel

Depois de configurar o GA4, você pode facilmente adicionar o Meta Pixel:

1. **Tags** → **Nova**
2. **Tipo:** Custom HTML
3. Cole o código do Meta Pixel
4. **Acionamento:** Use os mesmos triggers (sign_up, create_deal, etc.)

### Adicionar Google Ads Conversion

1. **Tags** → **Nova**
2. **Tipo:** Google Ads Conversion Tracking
3. **Conversion ID:** Seu ID do Google Ads
4. **Acionamento:** `Custom Event - Sign Up`

## ✅ Checklist Final

- [ ] GA4 Configuration Tag criada e publicada
- [ ] 5 Triggers customizados criados (sign_up, login, create_deal, create_contact, page_view)
- [ ] 5 Tags GA4 Event criadas e vinculadas aos triggers
- [ ] Variáveis da Data Layer criadas (value, currency, deal_stage, etc.)
- [ ] Testado em Preview Mode - todos os eventos disparam
- [ ] Publicado no GTM
- [ ] Eventos aparecendo no GA4 Realtime
- [ ] Eventos marcados como Conversões no GA4

## 🎉 Pronto!

Agora você tem rastreamento completo de conversões no Sirius CRM! 🚀

Todos os dados estarão disponíveis para:
- ✅ Otimizar campanhas de Google Ads
- ✅ Analisar funil de conversão
- ✅ Calcular CAC (Custo de Aquisição de Cliente)
- ✅ Medir ROI de cada canal de marketing
