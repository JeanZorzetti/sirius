# URLs do Sirius CRM

## Contagem Total
- **Landing Pages**: 11 URLs
- **Autenticação**: 2 URLs
- **Dashboard**: 12+ URLs (rotas principais)
- **Blog Posts**: Dinâmico (via blogPosts)
- **API Routes**: 25+ endpoints
- **Total Aproximado**: 50+ URLs públicos

---

## 1. Landing Pages (Públicas)

| URL | Descrição | Prioridade |
|-----|-----------|------------|
| `/` | Homepage | 1.0 |
| `/features` | Recursos e funcionalidades | 0.8 |
| `/pricing` | Planos e preços | 0.9 |
| `/about` | Sobre a empresa | 0.7 |
| `/help` | Central de ajuda | 0.8 |
| `/blog` | Blog/artigos | 0.8 |
| `/privacy` | Política de privacidade | 0.3 |
| `/terms` | Termos de uso | 0.3 |
| `/changelog` | Histórico de atualizações | 0.6 |
| `/community` | Comunidade | 0.6 |

---

## 2. Autenticação

| URL | Descrição | Indexável |
|-----|-----------|-----------|
| `/login` | Login | Sim |
| `/register` | Cadastro de nova conta | Sim |
| `/auth/verify-email` | Verificação de email | Não |
| `/auth/reset-password` | Recuperação de senha | Não |

---

## 3. Dashboard (Áreas Protegidas)

### 3.1 Dashboard Principal
| URL | Descrição |
|-----|-----------|
| `/dashboard` | Dashboard inicial/overview |

### 3.2 Negócios e Pipeline
| URL | Descrição |
|-----|-----------|
| `/dashboard/deals` | Lista de negócios |
| `/dashboard/deals/[id]` | Detalhes do negócio |
| `/dashboard/pipeline` | Visualização do pipeline Kanban |
| `/dashboard/pipelines` | Gestão de múltiplos pipelines |
| `/dashboard/pipelines/[id]` | Configurar pipeline específico |

### 3.3 Contatos
| URL | Descrição |
|-----|-----------|
| `/dashboard/contacts` | Lista de contatos |
| `/dashboard/contacts/[id]` | Detalhes do contato |
| `/dashboard/contacts/new` | Novo contato |

### 3.4 Analytics
| URL | Descrição |
|-----|-----------|
| `/dashboard/analytics` | Relatórios básicos |
| `/dashboard/analytics-pro` | Analytics avançado (Pro) |

### 3.5 Automações
| URL | Descrição |
|-----|-----------|
| `/dashboard/email-automations` | Automações de email |
| `/dashboard/email-automations/new` | Nova automação |
| `/dashboard/email-automations/[id]` | Editar automação |

### 3.6 Configurações
| URL | Descrição |
|-----|-----------|
| `/dashboard/settings` | Configurações gerais |
| `/dashboard/settings/profile` | Perfil do usuário |
| `/dashboard/settings/team` | Gestão de equipe |
| `/dashboard/settings/integrations` | Integrações |
| `/dashboard/settings/notifications` | Notificações |

### 3.7 Cobrança
| URL | Descrição |
|-----|-----------|
| `/dashboard/billing` | Assinatura e faturamento |
| `/dashboard/billing/upgrade` | Upgrade de plano |
| `/dashboard/billing/invoices` | Histórico de faturas |

---

## 4. Admin (Super Admin)

| URL | Descrição |
|-----|-----------|
| `/admin` | Dashboard admin |
| `/admin/users` | Gestão de usuários |
| `/admin/analytics` | Analytics global |
| `/admin/system` | Configurações do sistema |

---

## 5. Blog (Dinâmico)

### Posts do Blog
Os posts são gerados dinamicamente a partir de `lib/blog-data.ts`:

| Padrão | Exemplo |
|--------|---------|
| `/blog/[slug]` | `/blog/como-melhorar-vendas-b2b` |

### Categorias e Tags
| URL | Descrição |
|-----|-----------|
| `/blog` | Listagem de todos os posts |
| `/blog/categoria/[slug]` | Posts por categoria (se implementado) |
| `/blog/tag/[slug]` | Posts por tag (se implementado) |

---

## 6. API Routes (Backend)

### 6.1 Autenticação
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `POST /api/auth/verify-email`
- `POST /api/auth/reset-password`

### 6.2 Negócios (Deals)
- `GET /api/deals`
- `POST /api/deals`
- `GET /api/deals/[id]`
- `PATCH /api/deals/[id]`
- `DELETE /api/deals/[id]`
- `PATCH /api/deals/[id]/stage` - Mover entre etapas

### 6.3 Contatos
- `GET /api/contacts`
- `POST /api/contacts`
- `GET /api/contacts/[id]`
- `PATCH /api/contacts/[id]`
- `DELETE /api/contacts/[id]`

### 6.4 Pipeline
- `GET /api/pipelines`
- `POST /api/pipelines`
- `PATCH /api/pipelines/[id]`
- `DELETE /api/pipelines/[id]`

### 6.5 Automações
- `GET /api/automations`
- `POST /api/automations`
- `PATCH /api/automations/[id]`
- `DELETE /api/automations/[id]`
- `POST /api/automations/[id]/trigger`

### 6.6 Analytics
- `GET /api/analytics/overview`
- `GET /api/analytics/deals`
- `GET /api/analytics/contacts`
- `GET /api/analytics/conversion`

### 6.7 Webhooks
- `POST /api/webhooks/stripe` - Stripe webhooks
- `POST /api/webhooks/google-calendar` - Google Calendar sync

### 6.8 Integrações
- `GET /api/integrations`
- `POST /api/integrations/connect`
- `DELETE /api/integrations/disconnect`

---

## 7. Assets e Recursos Estáticos

- `/sitemap.xml` - Sitemap gerado dinamicamente
- `/robots.txt` - Robots.txt
- `/favicon.ico` - Favicon
- `/icon.png` - App icon (PWA)
- `/apple-icon.png` - Apple touch icon
- `/manifest.json` - PWA manifest (se existir)

---

## 8. Integrações Externas

### WhatsApp
- Integração via WhatsApp Web (link direto)
- Formato: `https://wa.me/{phone}?text={message}`

### Google Calendar
- OAuth flow em `/api/integrations/google`
- Callback: `/api/auth/callback/google`

### Stripe
- Checkout: `/api/stripe/checkout`
- Portal: `/api/stripe/portal`
- Webhooks: `/api/webhooks/stripe`

---

## 9. PWA (Progressive Web App)

O Sirius CRM funciona como PWA:
- Instalável no desktop e mobile
- Funciona offline (service worker)
- Push notifications
- App-like experience

---

## 10. Estrutura de Dados Dinâmicos

### Blog Posts
Gerenciado em: `lib/blog-data.ts`
- Lista estática de posts com metadados
- Cada post gera uma rota `/blog/{slug}`

### Pipeline Stages
- Configurável pelo usuário via dashboard
- Armazenado no banco de dados
- Dinâmico por organização

---

## Manutenção do Documento

### Quando Atualizar:
1. ✅ Ao criar novas páginas públicas (landing, blog posts)
2. ✅ Ao adicionar novas rotas no dashboard
3. ✅ Ao criar novos endpoints de API
4. ⚠️ Rotas dinâmicas com dados do DB não precisam ser listadas individualmente

### Sincronização com Sitemap:
O arquivo `app/sitemap.ts` deve ser atualizado em paralelo para incluir:
- Todas as páginas públicas listadas aqui
- URLs dinâmicos gerados a partir de dados (blog posts, etc.)

### Checklist de Atualização:
- [ ] Adicionar URL em `docs/URLS.md`
- [ ] Adicionar URL em `app/sitemap.ts` (se público)
- [ ] Atualizar contagem total no topo
- [ ] Verificar prioridades no sitemap
- [ ] Testar URL em produção após deploy
- [ ] Submeter ao IndexNow (via `docs/INDEXNOW.md`)

---

## Diferenças do Orion ERP

O Sirius CRM tem foco diferente do Orion:

| Aspecto | Sirius CRM | Orion ERP |
|---------|------------|-----------|
| **Foco** | Gestão de vendas B2B | ERP completo |
| **Módulos** | Deals, Pipeline, Contatos | Estoque, Fiscal, Financeiro, Vendas |
| **Complexidade** | Simples e direto | Completo e robusto |
| **Target** | PMEs e vendedores | Empresas de varejo/serviços |
| **Integrações** | WhatsApp, Google Calendar | NF-e, SPED, Pagamentos |

---

**Última atualização**: 2024-01-23
**Versão**: 1.0.0
**Base URL**: https://siriuscrm.com.br
