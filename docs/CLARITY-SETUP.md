# 🔧 Microsoft Clarity - Configuração Completa

## ⚠️ Problema Identificado

Erro 400 e CORS ao enviar dados para `https://i.clarity.ms/collect`

**Causa mais comum:** Projeto Clarity não está configurado corretamente para o domínio.

---

## ✅ Solução Passo a Passo

### Passo 1: Verificar se o Projeto Existe

1. Acesse: https://clarity.microsoft.com/projects

2. Procure pelo projeto com ID: **uu4q5pnnji**

3. **Se o projeto NÃO existir:**
   - Clique em **"New Project"**
   - Nome: `Sirius CRM`
   - Website URL: `https://sirius.roilabs.com.br`
   - Clique em **"Create"**
   - Copie o **novo Project ID** gerado

4. **Se o projeto EXISTIR:**
   - Clique no projeto para abrir
   - Verifique se está **ativo** (não pausado)
   - Prossiga para o Passo 2

---

### Passo 2: Configurar Domínio Permitido

1. No projeto Clarity, vá em **"Settings"**

2. Na seção **"Project settings"**, verifique:
   - **Website URL**: Deve estar `https://sirius.roilabs.com.br`
   - Ou adicione como domínio permitido

3. **Importante:** Certifique-se que o domínio está EXATAMENTE como em produção:
   - ✅ `sirius.roilabs.com.br` (correto)
   - ❌ `www.sirius.roilabs.com.br` (incorreto se não usa www)
   - ❌ `localhost` (incorreto para produção)

4. Clique em **"Save"**

---

### Passo 3: Verificar Status do Projeto

1. No dashboard do projeto, verifique se aparece:
   - ✅ **"Receiving data"** - Tudo certo!
   - ⚠️ **"No data received yet"** - Projeto configurado mas sem dados
   - ❌ **"Project paused"** - Reative o projeto

2. Se não está recebendo dados:
   - Aguarde 5-10 minutos após configurar
   - Acesse o site `https://sirius.roilabs.com.br`
   - Navegue por algumas páginas
   - Verifique novamente no dashboard do Clarity

---

### Passo 4: Atualizar Project ID (Se Necessário)

**Se você criou um NOVO projeto**, atualize o ID no código:

**Arquivo:** `lib/analytics-config.ts`
```typescript
clarity: {
  id: 'SEU_NOVO_PROJECT_ID_AQUI', // Substitua pelo novo ID
  enabled: true,
},
```

Faça commit e push:
```bash
git add lib/analytics-config.ts
git commit -m "chore: update Clarity project ID"
git push origin main
```

---

## 🧪 Testar se Está Funcionando

### No Browser (Produção)

1. Acesse: https://sirius.roilabs.com.br

2. Abra **DevTools** (F12) → Aba **Console**

3. **Erros que PODEM aparecer (e são OK):**
   ```
   [Clarity] Supressed error: ... (em debug mode)
   ```

4. **Erros que NÃO devem aparecer:**
   ```
   POST https://i.clarity.ms/collect 400 (Bad Request)  ❌
   CORS policy violations                                ❌
   ```

### No Painel do Clarity

1. Acesse: https://clarity.microsoft.com/projects

2. Clique no seu projeto

3. Dentro de 5-10 minutos, você deve ver:
   - Sessões gravadas
   - Heatmaps
   - Dados de usuário

---

## 🔍 Troubleshooting

### Problema: "Still getting 400 errors"

**Causa:** Project ID incorreto ou projeto deletado

**Solução:**
1. Crie um novo projeto no Clarity
2. Copie o novo Project ID
3. Atualize `lib/analytics-config.ts`
4. Deploy

### Problema: "CORS errors still appearing"

**Causa:** Domínio não está na whitelist do projeto

**Solução:**
1. No projeto Clarity → Settings
2. Adicione `sirius.roilabs.com.br` como domínio permitido
3. Salve e aguarde 5 minutos

### Problema: "No data in Clarity dashboard"

**Causas possíveis:**
1. Adblocker bloqueando Clarity
2. Script não está carregando
3. Projeto pausado
4. Aguardando primeiros dados (demora ~5min)

**Solução:**
1. Desative adblocker temporariamente
2. Verifique se o script está carregando (DevTools → Network → clarity)
3. Reative o projeto no dashboard
4. Aguarde e navegue mais páginas

---

## 📊 Como Funciona Agora

O componente `MicrosoftClarity`:
- ✅ Carrega o script do Clarity
- ✅ Suprime erros do console relacionados ao Clarity
- ✅ Adiciona error handling para evitar crashes
- ✅ Loga erros em modo debug para diagnóstico

**Os erros continuam acontecendo?**
- Sim, mas agora são **silenciados no console**
- O Clarity ainda funciona (se configurado corretamente)
- Não polui mais o console do usuário
- Permite diagnóstico via `console.debug` se necessário

---

## 🎯 Checklist Final

Antes de considerar resolvido, verifique:

- [ ] Projeto existe em https://clarity.microsoft.com/projects
- [ ] Projeto está **ativo** (não pausado)
- [ ] Domínio `sirius.roilabs.com.br` está configurado
- [ ] Project ID no código está correto (`lib/analytics-config.ts`)
- [ ] Deploy foi feito após mudanças
- [ ] Console não mostra mais erros 400 do Clarity
- [ ] Dashboard do Clarity mostra "Receiving data"

---

## 📚 Referências

- [Microsoft Clarity 400 Error Discussion](https://learn.microsoft.com/en-us/answers/questions/1922125/how-to-fix-400-bad-request-error-in-microsoft-clar)
- [Clarity CORS Issues (GitHub)](https://github.com/microsoft/clarity/issues/507)
- [Troubleshooting Clarity Installation](https://learn.microsoft.com/en-us/clarity/setup-and-installation/troubleshooting-installation)

---

**💡 Dica:** Se o Clarity continuar com problemas persistentes após seguir todos os passos, considere desabilitá-lo temporariamente e usar apenas Google Analytics/GTM até resolver.
