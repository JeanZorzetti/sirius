# 🏷️ Google Tag Manager - Guia de Configuração

Este guia explica como configurar o Google Tag Manager (GTM) no Sirius CRM.

## 📋 Por que usar GTM?

O GTM permite gerenciar todas as suas tags de rastreamento (Google Analytics, Meta Pixel, LinkedIn, etc.) em um único lugar, sem precisar alterar código.

**Benefícios:**
- ✅ Adicionar/remover tags sem deploy
- ✅ Testar tags antes de publicar
- ✅ Gerenciar múltiplas ferramentas de analytics
- ✅ Configurar eventos personalizados
- ✅ A/B testing e remarketing

## 🚀 Passo 1: Criar Conta GTM

1. Acesse: https://tagmanager.google.com/
2. Clique em **"Criar conta"**
3. Preencha:
   - **Nome da conta**: Sirius CRM (ou ROI Labs)
   - **País**: Brasil
   - **Nome do contêiner**: sirius.roilabs.com.br
   - **Plataforma de destino**: Web
4. Aceite os termos e clique em **"Criar"**

## 📝 Passo 2: Copiar o ID do GTM

Após criar, você verá uma tela com dois códigos.

**Copie o ID do GTM** que aparece assim: `GTM-XXXXXXX`

Exemplo:
```
GTM-ABCD123
```

## ⚙️ Passo 3: Configurar no Sirius

### Opção A: Variável de Ambiente (Recomendado para Produção)

1. Crie um arquivo `.env.local` na raiz do projeto:
```bash
NEXT_PUBLIC_GTM_ID="GTM-XXXXXXX"
```

2. No Vercel (produção):
   - Acesse: Project Settings → Environment Variables
   - Adicione:
     - **Name**: `NEXT_PUBLIC_GTM_ID`
     - **Value**: `GTM-XXXXXXX`
     - **Environment**: Production, Preview, Development

3. Redeploy o projeto

### Opção B: Hardcoded (Rápido para testar)

Edite `lib/analytics-config.ts`:

```typescript
export const analyticsConfig = {
  gtm: {
    id: 'GTM-XXXXXXX', // Substitua pelo seu ID
    enabled: true, // Mude para true
  },
  // ...
}
```

## 🏷️ Passo 4: Adicionar Tags no GTM

### 4.1 - Migrar Google Analytics para GTM

**No GTM Dashboard:**

1. Clique em **"Tags"** → **"Nova"**
2. Nome: `GA4 - Pageview`
3. Configuração da tag:
   - Tipo: **Google Analytics: GA4 Configuration**
   - Measurement ID: `G-WJE82VNKX8`
4. Acionamento:
   - Escolha: **All Pages**
5. Salve

**Depois de testar, você pode remover o código hardcoded do GA no `layout.tsx`**

### 4.2 - Adicionar Meta Pixel (Facebook Ads)

1. Tags → Nova
2. Nome: `Meta Pixel - All Pages`
3. Tipo: **Custom HTML**
4. Cole o código do Meta Pixel:
```html
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'SEU_PIXEL_ID');
fbq('track', 'PageView');
</script>
```
5. Acionamento: **All Pages**
6. Salve

### 4.3 - Eventos Personalizados

**Exemplo: Rastrear cliques no botão "Criar Conta"**

1. Triggers → Novo
2. Nome: `Click - Criar Conta`
3. Tipo: **Click - All Elements**
4. Condições:
   - `Click Text` contém `Criar conta` OU
   - `Click URL` contém `/register`
5. Salve

6. Tags → Nova
7. Nome: `GA4 - Event - Criar Conta`
8. Tipo: **Google Analytics: GA4 Event**
9. Event Name: `sign_up_click`
10. Acionamento: `Click - Criar Conta`
11. Salve

## 🧪 Passo 5: Testar

1. No GTM, clique em **"Visualizar"** (Preview)
2. Digite: `https://sirius.roilabs.com.br`
3. Navegue no site e veja as tags disparando em tempo real
4. Verifique se tudo funciona corretamente

## ✅ Passo 6: Publicar

1. Clique em **"Enviar"** (Submit)
2. Nome da versão: `v1 - Setup inicial GTM`
3. Descrição: `Configuração inicial com GA4`
4. Clique em **"Publicar"**

## 📊 Tags Recomendadas para CRM

### Marketing
- ✅ Google Analytics 4 (GA4)
- ✅ Meta Pixel (Facebook/Instagram Ads)
- ✅ LinkedIn Insight Tag
- ✅ Google Ads Conversion
- ✅ TikTok Pixel

### Analytics
- ✅ Microsoft Clarity (já configurado)
- ✅ Hotjar
- ✅ Mixpanel

### Conversão
- ✅ Google Optimize (A/B Testing)
- ✅ VWO (Visual Website Optimizer)

## 🎯 Eventos Importantes para Rastrear

```javascript
// Cadastro
gtag('event', 'sign_up', {
  method: 'Email'
});

// Login
gtag('event', 'login', {
  method: 'Email'
});

// Criar Deal
gtag('event', 'create_deal', {
  value: dealValue,
  currency: 'BRL'
});

// Upgrade para Pro
gtag('event', 'purchase', {
  value: 49.00,
  currency: 'BRL',
  transaction_id: 'TXN-123'
});
```

## 🔧 Integração com Data Layer

O GTM já está configurado com `dataLayer`. Para enviar eventos customizados:

```typescript
// Em qualquer componente client
declare global {
  interface Window {
    dataLayer: any[]
  }
}

// Enviar evento
window.dataLayer = window.dataLayer || []
window.dataLayer.push({
  event: 'deal_created',
  deal_value: 5000,
  deal_stage: 'Qualificação'
})
```

## 📚 Recursos

- [GTM Documentation](https://support.google.com/tagmanager)
- [GA4 Setup Guide](https://support.google.com/analytics/answer/9304153)
- [Meta Pixel Setup](https://www.facebook.com/business/help/952192354843755)

## ⚠️ Troubleshooting

### GTM não está carregando
1. Verifique se `NEXT_PUBLIC_GTM_ID` está definido
2. Rode `npm run build` e teste localmente
3. Verifique no DevTools → Network se `gtm.js` está sendo carregado

### Tags não disparam
1. Use GTM Preview mode
2. Verifique os acionadores (triggers)
3. Confirme que o evento está sendo enviado ao dataLayer

### Erro de CORS
- GTM deve funcionar em todos os domínios
- Verifique se não há ad blockers ativos

## 🎉 Pronto!

Agora você tem controle total sobre todas as tags de analytics sem precisar alterar código!
