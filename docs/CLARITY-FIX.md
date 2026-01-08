# 🔧 Como Reativar o Microsoft Clarity

O Microsoft Clarity foi **temporariamente desabilitado** devido a erros 400/CORS.

## ❌ Erro que estava acontecendo:
```
POST https://i.clarity.ms/collect 400 (Bad Request)
Access to XMLHttpRequest at 'https://i.clarity.ms/collect' from origin
'https://sirius.roilabs.com.br' has been blocked by CORS policy
```

## ✅ Como Resolver e Reativar

### Passo 1: Verificar o Projeto no Clarity

1. Acesse: https://clarity.microsoft.com/projects

2. Verifique se o projeto `uu4q5pnnji` existe e está ativo

3. **Se o projeto não existir ou tiver problemas:**
   - Crie um novo projeto no Clarity
   - Adicione o domínio: `sirius.roilabs.com.br`
   - Copie o **novo Project ID**

### Passo 2: Atualizar o ID (se necessário)

Se você criou um novo projeto, atualize o ID em:

**Arquivo:** `lib/analytics-config.ts`
```typescript
clarity: {
  id: 'SEU_NOVO_ID_AQUI', // Substitua pelo ID do novo projeto
  enabled: true, // Mude para true
},
```

### Passo 3: Reativar o Clarity

Se o projeto existente (`uu4q5pnnji`) estiver funcionando:

**Arquivo:** `lib/analytics-config.ts`
```typescript
clarity: {
  id: 'uu4q5pnnji',
  enabled: true, // Mude de false para true
},
```

### Passo 4: Fazer Deploy

```bash
git add .
git commit -m "chore: reativar Microsoft Clarity"
git push origin main
```

## 🧪 Testar

Após o deploy:
1. Acesse: https://sirius.roilabs.com.br
2. Abra o DevTools (F12) → Aba **Console**
3. **NÃO deve haver** erros do Clarity
4. Verifique no painel do Clarity se as sessões estão sendo registradas

---

## 📋 Possíveis Causas do Erro 400

1. **Projeto Clarity deletado ou suspenso**
2. **ID do projeto incorreto**
3. **Domínio não autorizado no projeto**
4. **Limite de dados atingido** (improvável no free tier)
5. **Bloqueio de adblocker** (improvável causar 400, mas possível)

---

## 🔄 Alternativa: Usar Clarity via Google Tag Manager

Se preferir gerenciar via GTM (mais robusto):

1. No painel do GTM, crie uma nova tag
2. Tipo: **HTML Personalizado**
3. Cole o código do Clarity
4. Dispare em: **All Pages**
5. Remova o código do `layout.tsx`

Vantagens:
- Gerenciamento centralizado
- Não precisa fazer deploy para mudanças
- Melhor controle de triggers

---

## 📞 Suporte

Se continuar com problemas:
- Suporte Clarity: https://docs.microsoft.com/en-us/clarity/
- Verificar status: https://status.clarity.ms/
