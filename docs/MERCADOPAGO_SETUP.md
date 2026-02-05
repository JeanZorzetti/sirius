# 🔧 Configuração do Mercado Pago - v2.0

Guia para configurar os produtos (planos e add-ons) no Mercado Pago.

---

## 📋 Pré-requisitos

- Conta no Mercado Pago (https://www.mercadopago.com.br)
- Acesso às credenciais (Access Token)
- Webhook configurado

---

## 🔑 1. Configurar Credenciais

### Variáveis de Ambiente (.env)

```bash
# Mercado Pago - Credenciais
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui
MERCADO_PAGO_WEBHOOK_SECRET=seu_webhook_secret_aqui

# Mercado Pago - IDs dos Planos (criar no painel)
MERCADOPAGO_PLAN_STARTER_ID=plan_starter_id_aqui
MERCADOPAGO_PLAN_PRO_ID=plan_pro_id_aqui
MERCADOPAGO_PLAN_BUSINESS_ID=plan_business_id_aqui

# Mercado Pago - IDs dos Add-ons (criar no painel)
MERCADOPAGO_ADDON_SCRAPING_100_ID=addon_scraping_100_id_aqui
MERCADOPAGO_ADDON_SCRAPING_500_ID=addon_scraping_500_id_aqui
MERCADOPAGO_ADDON_WHATSAPP_EXTRA_ID=addon_whatsapp_extra_id_aqui
```

---

## 💳 2. Criar Planos de Assinatura

### 2.1 Plano STARTER

**Painel do Mercado Pago:**
1. Acesse: https://www.mercadopago.com.br/subscriptions/plans
2. Clique em "Criar plano"
3. Preencha:
   - **Nome:** Sirius CRM - Starter
   - **Descrição:** Organização ilimitada para autônomos
   - **Valor:** R$ 49,00
   - **Frequência:** Mensal (30 dias)
   - **Moeda:** BRL
   - **Tipo:** Assinatura recorrente
4. Salvar e copiar o **ID do plano**
5. Adicionar ao `.env` como `MERCADOPAGO_PLAN_STARTER_ID`

### 2.2 Plano PRO

1. Acesse: https://www.mercadopago.com.br/subscriptions/plans
2. Clique em "Criar plano"
3. Preencha:
   - **Nome:** Sirius CRM - PRO
   - **Descrição:** Automação e inteligência para vendedores profissionais
   - **Valor:** R$ 97,00
   - **Frequência:** Mensal (30 dias)
   - **Moeda:** BRL
   - **Tipo:** Assinatura recorrente
4. Salvar e copiar o **ID do plano**
5. Adicionar ao `.env` como `MERCADOPAGO_PLAN_PRO_ID`

### 2.3 Plano BUSINESS

1. Acesse: https://www.mercadopago.com.br/subscriptions/plans
2. Clique em "Criar plano"
3. Preencha:
   - **Nome:** Sirius CRM - Business
   - **Descrição:** Gestão completa de equipes de vendas
   - **Valor:** R$ 149,00
   - **Frequência:** Mensal (30 dias)
   - **Moeda:** BRL
   - **Tipo:** Assinatura recorrente
4. Salvar e copiar o **ID do plano**
5. Adicionar ao `.env` como `MERCADOPAGO_PLAN_BUSINESS_ID`

---

## 🛒 3. Criar Add-ons (Produtos Avulsos)

### 3.1 Pacote 100 Leads

**Produto de Compra Única:**
1. Acesse: https://www.mercadopago.com.br/tools/create
2. Clique em "Criar link de pagamento"
3. Preencha:
   - **Nome:** Pacote 100 Leads - Sirius CRM
   - **Descrição:** 100 créditos de prospecção para buscar leads no Google Maps
   - **Valor:** R$ 29,90
   - **Tipo:** Compra única (não recorrente)
   - **Quantidade:** Ilimitado
4. Salvar e copiar o **ID do produto**
5. Adicionar ao `.env` como `MERCADOPAGO_ADDON_SCRAPING_100_ID`

### 3.2 Pacote 500 Leads

1. Acesse: https://www.mercadopago.com.br/tools/create
2. Clique em "Criar link de pagamento"
3. Preencha:
   - **Nome:** Pacote 500 Leads - Sirius CRM
   - **Descrição:** 500 créditos de prospecção para buscar leads no Google Maps
   - **Valor:** R$ 99,90
   - **Tipo:** Compra única (não recorrente)
   - **Quantidade:** Ilimitado
4. Salvar e copiar o **ID do produto**
5. Adicionar ao `.env` como `MERCADOPAGO_ADDON_SCRAPING_500_ID`

### 3.3 Instância WhatsApp Extra

**Produto Recorrente:**
1. Acesse: https://www.mercadopago.com.br/subscriptions/plans
2. Clique em "Criar plano"
3. Preencha:
   - **Nome:** Instância WhatsApp Extra - Sirius CRM
   - **Descrição:** Conecte um número de WhatsApp adicional
   - **Valor:** R$ 29,90
   - **Frequência:** Mensal (30 dias)
   - **Moeda:** BRL
   - **Tipo:** Assinatura recorrente
4. Salvar e copiar o **ID do plano**
5. Adicionar ao `.env` como `MERCADOPAGO_ADDON_WHATSAPP_EXTRA_ID`

---

## 🔔 4. Configurar Webhook

### 4.1 URL do Webhook

```
https://seudominio.com/api/webhooks/mercadopago
```

### 4.2 Eventos a Monitorar

Selecione os seguintes eventos no painel do Mercado Pago:
- ✅ `payment` - Pagamento criado/atualizado
- ✅ `payment.updated` - Pagamento atualizado
- ✅ `subscription_preapproval` - Assinatura criada
- ✅ `subscription_preapproval_plan` - Plano de assinatura atualizado

### 4.3 Configurar Webhook no Painel

1. Acesse: https://www.mercadopago.com.br/developers/panel/notifications/webhooks
2. Clique em "Criar webhook"
3. Preencha:
   - **URL:** `https://seudominio.com/api/webhooks/mercadopago`
   - **Eventos:** Selecionar os eventos acima
4. Salvar
5. Copiar o **Secret** gerado
6. Adicionar ao `.env` como `MERCADO_PAGO_WEBHOOK_SECRET`

### 4.4 Testar Webhook

```bash
# Usar a ferramenta de teste do Mercado Pago
curl -X POST https://seudominio.com/api/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1234567890,v1=test_hash" \
  -H "x-request-id: test_request_id" \
  -d '{
    "type": "payment",
    "data": {
      "id": "test_payment_id"
    }
  }'
```

---

## ✅ 5. Validar Configuração

### Checklist

- [ ] Access Token configurado no `.env`
- [ ] Webhook Secret configurado no `.env`
- [ ] Plano STARTER criado e ID configurado
- [ ] Plano PRO criado e ID configurado
- [ ] Plano BUSINESS criado e ID configurado
- [ ] Add-on Scraping 100 criado e ID configurado
- [ ] Add-on Scraping 500 criado e ID configurado
- [ ] Add-on WhatsApp Extra criado e ID configurado
- [ ] Webhook configurado e testado
- [ ] URL do webhook adicionada ao Mercado Pago

### Teste de Fluxo Completo

1. **Criar checkout de teste:**
   ```bash
   curl -X POST https://seudominio.com/api/billing/checkout \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer seu_token" \
     -d '{
       "tier": "STARTER"
     }'
   ```

2. **Completar pagamento** no link retornado

3. **Verificar webhook:**
   - Logs do servidor devem mostrar webhook recebido
   - Organization deve ter `tier` atualizado para `STARTER`
   - `ScrapingCredit` e `AgiQuota` devem ser criados

4. **Testar add-on:**
   ```bash
   curl -X POST https://seudominio.com/api/billing/addon \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer seu_token" \
     -d '{
       "addonType": "SCRAPING_100"
     }'
   ```

5. **Verificar:**
   - `Addon` criado no banco
   - `ScrapingCredit.balance` incrementado em 100

---

## 🔒 6. Segurança

### Validação de Assinatura

O webhook valida automaticamente a assinatura do Mercado Pago usando HMAC SHA256.

**Como funciona:**
1. Mercado Pago envia header `x-signature` com timestamp e hash
2. Servidor calcula hash esperado usando o secret
3. Compara hash recebido com hash calculado
4. Rejeita se não coincidir

**Configuração:**
```typescript
// lib/mercado-pago/webhook.ts
const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET
const manifest = `id:${paymentId};request-id:${requestId};ts:${timestamp};`
const expectedHash = crypto.createHmac('sha256', secret).update(manifest).digest('hex')
```

### IPs Permitidos (Opcional)

Adicionar verificação de IP no webhook:
```typescript
const allowedIPs = [
  '209.225.49.0/24',
  '216.33.197.0/24',
  // IPs do Mercado Pago
]
```

---

## 📊 7. Monitoramento

### Logs a Observar

```bash
# Webhook recebido
[INFO] Mercado Pago webhook received
{
  "type": "payment",
  "action": "payment.created",
  "paymentId": "123456789"
}

# Pagamento aprovado
[INFO] Payment approved
{
  "organizationId": "org_123",
  "tier": "STARTER",
  "amount": 49.00
}

# Add-on processado
[INFO] Add-on purchased
{
  "organizationId": "org_123",
  "addonType": "SCRAPING_100",
  "creditsAdded": 100
}
```

### Métricas

- Taxa de aprovação de pagamentos
- Tempo médio de processamento
- Erros de webhook
- Upgrades/downgrades por período

---

## 🐛 8. Troubleshooting

### Webhook não está sendo recebido

1. **Verificar URL:**
   - URL deve ser HTTPS
   - URL deve estar acessível publicamente

2. **Verificar logs:**
   ```bash
   tail -f logs/app.log | grep mercadopago
   ```

3. **Testar manualmente:**
   ```bash
   curl https://seudominio.com/api/webhooks/mercadopago
   # Deve retornar: {"service":"Mercado Pago Webhook","status":"active"}
   ```

### Pagamento aprovado mas tier não atualizou

1. **Verificar logs do webhook:**
   - Webhook foi recebido?
   - Assinatura válida?
   - Metadata correta?

2. **Verificar banco de dados:**
   ```sql
   SELECT * FROM "Organization" WHERE id = 'org_id';
   -- Verificar campo "tier"
   ```

3. **Verificar metadata do pagamento:**
   - Deve conter `tier`, `organization_id`, `type`

### Créditos de scraping não foram adicionados

1. **Verificar add-on criado:**
   ```sql
   SELECT * FROM "Addon" WHERE "organizationId" = 'org_id' ORDER BY "purchasedAt" DESC;
   ```

2. **Verificar scraping credit:**
   ```sql
   SELECT * FROM "ScrapingCredit" WHERE "organizationId" = 'org_id';
   ```

3. **Verificar logs:**
   ```bash
   grep "Scraping credits added" logs/app.log
   ```

---

## 📚 Referências

- [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
- [API de Assinaturas](https://www.mercadopago.com.br/developers/pt/docs/subscriptions)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [API de Pagamentos](https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post)

---

**Última atualização:** 2026-02-05
**Versão:** 2.0
**Status:** ✅ Pronto para configuração
