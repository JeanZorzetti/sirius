# 🚀 Quick Start - Generative UI

## ✅ O que você já tem:

1. ✅ GROQ_API_KEY configurada em `.env`
2. ✅ Endpoint `/api/agi/chat-with-ui` implementado
3. ✅ Página de teste criada em `/dashboard/agi-genui`

---

## 📍 Como Acessar a Página de Teste

### Opção 1: URL Direta

**Local:**
```
http://localhost:3000/dashboard/agi-genui
```

**Produção:**
```
https://siriuscrm.com.br/dashboard/agi-genui
```

### Opção 2: Adicionar ao Menu do Dashboard

Edite o arquivo de navegação do dashboard para adicionar um link:

**Arquivo:** `components/dashboard/sidebar.tsx` (ou similar)

```tsx
// Adicionar na lista de navegação:
{
  label: 'AGI Generative UI',
  href: '/dashboard/agi-genui',
  icon: Sparkles, // from lucide-react
  badge: 'Beta', // opcional
}
```

---

## 🧪 Testando Agora

### 1. Iniciar Dev Server (Local)

```bash
cd "C:\Users\jeanz\OneDrive\Desktop\ROI Labs\CRM\crm-project"
npm run dev
```

Acesse: http://localhost:3000/dashboard/agi-genui

### 2. Fazer Login

Se não estiver logado, você será redirecionado para `/login`

### 3. Testar Chat

Digite uma das mensagens exemplo:

**Trigger ROICalculator:**
```
Quanto eu economizo com o Sirius? Atualmente gasto R$ 15 mil por mês.
```

**Trigger PricingComparison:**
```
Quais são os planos disponíveis?
```

**Trigger DemoScheduler:**
```
Quero agendar uma demo do Sirius
```

### 4. Verificar Resposta

Você deve ver:

1. ✅ **Thinking Indicator** (processando...)
2. ✅ **Texto da resposta** (markdown)
3. ✅ **Placeholder do componente** (ex: "Component ROICalculator will be implemented in Phase 2")

**Isso é esperado!** Os componentes reais serão implementados na Fase 2.

---

## 🌐 Testar em Produção

### 1. Deploy

Se ainda não fez deploy:

```bash
# Commit changes
git add .
git commit -m "feat: Add Generative UI system (Phase 1)"
git push

# Deploy (Vercel, Railway, etc.)
# A variável GROQ_API_KEY deve estar configurada no ambiente de produção
```

### 2. Verificar Variáveis de Ambiente

No painel da Vercel (ou seu host):

```
GROQ_API_KEY=gsk_...
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://siriuscrm.com.br
```

### 3. Acessar

```
https://siriuscrm.com.br/dashboard/agi-genui
```

---

## 🧪 Testar o Endpoint Diretamente

### Via Script Node.js

```bash
cd scripts

# 1. Pegar cookie de sessão (veja COMO_TESTAR.md)
# 2. Rodar teste

SESSION_COOKIE="next-auth.session-token=SEU_TOKEN" \
TEST_URL="https://siriuscrm.com.br" \
node test-genui-endpoint.js
```

### Via cURL

```bash
curl -X POST https://siriuscrm.com.br/api/agi/chat-with-ui \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=SEU_TOKEN_AQUI" \
  -d '{
    "messages": [
      {"role": "user", "content": "Quanto economizo? Gasto R$ 15k/mês"}
    ]
  }'
```

---

## 📊 O que Esperar (Fase 1)

### ✅ O que funciona:

- ✅ AI responde conversacionalmente
- ✅ AI decide quando usar componente
- ✅ AI extrai dados da conversa
- ✅ Props são validados (Zod)
- ✅ Streaming funciona
- ✅ Thinking states aparecem
- ✅ Error handling funciona

### ⏳ O que ainda não funciona (Fase 2):

- ⏳ Componentes mostram placeholder
- ⏳ Sem UI interativa (calculadora real, formulários)
- ⏳ Sem integração com Calendly (DemoScheduler)
- ⏳ Sem criação de deals via form

**Isso é normal!** A Fase 1 implementou a FUNDAÇÃO. Os componentes reais vêm na Fase 2.

---

## 🐛 Troubleshooting

### Erro 401 - Não Autenticado

**Solução:** Fazer login em `/login` primeiro

### Erro 500 - Internal Server Error

**Possíveis causas:**

1. GROQ_API_KEY não configurada
   - Verificar `.env` ou variáveis de ambiente em produção

2. Database connection error
   - Verificar `DATABASE_URL`

3. Sessão expirada
   - Fazer logout e login novamente

**Verificar logs:**

```bash
# Local
npm run dev
# Ver console do terminal

# Produção (Vercel)
# Ver logs no dashboard da Vercel
```

### AI não renderiza componentes

**Solução:** Forneça mais contexto na mensagem

**❌ Muito vago:**
```
"Quanto custa?"
```

**✅ Com contexto:**
```
"Quanto eu economizo com o Sirius? Hoje gasto R$ 20 mil por mês com CRM e processos manuais."
```

---

## 📝 Mensagens de Teste

### ROICalculator
```
Quanto eu economizo com o Sirius CRM?
Atualmente gasto R$ 15.000 por mês com meu CRM atual e processos manuais.
```

### PricingComparison
```
Quais são os planos do Sirius? Qual a diferença entre FREE e PRO?
```

### DemoScheduler
```
Gostei do que vi! Como faço para agendar uma demonstração?
```

### DealFormGenerator
```
Quero começar a usar o Sirius. Como funciona o processo de onboarding?
```

### QualificationDashboard
```
Tenho uma clínica odontológica com 5 vendedores. O Sirius é adequado para mim?
```

---

## 🎯 Próximos Passos

Após validar que tudo funciona:

### Hoje
1. ✅ Testar página `/dashboard/agi-genui`
2. ✅ Verificar que AI responde
3. ✅ Verificar que placeholders aparecem

### Esta Semana
4. ⏳ Implementar ROICalculator (Fase 2.1)
5. ⏳ Integrar com analytics

### Próximas 2 Semanas
6. ⏳ Implementar DealFormGenerator
7. ⏳ Implementar DemoScheduler
8. ⏳ Deploy em produção

---

## 📚 Documentação Completa

- **Arquitetura:** `docs/GENERATIVE_UI_ARCHITECTURE.md`
- **Como Usar:** `lib/generative-ui/README.md`
- **Como Testar:** `scripts/COMO_TESTAR.md`
- **Próximos Passos:** `docs/GENERATIVE_UI_NEXT_STEPS.md`

---

## ✅ Checklist Rápida

- [ ] GROQ_API_KEY configurada ✅ (você já tem)
- [ ] Página criada em `/dashboard/agi-genui` ✅
- [ ] Login feito
- [ ] Acessar página de teste
- [ ] Enviar mensagem com contexto
- [ ] Ver resposta do AI
- [ ] Ver placeholder de componente
- [ ] Tudo funcionando sem erros

---

**Pronto para testar!** 🚀

Qualquer dúvida, consulte `scripts/COMO_TESTAR.md` ou a documentação completa.
