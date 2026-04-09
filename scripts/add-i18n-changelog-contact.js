const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, '..');

const en = JSON.parse(fs.readFileSync(path.join(base, 'messages/en/marketing.json'), 'utf8'));
const ptBR = JSON.parse(fs.readFileSync(path.join(base, 'messages/pt-BR/marketing.json'), 'utf8'));

// ─── CHANGELOG ───────────────────────────────────────────────────────────────

ptBR.changelog = {
  meta: {
    title: 'Changelog | Sirius CRM',
    description: 'Acompanhe todas as novidades, melhorias e correções do Sirius CRM. Fique por dentro das atualizações mais recentes da plataforma.',
    ogTitle: 'Changelog | Sirius CRM',
    ogDescription: 'Acompanhe todas as novidades e atualizações do Sirius CRM.',
  },
  hero: {
    subtitle: 'Acompanhe todas as novidades, melhorias e correções do Sirius CRM. Estamos sempre evoluindo para oferecer a melhor experiência.',
  },
  itemTypes: { feature: 'Novo', improvement: 'Melhoria', fix: 'Correção', security: 'Segurança' },
  releaseTypes: { major: 'Release', beta: 'Beta' },
  releases: {
    v140: {
      items: [
        { title: 'Progressive Web App (PWA)', description: 'Instale o Sirius como aplicativo nativo no seu celular ou desktop com suporte offline completo.' },
        { title: 'Web Push Notifications', description: 'Receba notificações em tempo real sobre novos deals, mensagens WhatsApp e lembretes de calendário.' },
        { title: 'Background Sync Offline', description: 'Crie deals e contatos mesmo sem internet — tudo será sincronizado automaticamente quando voltar online.' },
        { title: 'Preferências de Notificação', description: 'Controle granular de quais notificações você deseja receber: deals, WhatsApp, calendário e muito mais.' },
        { title: 'Dashboard de Métricas PWA', description: 'Admin pode monitorar taxa de instalação, conversão de push notifications e uso offline no /admin/pwa-metrics.' },
      ],
    },
    v130: {
      items: [
        { title: 'Testes E2E Completos', description: 'Implementados 118 testes E2E com Playwright cobrindo autenticação, pipelines e deals em 3 browsers.' },
        { title: 'Google OAuth Login', description: 'Agora você pode fazer login com sua conta Google de forma rápida e segura.' },
      ],
    },
    v120: {
      items: [
        { title: 'Múltiplos Pipelines (PRO)', description: 'Usuários PRO agora podem criar pipelines ilimitados para diferentes processos de vendas.' },
        { title: 'Pipeline Selector', description: 'Novo seletor visual de pipeline com contador de deals e persistência no localStorage.' },
        { title: 'Gerenciamento de Pipelines', description: 'Nova página dedicada para criar, editar e deletar pipelines com validações inteligentes.' },
      ],
    },
    v110: {
      items: [
        { title: 'Automações de Email', description: 'Configure automações personalizadas: Welcome Email, Deal Created, Stage Changed e Upgrade Nudge.' },
        { title: 'Editor de Templates', description: 'Editor visual para personalizar assunto e corpo dos emails com preview em tempo real.' },
        { title: 'Histórico de Emails', description: 'Acompanhe todos os emails enviados com status de entrega, abertura e cliques (PRO).' },
        { title: 'Testes de Segurança', description: 'Implementados 50+ testes unitários cobrindo autenticação, isolamento multi-tenant e pagamentos.' },
      ],
    },
    v100: {
      items: [
        { title: 'Lançamento Oficial', description: 'Primeira versão estável do Sirius CRM com todas as funcionalidades core.' },
        { title: 'Pipeline Kanban', description: 'Gestão visual de negócios com drag & drop entre etapas personalizáveis.' },
        { title: 'Gestão de Contatos', description: 'CRUD completo de contatos com integração WhatsApp de 1 clique.' },
        { title: 'Analytics Dashboard', description: 'Métricas em tempo real: taxa de conversão, ticket médio e previsão de fechamento.' },
        { title: 'Autenticação Segura', description: 'Sistema de login/registro com JWT, bcrypt e proteção contra ataques comuns.' },
        { title: 'Isolamento Multi-Tenant', description: 'Dados de cada organização completamente isolados com validações em todas as queries.' },
      ],
    },
    v090: {
      items: [
        { title: 'Mercado Pago Integration', description: 'Integração completa com Mercado Pago para pagamentos recorrentes e upgrade PRO.' },
        { title: 'Feature Gates', description: 'Sistema de limites por plano: 10 deals para Free, ilimitado para PRO.' },
        { title: 'Sentry Monitoring', description: 'Captura e rastreamento de erros em produção com source maps.' },
        { title: 'Structured Logging', description: 'Sistema de logs estruturado com Pino para melhor debugging.' },
      ],
    },
  },
  subscribe: {
    title: 'Quer receber notificações de atualizações?',
    subtitle: 'Crie uma conta gratuita e receba emails quando lançarmos novas funcionalidades.',
    cta: 'Começar Grátis',
    blog: 'Ler Blog',
  },
  roadmap: {
    title: 'Próximas Funcionalidades',
    subtitle: 'Estamos trabalhando em recursos incríveis para os próximos meses:',
    items: [
      { title: 'Integrações N8N', description: 'Automação avançada de workflows com webhooks bidirecionais.' },
      { title: 'WhatsApp Evolution', description: 'Integração completa: enviar, receber e automatizar mensagens.' },
      { title: 'Google Calendar Sync', description: 'Sincronização bidirecional de eventos e lembretes automáticos.' },
      { title: 'AI Insights', description: 'Sugestões inteligentes de próximas ações baseadas em IA.' },
    ],
  },
};

en.changelog = {
  meta: {
    title: 'Changelog | Sirius CRM',
    description: 'Track all updates, improvements and fixes to Sirius CRM. Stay up to date with the latest platform changes.',
    ogTitle: 'Changelog | Sirius CRM',
    ogDescription: 'Track all updates and changes to Sirius CRM.',
  },
  hero: {
    subtitle: 'Track all updates, improvements and fixes to Sirius CRM. We\'re always evolving to deliver the best experience.',
  },
  itemTypes: { feature: 'New', improvement: 'Improvement', fix: 'Fix', security: 'Security' },
  releaseTypes: { major: 'Release', beta: 'Beta' },
  releases: {
    v140: {
      items: [
        { title: 'Progressive Web App (PWA)', description: 'Install Sirius as a native app on your phone or desktop with full offline support.' },
        { title: 'Web Push Notifications', description: 'Receive real-time notifications about new deals, WhatsApp messages and calendar reminders.' },
        { title: 'Offline Background Sync', description: 'Create deals and contacts even without internet — everything syncs automatically when you come back online.' },
        { title: 'Notification Preferences', description: 'Granular control over which notifications you want to receive: deals, WhatsApp, calendar and more.' },
        { title: 'PWA Metrics Dashboard', description: 'Admins can monitor install rate, push notification conversion and offline usage at /admin/pwa-metrics.' },
      ],
    },
    v130: {
      items: [
        { title: 'Full E2E Test Suite', description: 'Implemented 118 E2E tests with Playwright covering authentication, pipelines and deals across 3 browsers.' },
        { title: 'Google OAuth Login', description: 'You can now sign in with your Google account quickly and securely.' },
      ],
    },
    v120: {
      items: [
        { title: 'Multiple Pipelines (PRO)', description: 'PRO users can now create unlimited pipelines for different sales processes.' },
        { title: 'Pipeline Selector', description: 'New visual pipeline selector with deal counter and localStorage persistence.' },
        { title: 'Pipeline Management', description: 'Dedicated page to create, edit and delete pipelines with smart validations.' },
      ],
    },
    v110: {
      items: [
        { title: 'Email Automations', description: 'Configure custom automations: Welcome Email, Deal Created, Stage Changed and Upgrade Nudge.' },
        { title: 'Template Editor', description: 'Visual editor to customize email subject and body with real-time preview.' },
        { title: 'Email History', description: 'Track all sent emails with delivery, open and click status (PRO).' },
        { title: 'Security Tests', description: 'Implemented 50+ unit tests covering authentication, multi-tenant isolation and payments.' },
      ],
    },
    v100: {
      items: [
        { title: 'Official Launch', description: 'First stable version of Sirius CRM with all core features.' },
        { title: 'Kanban Pipeline', description: 'Visual deal management with drag & drop between customizable stages.' },
        { title: 'Contact Management', description: 'Full contact CRUD with 1-click WhatsApp integration.' },
        { title: 'Analytics Dashboard', description: 'Real-time metrics: conversion rate, average ticket and close date forecast.' },
        { title: 'Secure Authentication', description: 'Login/register system with JWT, bcrypt and protection against common attacks.' },
        { title: 'Multi-Tenant Isolation', description: 'Each organization\'s data is completely isolated with validations on every query.' },
      ],
    },
    v090: {
      items: [
        { title: 'Mercado Pago Integration', description: 'Full integration with Mercado Pago for recurring payments and PRO upgrade.' },
        { title: 'Feature Gates', description: 'Plan-based limits: 10 deals for Free, unlimited for PRO.' },
        { title: 'Sentry Monitoring', description: 'Error capture and tracking in production with source maps.' },
        { title: 'Structured Logging', description: 'Pino-based structured logging system for better debugging.' },
      ],
    },
  },
  subscribe: {
    title: 'Want to receive update notifications?',
    subtitle: 'Create a free account and receive emails when we launch new features.',
    cta: 'Get Started Free',
    blog: 'Read Blog',
  },
  roadmap: {
    title: 'Coming Soon',
    subtitle: 'We\'re working on amazing features for the coming months:',
    items: [
      { title: 'N8N Integrations', description: 'Advanced workflow automation with bidirectional webhooks.' },
      { title: 'WhatsApp Evolution', description: 'Full integration: send, receive and automate messages.' },
      { title: 'Google Calendar Sync', description: 'Bidirectional event sync and automatic reminders.' },
      { title: 'AI Insights', description: 'Intelligent next-action suggestions powered by AI.' },
    ],
  },
};

// ─── CONTACT ─────────────────────────────────────────────────────────────────

ptBR.contact = {
  meta: {
    title: 'Contato | Sirius CRM',
    description: 'Entre em contato com a equipe do Sirius CRM. Estamos aqui para ajudar com dúvidas, suporte técnico e parcerias.',
    ogTitle: 'Contato | Sirius CRM',
    ogDescription: 'Entre em contato com a equipe do Sirius CRM.',
  },
  hero: {
    title: 'Entre em Contato',
    subtitle: 'Tem alguma dúvida, sugestão ou precisa de ajuda? Nossa equipe está pronta para atender você.',
  },
  info: {
    title: 'Informações de Contato',
    email: { title: 'Email' },
    chat: { title: 'Chat ao Vivo', available: 'Disponível no painel do cliente', hours: 'Horário comercial' },
    schedule: { title: 'Horário de Atendimento', weekdays: 'Segunda a Sexta: 9h - 18h', saturday: 'Sábado: 9h - 13h' },
    location: { title: 'Localização', description: 'Brasil — Atendimento 100% remoto' },
    responseTime: { title: 'Tempo médio de resposta', description: 'Respondemos a maioria das mensagens em até 24 horas úteis. Para suporte urgente, utilize o chat ao vivo no painel.' },
  },
  form: {
    title: 'Envie sua Mensagem',
    name: { label: 'Nome completo *', placeholder: 'Seu nome' },
    email: { label: 'Email *', placeholder: 'seu@email.com' },
    phone: { label: 'Telefone', placeholder: '(11) 99999-9999' },
    company: { label: 'Empresa', placeholder: 'Nome da empresa' },
    subject: { label: 'Assunto *', placeholder: 'Selecione o assunto' },
    message: { label: 'Mensagem *', placeholder: 'Descreva sua dúvida, sugestão ou como podemos ajudar...' },
    submit: 'Enviar Mensagem',
    sending: 'Enviando...',
  },
  subjects: [
    { value: 'sales', label: 'Informações comerciais' },
    { value: 'support', label: 'Suporte técnico' },
    { value: 'partnership', label: 'Parcerias' },
    { value: 'feedback', label: 'Feedback e sugestões' },
    { value: 'other', label: 'Outros assuntos' },
  ],
  success: {
    title: 'Mensagem Enviada!',
    description: 'Obrigado por entrar em contato. Nossa equipe recebeu sua mensagem e responderemos o mais breve possível.',
    backHome: 'Voltar ao Início',
    newMessage: 'Enviar Nova Mensagem',
  },
  toast: {
    successTitle: 'Mensagem enviada!',
    successDesc: 'Entraremos em contato em breve.',
    errorTitle: 'Erro ao enviar',
    errorDesc: 'Tente novamente mais tarde.',
  },
  faq: {
    title: 'Perguntas Frequentes',
    subtitle: 'Confira as respostas para as dúvidas mais comuns',
    q1: 'Quanto tempo leva para ter resposta?',
    a1: 'Nossa equipe responde a maioria das mensagens em até 24 horas úteis. Para assuntos urgentes, recomendamos o chat ao vivo.',
    q2: 'Como faço para testar o Sirius CRM?',
    a2: 'Você pode criar uma conta gratuita e testar todas as funcionalidades por 14 dias sem compromisso.',
    a2Link: 'Criar conta grátis',
    q3: 'Vocês oferecem treinamento?',
    a3: 'Sim! Além da documentação completa, oferecemos sessões de onboarding para novos clientes e treinamentos para equipes.',
    helpCenter: 'Ver Central de Ajuda',
  },
};

en.contact = {
  meta: {
    title: 'Contact | Sirius CRM',
    description: 'Get in touch with the Sirius CRM team. We\'re here to help with questions, technical support and partnerships.',
    ogTitle: 'Contact | Sirius CRM',
    ogDescription: 'Get in touch with the Sirius CRM team.',
  },
  hero: {
    title: 'Get in Touch',
    subtitle: 'Have a question, suggestion or need help? Our team is ready to assist you.',
  },
  info: {
    title: 'Contact Information',
    email: { title: 'Email' },
    chat: { title: 'Live Chat', available: 'Available in the customer dashboard', hours: 'Business hours' },
    schedule: { title: 'Support Hours', weekdays: 'Monday–Friday: 9am – 6pm', saturday: 'Saturday: 9am – 1pm' },
    location: { title: 'Location', description: 'Brazil — 100% remote support' },
    responseTime: { title: 'Average response time', description: 'We respond to most messages within 24 business hours. For urgent support, use the live chat in the dashboard.' },
  },
  form: {
    title: 'Send us a Message',
    name: { label: 'Full name *', placeholder: 'Your name' },
    email: { label: 'Email *', placeholder: 'you@email.com' },
    phone: { label: 'Phone', placeholder: '+1 (555) 000-0000' },
    company: { label: 'Company', placeholder: 'Company name' },
    subject: { label: 'Subject *', placeholder: 'Select a subject' },
    message: { label: 'Message *', placeholder: 'Describe your question, suggestion or how we can help...' },
    submit: 'Send Message',
    sending: 'Sending...',
  },
  subjects: [
    { value: 'sales', label: 'Sales information' },
    { value: 'support', label: 'Technical support' },
    { value: 'partnership', label: 'Partnerships' },
    { value: 'feedback', label: 'Feedback & suggestions' },
    { value: 'other', label: 'Other topics' },
  ],
  success: {
    title: 'Message Sent!',
    description: 'Thank you for reaching out. Our team has received your message and will get back to you as soon as possible.',
    backHome: 'Back to Home',
    newMessage: 'Send Another Message',
  },
  toast: {
    successTitle: 'Message sent!',
    successDesc: 'We\'ll get back to you shortly.',
    errorTitle: 'Failed to send',
    errorDesc: 'Please try again later.',
  },
  faq: {
    title: 'Frequently Asked Questions',
    subtitle: 'Answers to the most common questions',
    q1: 'How long does it take to get a response?',
    a1: 'Our team responds to most messages within 24 business hours. For urgent matters, we recommend the live chat.',
    q2: 'How can I try Sirius CRM?',
    a2: 'You can create a free account and test all features for 14 days with no commitment.',
    a2Link: 'Create free account',
    q3: 'Do you offer training?',
    a3: 'Yes! In addition to full documentation, we offer onboarding sessions for new customers and team training.',
    helpCenter: 'View Help Center',
  },
};

fs.writeFileSync(path.join(base, 'messages/en/marketing.json'), JSON.stringify(en, null, 2));
fs.writeFileSync(path.join(base, 'messages/pt-BR/marketing.json'), JSON.stringify(ptBR, null, 2));
console.log('changelog + contact translations added.');
