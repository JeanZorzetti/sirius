# 🔐 Arquitetura de Autenticação — Sirius CRM

> Documentação do sistema híbrido de autenticação (Atualizado: 11/02/2026)

## 📋 Overview

O Sirius CRM utiliza um **sistema híbrido** que combina:
1. **Next-Auth v4** para autenticação inicial (OAuth + Credentials)
2. **Sistema JWT Customizado** para gerenciamento de sessões

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    USER LOGIN                        │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  Login via Google OAuth        │
         │  (/api/auth/[...nextauth])     │
         │  → Next-Auth v4 autentica      │
         └────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  Callback Success              │
         │  → Cria sessão JWT customizada │
         │  → Cookie httpOnly (24h)       │
         │  (lib/auth.ts: login())        │
         └────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  Middleware Protege Rotas      │
         │  → Valida JWT                  │
         │  → Auto-refresh                │
         │  (middleware.ts)               │
         └────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  API Routes & Pages            │
         │  → getSession()                │
         │  → Acesso autorizado           │
         └────────────────────────────────┘
```

## 🔑 Componentes

### 1. Next-Auth v4 (`app/api/auth/[...nextauth]/route.ts`)

**Responsabilidades:**
- ✅ OAuth Google (único provider ativo)
- ✅ Credentials Provider (email/senha)
- ⚠️ **Usado APENAS para autenticação inicial**

**Configuração:**
```typescript
providers: [
  GoogleProvider({ clientId, clientSecret }),
  CredentialsProvider({ ... })
]
```

**Limitações Atuais:**
- Next-Auth usado em < 0.1% do código
- Apenas 2 chamadas: `signIn('google')` em login/register
- Não gerencia sessões (isso é feito pelo sistema customizado)

---

### 2. Sistema JWT Customizado (`lib/auth.ts`)

**Responsabilidades:**
- ✅ Gerenciar sessões JWT (cookie httpOnly)
- ✅ Proteção de rotas (middleware)
- ✅ Usado em 99% das páginas e API routes

**Funções Principais:**

#### `getSession()`
```typescript
const session = await getSession()
// Retorna: { user: { id, name, email }, expires }
```
Usado em todas as API routes protegidas.

#### `login(userData)`
```typescript
await login({ id, name, email })
// Cria cookie 'session' com JWT (24h)
```

#### `logout()`
```typescript
await logout()
// Limpa cookie 'session'
```

#### `updateSession(request)`
```typescript
// Usado no middleware para auto-refresh
```

**Segurança:**
- JWT assinado com HS256 (chave: `SESSION_SECRET`)
- Cookie httpOnly (previne XSS)
- SameSite: lax (previne CSRF)
- Expiração: 24h (auto-renovado no middleware)

---

### 3. Middleware (`middleware.ts`)

**Responsabilidades:**
- ✅ Proteger rotas `/dashboard/*`
- ✅ Redirecionar `/login` e `/register` se já autenticado
- ✅ Auto-refresh de sessões

**Fluxo:**
1. Verifica se cookie `session` existe
2. Valida e renova JWT (se válido)
3. Redireciona para `/login` se inválido/ausente

---

## 🔄 Fluxo Completo de Autenticação

### Login via Google OAuth

```typescript
// 1. User clica em "Entrar com Google"
<button onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>
  Entrar com Google
</button>

// 2. Next-Auth redireciona para Google OAuth
// 3. Google retorna com token
// 4. Next-Auth callback valida
// 5. Sistema customizado cria sessão JWT
await login({ id: user.id, name: user.name, email: user.email })

// 6. Usuário redirecionado para /dashboard
// 7. Middleware valida sessão JWT
// 8. Acesso autorizado!
```

### Login via Credentials (Email/Senha)

```typescript
// 1. User submete form de login
// 2. Next-Auth CredentialsProvider valida
const isValid = await bcrypt.compare(password, user.password)

// 3. Se válido, cria sessão JWT customizada
await login({ id: user.id, name: user.name, email: user.email })

// 4. Redireciona para /dashboard
```

### Validação em API Route

```typescript
// app/api/deals/route.ts
export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Acesso autorizado!
  const deals = await prisma.deal.findMany({
    where: { userId: session.user.id }
  })

  return NextResponse.json(deals)
}
```

---

## ⚠️ Problemas Conhecidos (Resolvidos)

### ~~1. Prisma Singleton Violado~~
- ❌ **Era:** `new PrismaClient()` em `[...nextauth]/route.ts`
- ✅ **Agora:** `import { prisma } from '@/lib/prisma'`
- **Motivo:** Evita múltiplas conexões DB

### ~~2. Documentação Ausente~~
- ❌ **Era:** Sistema híbrido não documentado
- ✅ **Agora:** Este documento + comentários inline
- **Motivo:** Facilitar manutenção e onboarding

---

## 🚀 Roadmap Futuro

### Opção A: Migrar para Clerk (Q2 2026)
**Quando:**
- Atingir 500+ usuários pagantes
- Budget para $25-99/mês
- Precisar de organizações enterprise (SSO, SAML)

**Benefícios:**
- UI pronta (sign-in/up)
- User management dashboard
- Webhooks para sync
- 2FA, passkeys, roles

**Desvantagens:**
- Vendor lock-in
- Custo escalável
- Migração complexa

---

### Opção B: Migrar para Next-Auth v5 (Auth.js)
**Quando:**
- Next-Auth v4 perder suporte crítico
- Precisar de features v5 específicas

**Esforço:** ~8 horas

**Breaking Changes:**
- `getServerSession()` → `auth()`
- Configuração em `auth.ts` (raiz)
- Callbacks com tipagem melhorada

---

### Opção C: Consolidar em Sistema Customizado
**Quando:**
- Remover dependência do Next-Auth
- Implementar OAuth Google manualmente

**Esforço:** ~4 horas

**Trade-offs:**
- Mais controle
- Sem dependências externas
- Mais código para manter

---

## 📊 Métricas Atuais

| Métrica | Valor |
|---------|-------|
| Next-Auth v4 usage | < 0.1% do código |
| Sistema customizado usage | 99% das rotas |
| OAuth providers | 1 (Google) |
| Tempo de login | ~800ms |
| Session duration | 24h (auto-refresh) |

---

## 🔗 Referências

- [Next-Auth v4 Docs](https://next-auth.js.org/v4)
- [José JWT Library](https://github.com/panva/jose)
- [Clerk Docs](https://clerk.com/docs)
- [Auth.js v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)

---

## 📝 Changelog

- **11/02/2026** — Criado documento de arquitetura
- **11/02/2026** — Corrigido Prisma singleton em next-auth
- **11/02/2026** — Adicionados comentários inline em `lib/auth.ts`
