# Sirius CRM — Store Listing Metadata

## App Identity

- **App ID (Bundle):** `com.roilabs.sirius`
- **Version:** 1.0.0 (versionCode: 10000)
- **Category:** Business / Productivity
- **Content Rating:** 4+ (Everyone)
- **Privacy Policy:** https://siriuscrm.com.br/privacy
- **Terms of Service:** https://siriuscrm.com.br/terms
- **Support Email:** suporte@roilabs.com.br
- **Support URL:** https://siriuscrm.com.br/help
- **Developer:** ROI Labs LTDA

---

## Google Play Store (Android)

### Title (≤ 30 chars)
```
Sirius CRM - Gestão de Vendas
```

### Short Description (≤ 80 chars)
```
CRM completo para times de vendas B2B. Pipeline, contatos e automações.
```

### Full Description (≤ 4000 chars)
```
Sirius CRM é o sistema de gestão de relacionamento com clientes mais intuitivo para times de vendas B2B no Brasil.

🚀 PRINCIPAIS FUNCIONALIDADES

📊 Pipeline Kanban
Visualize e gerencie seus negócios em um pipeline visual intuitivo. Arraste e solte deals entre etapas, defina valores e probabilidades, e acompanhe o progresso em tempo real.

👥 Gestão de Contatos
Centralize todos os seus contatos e empresas em um único lugar. Histórico completo de interações, notas, tags e campos personalizados.

💬 Chat WhatsApp Integrado
Gerencie todas as suas conversas do WhatsApp diretamente no CRM. Histórico completo, atribuição de responsáveis e respostas rápidas.

📅 Agenda e Tarefas
Nunca perca um follow-up. Crie tarefas, eventos e lembretes sincronizados com seu calendário.

📈 Analytics em Tempo Real
Dashboards com métricas de vendas, taxa de conversão, tempo médio de fechamento e análise de negócios perdidos.

⚡ Automações
Automatize emails de follow-up, notificações de pipeline e sequências de cadência para aumentar sua produtividade.

🔔 Notificações Push
Seja notificado quando uma proposta for visualizada, quando um deal ficar parado ou quando receber uma mensagem no WhatsApp.

📱 100% MOBILE-FIRST
O Sirius CRM foi desenvolvido pensando em você no campo. Interface otimizada para uso em smartphones com gestos nativos, modo offline e sincronização automática.

🔒 SEGURO E CONFIÁVEL
Seus dados estão protegidos com criptografia de ponta a ponta. Autenticação biométrica disponível (Face ID / Touch ID / Impressão Digital).

🌐 FUNCIONA OFFLINE
Continue trabalhando mesmo sem internet. O Sirius CRM sincroniza automaticamente quando você reconectar.

---

Desenvolvido por ROI Labs — Tecnologia que gera resultado.
```

### Keywords (Play Store tags)
```
crm, vendas, pipeline, contatos, whatsapp, automacao, gestao, negocios, b2b, leads, clientes
```

---

## Apple App Store (iOS)

### Name (≤ 30 chars)
```
Sirius CRM
```

### Subtitle (≤ 30 chars)
```
Gestão de Vendas Inteligente
```

### Keywords (≤ 100 chars, comma-separated)
```
crm,vendas,pipeline,contatos,whatsapp,automacao,gestao,negocios,b2b,leads,clientes,sirius
```

### Description
(Same as Google Play full description above)

### What's New (first release)
```
Primeira versão do Sirius CRM para iOS.

• Pipeline Kanban visual
• Integração WhatsApp
• Notificações push em tempo real
• Modo offline com sincronização automática
• Autenticação por Face ID / Touch ID
• Analytics e relatórios
```

### Support URL
```
https://siriuscrm.com.br/help
```

### Marketing URL
```
https://siriuscrm.com.br
```

---

## Required Assets

### Icons

| Platform | Size | File |
|----------|------|------|
| Android (Play Store) | 512×512 | `public/icons/icon-512x512.png` |
| iOS (App Store Connect) | 1024×1024 | `assets/store/icon-1024.png` (to create) |
| Android maskable | 512×512 | `public/icons/manifest-icon-512.maskable.png` |

### Feature Graphic (Play Store only)
- Size: 1024×500 px
- File: `assets/store/feature-graphic-1024x500.png` (to create)
- Should show: App UI + tagline "Gerencie suas vendas em movimento"

### Screenshots

**Android Phone (1080×1920 or 1440×2560)**
1. Pipeline Kanban com deals
2. Detalhe de deal com histórico
3. Chat WhatsApp
4. Analytics dashboard
5. Contatos com filtros

**Android Tablet 7" (1200×1920)**
1. Dashboard principal
2. Pipeline kanban

**iPhone 6.5" / 6.7" (1284×2778 or 1290×2796)**
1. Pipeline Kanban com deals
2. Detalhe de deal com histórico
3. Chat WhatsApp
4. Analytics dashboard
5. Contatos com filtros

**iPad Pro 12.9" (2048×2732)**
1. Dashboard principal
2. Pipeline kanban

*Screenshots location: `assets/store/screenshots/`*

---

## Build Instructions

See: [BUILD_NATIVE.md](./BUILD_NATIVE.md)

## Signing Requirements

### Android
- Keystore file: `sirius-release.keystore` (store outside repo)
- Env vars: `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`
- Min SDK: 26 (Android 8.0)
- Target SDK: 34 (Android 14)

### iOS
- Apple Developer account ($99/year)
- Bundle ID: `com.roilabs.sirius`
- Provisioning Profile: Distribution (App Store)
- Min iOS version: 14.0
- Xcode: 15+

---

## Store Review Guidelines Notes

- App requires account creation (B2B SaaS — expected)
- WhatsApp integration uses official Meta Business API
- Location access: used for check-in feature (optional, permission-gated)
- Camera access: used for OCR business card scanning (optional)
- Notifications: used for deal and task reminders (optional, permission-gated)
- Biometric: optional, for faster login only

**Test Account for Reviewers:**
- Create at: https://siriuscrm.com.br/register
- Or provide staging credentials if requested
