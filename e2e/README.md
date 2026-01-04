# Testes E2E com Playwright

Este diretório contém os testes end-to-end do Sirius CRM usando Playwright.

## Setup

Os testes já estão configurados. Para executar:

### 1. Instalar dependências (já feito)
```bash
npm install
```

### 2. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

### 3. Em outro terminal, executar os testes
```bash
npm run test:e2e              # Rodar todos os testes
npm run test:e2e:ui           # Rodar com interface visual
npm run test:e2e:debug        # Rodar em modo debug
npm run test:e2e:report       # Ver relatório HTML
```

## Estrutura

```
e2e/
├── fixtures/
│   └── auth.ts              # Fixtures de autenticação
├── page-objects/
│   └── base-page.ts         # Page object base
├── auth/                    # Testes de autenticação (próximo)
├── deals/                   # Testes de deals (próximo)
├── pipelines/               # Testes de pipelines (próximo)
└── example.spec.ts          # Teste de exemplo
```

## Fixtures Disponíveis

### `authenticatedPage`
Cria um usuário temporário e fornece uma página autenticada.

```typescript
test('meu teste', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard')
  // ... teste aqui
})
```

### `freeUserPage`
Usuário com plano FREE.

```typescript
test('teste feature gate', async ({ freeUserPage }) => {
  // Usuário está limitado a 1 pipeline
})
```

### `proUserPage`
Usuário com plano PRO (TODO: implementar upgrade).

```typescript
test('teste feature PRO', async ({ proUserPage }) => {
  // Usuário tem acesso a múltiplos pipelines
})
```

## Page Objects

Use o `BasePage` como base para criar page objects específicos:

```typescript
import { BasePage } from './base-page'

export class LoginPage extends BasePage {
  async login(email: string, password: string) {
    await this.fill('input[name="email"]', email)
    await this.fill('input[name="password"]', password)
    await this.click('button[type="submit"]')
  }
}
```

## Observações

- **Turbopack Issue**: O webServer automático está desabilitado devido a bugs do Next.js 16 com Turbopack. Inicie o dev server manualmente.
- **Database**: Os testes usam o mesmo banco de desenvolvimento. Para CI, configure um banco de teste separado.
- **Cleanup**: Cada fixture cria usuários temporários com timestamps únicos.

## Próximos Passos

1. ✅ Setup Playwright
2. ⏳ Testes de Autenticação (Task 6.2)
3. ⏳ Testes de Pipeline & Deals (Task 6.3)
4. ⏳ Testes de Pagamentos (Task 6.4)
