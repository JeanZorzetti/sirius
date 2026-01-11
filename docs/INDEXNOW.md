# IndexNow Integration

IndexNow é um protocolo que permite notificar instantaneamente mecanismos de busca sobre alterações de conteúdo no site.

## 🚀 Benefícios

- ⚡ **Indexação instantânea** - Seu conteúdo aparece nos resultados em minutos ao invés de dias
- 💰 **Gratuito** - Sem limites de submissões
- 🌐 **Múltiplos motores** - Bing, Yandex, Seznam.cz, Naver
- 🔄 **Protocolo aberto** - Suportado por grandes players

## 📦 Arquivos Implementados

```
├── lib/indexnow.ts                    # Funções helper
├── app/api/indexnow/route.ts          # API endpoint
├── scripts/submit-to-indexnow.ts      # CLI tool
└── public/a573338e-....txt            # Verification key
```

## 🔑 API Key

**Key:** `a573338e-b64d-4494-89f5-aeac5c0e787e`
**Location:** `https://sirius.roilabs.com.br/a573338e-b64d-4494-89f5-aeac5c0e787e.txt`

Este arquivo público é necessário para verificação de ownership do domínio.

## 📖 Como Usar

### 1. Via CLI (Recomendado para publicação de blog posts)

**Submeter um único post:**
```bash
npm run indexnow -- /blog/spin-selling-guia-completo
```

**Submeter múltiplos posts:**
```bash
npm run indexnow -- /blog/post-1 /blog/post-2 /blog/post-3
```

**Submeter TODOS os posts do blog:**
```bash
npm run indexnow -- --all-blog-posts
```

### 2. Via API HTTP

**Endpoint:** `POST /api/indexnow`

**Submeter URL única:**
```bash
curl -X POST https://sirius.roilabs.com.br/api/indexnow \
  -H "Content-Type: application/json" \
  -d '{"url": "/blog/spin-selling-guia-completo"}'
```

**Submeter múltiplas URLs:**
```bash
curl -X POST https://sirius.roilabs.com.br/api/indexnow \
  -H "Content-Type: application/json" \
  -d '{"urls": ["/blog/post-1", "/blog/post-2"]}'
```

**Verificar status da integração:**
```bash
curl https://sirius.roilabs.com.br/api/indexnow
```

### 3. Via Código TypeScript

```typescript
import { submitBlogPost, submitUrlToIndexNow } from '@/lib/indexnow'

// Submeter um post específico
const result = await submitBlogPost('spin-selling-guia-completo')

// Submeter URL customizada
const result = await submitUrlToIndexNow('/pricing')

// Verificar sucesso
if (result.success) {
  console.log('✅ Submetido com sucesso!')
}
```

## 🔄 Quando Usar

Submeta URLs para IndexNow sempre que:

1. **Publicar novo blog post** ✅
2. **Atualizar conteúdo existente** ✅
3. **Alterar páginas importantes** (pricing, features) ✅
4. **Deletar páginas** (para remoção do índice) ✅

**NÃO é necessário** para:
- Mudanças apenas de CSS/design
- Alterações em áreas autenticadas (dashboard)
- Páginas que mudam frequentemente (ex: dashboard analytics)

## 📊 Monitoramento

### Bing Webmaster Tools

1. Acesse: https://www.bing.com/webmasters
2. Adicione o site `sirius.roilabs.com.br`
3. Verifique ownership (usar mesmo método do Google)
4. Vá em **Index Explorer** → **IndexNow**
5. Monitore submissões e status de indexação

### Yandex Webmaster

1. Acesse: https://webmaster.yandex.com
2. Adicione o site
3. Verifique submissões em **Indexação** → **IndexNow**

## ⚙️ Configuração Avançada

### Limites e Restrições

- **Máximo:** 10.000 URLs por request
- **Rate limit:** Sem limite oficial
- **Timeout:** 30 segundos de resposta esperada
- **Retry:** Recomendado esperar 1 hora antes de reenviar mesma URL

### Códigos de Resposta

| Código | Significado | Ação |
|--------|------------|------|
| 200 | ✅ Sucesso | URL submetida |
| 202 | ✅ Aceito | URL na fila de processamento |
| 400 | ❌ Bad Request | Verificar formato do payload |
| 403 | ❌ Forbidden | Verificar ownership key |
| 422 | ❌ Unprocessable | URL inválida ou bloqueada |
| 429 | ⚠️ Rate Limited | Aguardar e tentar novamente |

### Debugging

```typescript
import { verifyIndexNowKey } from '@/lib/indexnow'

// Verificar se a chave está acessível
const isValid = await verifyIndexNowKey()
console.log('Key válida:', isValid)
```

## 🚨 Troubleshooting

### Erro 403 - Forbidden

**Causa:** Chave de verificação não encontrada ou incorreta

**Solução:**
1. Verificar se arquivo existe: `https://sirius.roilabs.com.br/a573338e-b64d-4494-89f5-aeac5c0e787e.txt`
2. Arquivo deve conter APENAS a chave (sem espaços ou quebras de linha extras)
3. Verificar se está na pasta `/public`

### Erro 422 - URL inválida

**Causa:** URL não pertence ao domínio ou está bloqueada

**Solução:**
1. Usar URLs relativas: `/blog/post` ou absolutas: `https://sirius.roilabs.com.br/blog/post`
2. Verificar se URL existe e retorna 200 OK
3. Verificar robots.txt não está bloqueando

### Submissões não aparecem no Bing

**Causa:** Pode levar alguns minutos até aparecer

**Solução:**
1. Aguardar 10-15 minutos
2. Verificar Bing Webmaster Tools → Index Explorer
3. Fazer busca específica: `site:sirius.roilabs.com.br [título do post]`

## 📚 Referências

- **Documentação oficial:** https://www.indexnow.org/documentation
- **FAQ:** https://www.indexnow.org/faq
- **API Spec:** https://www.indexnow.org/specification
- **Bing Webmaster:** https://www.bing.com/webmasters

## ✅ Checklist de Implementação

- [x] Chave IndexNow gerada
- [x] Arquivo de verificação em `/public`
- [x] Módulo `lib/indexnow.ts` criado
- [x] API route `/api/indexnow` implementada
- [x] Script CLI funcional
- [x] Documentação completa
- [ ] Submeter site ao Bing Webmaster Tools
- [ ] Testar submissão manual de 1 URL
- [ ] Configurar CI/CD para submeter automaticamente após deploy

## 🎯 Próximos Passos

1. **Submeter o post SPIN Selling:**
   ```bash
   npm run indexnow -- /blog/spin-selling-guia-completo
   ```

2. **Verificar indexação no Bing:**
   - Aguardar 15 minutos
   - Buscar: `site:sirius.roilabs.com.br spin selling`

3. **Adicionar ao CI/CD** (Vercel):
   - Após cada deploy de novo post, chamar `/api/indexnow`

4. **Monitorar no Bing Webmaster Tools:**
   - Acompanhar crescimento de páginas indexadas
   - Verificar erros de submissão

---

**Criado em:** 11 de Janeiro de 2026
**Última atualização:** 11 de Janeiro de 2026
