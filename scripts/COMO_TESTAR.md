# Como Testar o Endpoint de Generative UI

## 🧪 Método 1: Script Node.js

### Passo 1: Pegar o Cookie de Sessão

1. Acesse **https://siriuscrm.com.br** e faça login
2. Abra DevTools (F12)
3. Vá em **Application** → **Cookies** → `https://siriuscrm.com.br`
4. Copie o valor de `next-auth.session-token`

### Passo 2: Rodar o Script

```bash
cd "C:\Users\jeanz\OneDrive\Desktop\ROI Labs\CRM\crm-project"

# Testar em produção
SESSION_COOKIE="next-auth.session-token=SEU_TOKEN_AQUI" node scripts/test-genui-endpoint.js

# Ou testar local
TEST_URL="http://localhost:3000" SESSION_COOKIE="..." node scripts/test-genui-endpoint.js
```

### Resultado Esperado

```
🧪 Testando Generative UI Endpoint

📍 URL: https://siriuscrm.com.br/api/agi/chat-with-ui
────────────────────────────────────────────────────────────

📊 Status: 200 OK
✅ Resposta recebida! Processando stream...

────────────────────────────────────────────────────────────

📦 Chunk 1:
   Type: text
   Content: "Deixa eu calcular isso pra você:"

📦 Chunk 2:
   Type: thinking
   State: calculating_roi
   Message: "Calculando ROI..."

📦 Chunk 3:
   Type: ui_component
   Component: ROICalculator
   Props: {
      "scenario": {
        "currentCost": 15000,
        "withSirius": 8000,
        "monthlySavings": 7000,
        "annualROI": 84000,
        "paybackPeriod": 2
      },
      "industry": "orthodontics",
      "comparisonMode": true
    }
   Reasoning: "User mentioned spending R$15k/month"

📦 Chunk 4:
   Type: text
   Content: "Como você pode ver acima, você economizaria R$ 7.000/mês..."

────────────────────────────────────────────────────────────

📊 Resumo:
   Total chunks: 4
   Text chunks: 2
   UI components: 1
   Thinking states: 1

✅ Teste concluído com sucesso!
```

---

## 🌐 Método 2: cURL (Linha de Comando)

```bash
# 1. Substituir SEU_TOKEN_AQUI pelo token copiado
curl -X POST https://siriuscrm.com.br/api/agi/chat-with-ui \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN_AQUI" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Quanto eu economizo com o Sirius? Gasto R$ 15 mil por mês."
      }
    ]
  }'
```

---

## 🖥️ Método 3: Postman

1. **Criar Nova Request:**
   - Method: `POST`
   - URL: `https://siriuscrm.com.br/api/agi/chat-with-ui`

2. **Headers:**
   - `Content-Type`: `application/json`
   - `Cookie`: `next-auth.session-token=SEU_TOKEN_AQUI`

3. **Body (raw JSON):**
   ```json
   {
     "messages": [
       {
         "role": "user",
         "content": "Quanto eu economizo? Gasto R$ 15 mil por mês."
       }
     ]
   }
   ```

4. **Clicar em Send**

---

## 🔍 Troubleshooting

### Erro 401 (Unauthorized)

**Causa:** Cookie de sessão inválido ou expirado

**Solução:**
1. Fazer novo login em siriuscrm.com.br
2. Pegar novo `next-auth.session-token`
3. Tentar novamente

---

### Erro 429 (Rate Limited)

**Causa:** Limite de uso do AGI atingido

**Solução:**
1. Verificar plano da organização (FREE vs PRO)
2. Aguardar reset diário
3. Ou fazer upgrade para PRO

---

### Erro 500 (Internal Server Error)

**Causa:** Possíveis causas:
- GROQ_API_KEY inválida
- Database connection error
- Bug no código

**Solução:**
1. Verificar logs do servidor
2. Verificar variáveis de ambiente
3. Verificar se GROQ_API_KEY está ativa

---

### Nenhum componente UI é renderizado

**Causa:** AI não encontrou contexto suficiente ou não decidiu usar componente

**Soluções:**

**Teste 1 - Mensagem com contexto explícito:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Atualmente gasto R$ 15 mil por mês com CRM e processos manuais. Quanto eu economizaria com o Sirius?"
    }
  ]
}
```

**Teste 2 - Pedir explicitamente:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Mostre-me uma calculadora de ROI"
    }
  ]
}
```

**Teste 3 - Fornecer contexto de deal:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Quanto economizo?"
    }
  ],
  "context": {
    "dealId": "id-do-deal-com-dados"
  }
}
```

---

## ✅ Checklist de Sucesso

Teste passou se você viu:

- [ ] Status 200 OK
- [ ] Pelo menos 1 chunk de texto
- [ ] Pelo menos 1 thinking state (opcional)
- [ ] Pelo menos 1 ui_component (se mensagem pediu)
- [ ] Props do componente estão válidos
- [ ] Sem erros no console

---

## 📝 Exemplos de Mensagens para Testar

### Trigger ROICalculator
```
"Quanto eu economizo com o Sirius? Hoje gasto R$ 20 mil por mês."
```

### Trigger PricingComparison
```
"Quais são os planos disponíveis? Qual a diferença entre FREE e PRO?"
```

### Trigger DemoScheduler
```
"Quero ver uma demo do Sirius. Como agendo?"
```

### Trigger DealFormGenerator
```
"Gostei! Como faço para começar a usar?"
```

### Trigger QualificationDashboard
```
"O Sirius é adequado para minha clínica odontológica com 3 vendedores?"
```

---

Boa sorte! 🚀
