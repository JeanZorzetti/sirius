# 🧪 Guia de Testes - v2.0 Modular Plans

Guia completo para executar e entender os testes do sistema v2.0.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Testes Unitários](#testes-unitários)
3. [Testes de Integração](#testes-de-integração)
4. [Testes de Componentes](#testes-de-componentes)
5. [Como Executar](#como-executar)
6. [Cobertura de Testes](#cobertura-de-testes)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

### Stack de Testes

- **Vitest**: Framework de testes unitários e de integração
- **Testing Library**: Testes de componentes React
- **Vitest Mock Extended**: Mocks avançados do Prisma
- **Happy DOM**: Ambiente de DOM para testes

### Estrutura de Testes

```
📁 lib/
  📁 __tests__/
    📄 entitlements.test.ts        # Testes do sistema de entitlements
    📄 feature-gates.test.ts       # Testes de feature gates (server-side)

📁 lib/hooks/
  📁 __tests__/
    📄 use-entitlements.test.tsx   # Testes dos hooks React

📁 lib/mercado-pago/
  📁 __tests__/
    📄 products.test.ts            # Testes de configuração de produtos

📁 components/upgrade/
  📁 __tests__/
    📄 feature-gate.test.tsx       # Testes de componentes de bloqueio
    📄 quota-display.test.tsx      # Testes de exibição de quotas
```

---

## 🧪 Testes Unitários

### 1. Entitlements System (`lib/__tests__/entitlements.test.ts`)

**O que testa:**
- Configuração correta de features por tier
- Funções `getQuota()`, `getLimit()`, `canUseFeature()`
- Hierarquia de planos (FREE < STARTER < PRO < BUSINESS)
- Quotas de AGI e scraping credits

**Cobertura:**
- ✅ FREE: 50 deals, 1 user, 3 gerações IA/mês, 5 créditos iniciais
- ✅ STARTER: Deals ilimitados, sem IA, sem scraping
- ✅ PRO: Tudo ilimitado, 50 créditos/mês
- ✅ BUSINESS: Todas as features PRO + round-robin + team reports

**Como executar:**
```bash
npm run test -- lib/__tests__/entitlements.test.ts
```

**Exemplo de teste:**
```typescript
it('should allow PRO tier to use automation', () => {
  expect(canUseFeature('PRO', 'can_use_automation')).toBe(true)
})
```

---

### 2. Feature Gates (`lib/__tests__/feature-gates.test.ts`)

**O que testa:**
- Validação de limites de deals/users/pipelines
- Consumo de quotas de AGI
- Consumo de scraping credits
- Grandfathering de deals
- Erros customizados (LimitReachedError, QuotaExceededError)

**Cobertura:**
- ✅ `checkDealLimit()`: FREE com 50 deals, grandfathering, ilimitado para STARTER+
- ✅ `checkUserLimit()`: 1 user FREE/STARTER, ilimitado PRO/BUSINESS
- ✅ `checkPipelineLimit()`: 1 pipeline FREE/STARTER, ilimitado PRO+
- ✅ `consumeAgiQuota()`: 3/mês FREE, ilimitado PRO/BUSINESS
- ✅ `consumeScrapingCredit()`: Decrementa balance, valida insufficient credits

**Como executar:**
```bash
npm run test -- lib/__tests__/feature-gates.test.ts
```

**Exemplo de teste:**
```typescript
it('should throw when FREE tier exceeds 50 deals', async () => {
  mockPrisma.organization.findUnique.mockResolvedValue({
    tier: 'FREE',
    grandfatheredDealLimit: null,
  })
  mockPrisma.deal.count.mockResolvedValue(50)

  await expect(checkDealLimit('org_1')).rejects.toThrow(LimitReachedError)
})
```

---

### 3. Mercado Pago Products (`lib/mercado-pago/__tests__/products.test.ts`)

**O que testa:**
- Configuração de preços (R$ 0, 49, 97, 149)
- Configuração de add-ons (SCRAPING_100, SCRAPING_500, WHATSAPP_EXTRA_INSTANCE)
- Cálculo de proration para upgrades
- Validação de tiers e add-ons
- Formatação de preços em BRL

**Cobertura:**
- ✅ Todos os 4 tiers têm configuração correta
- ✅ Add-ons com preços, quantidades, recurring flags
- ✅ `calculateProrationAmount()`: STARTER→PRO, PRO→BUSINESS
- ✅ `formatPrice()`: R$ 49,00, R$ 99,90, etc

**Como executar:**
```bash
npm run test -- lib/mercado-pago/__tests__/products.test.ts
```

**Exemplo de teste:**
```typescript
it('should calculate proration for upgrade', () => {
  // STARTER (49) → PRO (97)
  // Diferença: R$ 48, 15 dias: R$ 24
  const amount = calculateProrationAmount('STARTER', 'PRO', 15)
  expect(amount).toBe(24)
})
```

---

## 🔗 Testes de Integração

### 4. React Hooks (`lib/hooks/__tests__/use-entitlements.test.tsx`)

**O que testa:**
- `useEntitlements()`: Fetch de entitlements do backend
- `useFeatureAccess()`: Verificação de acesso a features
- `useAgiQuotaStatus()`: Status de quota de IA
- `useScrapingCreditsStatus()`: Status de créditos de prospecção
- Re-fetching ao trocar de organização

**Cobertura:**
- ✅ Fetch correto de entitlements por tier
- ✅ Detecção de quota ilimitada (PRO/BUSINESS)
- ✅ Detecção de quota excedida (FREE)
- ✅ Handling de erros (401, network errors)

**Como executar:**
```bash
npm run test -- lib/hooks/__tests__/use-entitlements.test.tsx
```

**Exemplo de teste:**
```typescript
it('should detect unlimited quota for PRO tier', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ tier: 'PRO', agiQuota: { limit: -1 } })
  })

  const { result } = renderHook(() => useAgiQuotaStatus())

  await waitFor(() => {
    expect(result.current.isUnlimited).toBe(true)
  })
})
```

---

## 🎨 Testes de Componentes

### 5. Feature Gate Components (`components/upgrade/__tests__/feature-gate.test.tsx`)

**O que testa:**
- `<FeatureGate>`: Bloqueia conteúdo quando feature não disponível
- `<RequireFeature>`: Valida tier mínimo
- Fallbacks customizados
- Hide when locked

**Cobertura:**
- ✅ Renderiza children quando tem acesso
- ✅ Mostra upgrade prompt quando bloqueado
- ✅ Suporta fallback customizado
- ✅ Hierarquia de tiers (BUSINESS acessa features PRO)

**Como executar:**
```bash
npm run test -- components/upgrade/__tests__/feature-gate.test.tsx
```

**Exemplo de teste:**
```typescript
it('should render children when feature is available', () => {
  useFeatureAccess.mockReturnValue(true)

  render(
    <FeatureGate feature="can_use_automation" requiredTier="PRO">
      <div>Protected Content</div>
    </FeatureGate>
  )

  expect(screen.getByText('Protected Content')).toBeInTheDocument()
})
```

---

### 6. Quota Display Components (`components/upgrade/__tests__/quota-display.test.tsx`)

**O que testa:**
- `<AgiQuotaDisplay>`: Exibição de quota de IA
- `<ScrapingCreditsDisplay>`: Exibição de créditos
- `<QuotaDashboard>`: Dashboard completo
- Estados: sem acesso, ilimitado, baixo, esgotado

**Cobertura:**
- ✅ Sem acesso (STARTER)
- ✅ Ilimitado (PRO/BUSINESS)
- ✅ Quota limitada (FREE)
- ✅ Warning quando próximo do limite (>80%)
- ✅ Estado excedido/esgotado
- ✅ Links para upgrade/compra de add-ons

**Como executar:**
```bash
npm run test -- components/upgrade/__tests__/quota-display.test.tsx
```

**Exemplo de teste:**
```typescript
it('should show exceeded state', () => {
  useAgiQuotaStatus.mockReturnValue({
    hasAccess: true,
    limit: 3,
    used: 3,
    isExceeded: true
  })

  render(<AgiQuotaDisplay />)

  expect(screen.getByText('Quota excedida')).toBeInTheDocument()
})
```

---

## 🚀 Como Executar

### Executar Todos os Testes

```bash
npm run test
```

### Executar Testes Específicos

```bash
# Por arquivo
npm run test -- lib/__tests__/entitlements.test.ts

# Por padrão
npm run test -- entitlements

# Por describe block
npm run test -- -t "Feature Gates"
```

### Executar com Interface Gráfica

```bash
npm run test:ui
```

### Executar com Cobertura

```bash
npm run test:coverage
```

**Relatório de cobertura:**
- Terminal: Mostra % de cobertura por arquivo
- HTML: `coverage/index.html` (abrir no browser)

**Meta de cobertura:**
- Entitlements: >90%
- Feature Gates: >85%
- Hooks: >80%
- Components: >75%

### Watch Mode (Re-executa ao salvar)

```bash
npm run test -- --watch
```

---

## 📊 Cobertura de Testes

### Estatísticas Esperadas

```
File                        | % Stmts | % Branch | % Funcs | % Lines
----------------------------|---------|----------|---------|--------
lib/entitlements.ts         |   100   |   100    |   100   |   100
lib/feature-gates.ts        |   95    |   90     |   95    |   95
lib/hooks/use-entitlements  |   85    |   80     |   85    |   85
lib/mercado-pago/products   |   100   |   95     |   100   |   100
components/upgrade/...      |   80    |   75     |   80    |   80
----------------------------|---------|----------|---------|--------
TOTAL                       |   92    |   88     |   92    |   92
```

### Áreas Críticas (100% de cobertura)

- ✅ `getQuota()`: Todas as combinações tier/quota
- ✅ `getLimit()`: Todas as combinações tier/limit
- ✅ `canUseFeature()`: Todas as features x tiers
- ✅ `checkDealLimit()`: FREE, STARTER, PRO, BUSINESS, grandfathering
- ✅ `calculateProrationAmount()`: Todos os upgrades possíveis

---

## 🐛 Troubleshooting

### Erro: "Cannot find module '@/lib/...'"

**Causa:** Alias `@` não configurado corretamente no vitest.config.ts

**Solução:**
```typescript
// vitest.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './')
  }
}
```

### Erro: "fetch is not defined"

**Causa:** Testes de hooks usam `fetch`, mas Happy DOM não tem global.fetch

**Solução:** Já mockado com `global.fetch = vi.fn()` nos testes

### Erro: "Prisma Client is not available"

**Causa:** Prisma não foi mockado corretamente

**Solução:**
```typescript
vi.mock('../prisma', () => ({
  prisma: mockDeep<PrismaClient>()
}))
```

### Testes de Hooks Falhando

**Causa:** Hooks dependem de contexto/providers

**Solução:** Usar `renderHook()` do Testing Library:
```typescript
const { result } = renderHook(() => useEntitlements())
await waitFor(() => {
  expect(result.current.tier).toBe('PRO')
})
```

### Testes Lentos

**Causa:** Muitos mocks de banco de dados

**Solução:**
- Usar `beforeEach(() => mockReset(prisma))`
- Evitar testes e2e para lógica de negócio
- Usar `test.concurrent` para testes independentes

---

## ✅ Checklist Pré-Deploy

Antes de fazer deploy da v2.0, execute:

```bash
# 1. Todos os testes unitários
npm run test

# 2. Cobertura mínima
npm run test:coverage
# Verificar: >90% em entitlements, >85% em feature-gates

# 3. Testes e2e (se aplicável)
npm run test:e2e

# 4. Lint
npm run lint
```

**Critérios de Aprovação:**
- ✅ Todos os testes passando (0 failures)
- ✅ Cobertura >85% em arquivos críticos
- ✅ 0 erros de lint
- ✅ 0 warnings de TypeScript

---

## 📚 Recursos

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Mock Extended](https://github.com/eratio08/vitest-mock-extended)

---

**Última atualização:** 2026-02-05
**Versão:** 1.0
**Status:** ✅ Pronto para testes
