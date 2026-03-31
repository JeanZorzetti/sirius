import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['pt-BR', 'en'],
  defaultLocale: 'pt-BR',
  localePrefix: 'as-needed', // pt-BR sem prefixo, en com /en
  localeDetection: false, // Não redirecionar baseado no Accept-Language do browser

  // Pathnames localizados: segmentos em PT-BR → EN
  pathnames: {
    '/': '/',
    '/features': '/features',
    '/pricing': '/pricing',
    '/about': '/about',
    '/contact': '/contact',
    '/changelog': '/changelog',
    '/community': '/community',
    '/download': '/download',
    '/login': '/login',
    '/register': '/register',
    '/forgot-password': '/forgot-password',
    '/reset-password': '/reset-password',
    '/privacy': '/privacy',
    '/terms': '/terms',
    '/design-system': '/design-system',
    '/debug': '/debug',

    // Slug único PT → traduzido em EN
    '/fundadores': {
      'pt-BR': '/fundadores',
      en: '/founders',
    },
    '/proposta': {
      'pt-BR': '/proposta',
      en: '/proposal',
    },
    '/anuario': {
      'pt-BR': '/anuario',
      en: '/yearbook',
    },
    '/followup': {
      'pt-BR': '/followup',
      en: '/followup', // palavra universal
    },
    '/vendas-automaticas': {
      'pt-BR': '/vendas-automaticas',
      en: '/automatic-sales',
    },

    // Ferramentas / Tools
    '/ferramentas': {
      'pt-BR': '/ferramentas',
      en: '/tools',
    },
    '/ferramentas/calculadora-roi': {
      'pt-BR': '/ferramentas/calculadora-roi',
      en: '/tools/roi-calculator',
    },
    '/ferramentas/calculadora-roi-agencias': {
      'pt-BR': '/ferramentas/calculadora-roi-agencias',
      en: '/tools/roi-calculator-agencies',
    },
    '/ferramentas/calculadora-roi-consultores': {
      'pt-BR': '/ferramentas/calculadora-roi-consultores',
      en: '/tools/roi-calculator-consultants',
    },
    '/ferramentas/calculadora-roi-corretores': {
      'pt-BR': '/ferramentas/calculadora-roi-corretores',
      en: '/tools/roi-calculator-brokers',
    },
    '/ferramentas/calculadora-roi-energia-solar': {
      'pt-BR': '/ferramentas/calculadora-roi-energia-solar',
      en: '/tools/roi-calculator-solar',
    },
    '/ferramentas/calculadora-roi-representantes': {
      'pt-BR': '/ferramentas/calculadora-roi-representantes',
      en: '/tools/roi-calculator-reps',
    },

    // Soluções / Solutions (nichos)
    '/solucoes': {
      'pt-BR': '/solucoes',
      en: '/solutions',
    },
    '/solucoes/[slug]': {
      'pt-BR': '/solucoes/[slug]',
      en: '/solutions/[slug]',
    },
    '/solucoes/cidade/[slug]': {
      'pt-BR': '/solucoes/cidade/[slug]',
      en: '/solutions/city/[slug]',
    },

    // Blog
    '/blog': '/blog',
    '/blog/[slug]': '/blog/[slug]',
    '/blog/categoria/[category]': {
      'pt-BR': '/blog/categoria/[category]',
      en: '/blog/category/[category]',
    },

    // Help
    '/help': '/help',
    '/help/[categoria]/[slug]': {
      'pt-BR': '/help/[categoria]/[slug]',
      en: '/help/[category]/[slug]',
    },

    // Referral
    '/r/[code]': '/r/[code]',

    // Dashboard (slugs universais)
    '/dashboard': '/dashboard',
    '/dashboard/pipeline': '/dashboard/pipeline',
    '/dashboard/pipelines': '/dashboard/pipelines',
    '/dashboard/contacts': '/dashboard/contacts',
    '/dashboard/deals': '/dashboard/deals',
    '/dashboard/analytics': '/dashboard/analytics',
    '/dashboard/analytics-pro': '/dashboard/analytics-pro',
    '/dashboard/chat': '/dashboard/chat',
    '/dashboard/products': '/dashboard/products',
    '/dashboard/billing': '/dashboard/billing',
    '/dashboard/settings': '/dashboard/settings',
    '/dashboard/agenda': '/dashboard/agenda',
    '/dashboard/automations': '/dashboard/automations',
    '/dashboard/email-automations': '/dashboard/email-automations',
    '/dashboard/marketing': '/dashboard/marketing',
    '/dashboard/prospecting': '/dashboard/prospecting',
    '/dashboard/visits': '/dashboard/visits',

    // Checkout
    '/checkout/sucesso': {
      'pt-BR': '/checkout/sucesso',
      en: '/checkout/success',
    },

    // IA
    '/IA': '/IA',
    '/IA/agents': '/IA/agents',
    '/IA/analytics': '/IA/analytics',
    '/IA/command': '/IA/command',
    '/IA/pipeline': '/IA/pipeline',
    '/IA/settings': '/IA/settings',

    // Admin
    '/admin': '/admin',
    '/admin/ab-testing': '/admin/ab-testing',
    '/admin/analytics': '/admin/analytics',
    '/admin/auto-citation': '/admin/auto-citation',
    '/admin/funnel': '/admin/funnel',
    '/admin/generative-ui': '/admin/generative-ui',
    '/admin/graph-rag': '/admin/graph-rag',
    '/admin/graph-viz': '/admin/graph-viz',
    '/admin/knowledge-graph': '/admin/knowledge-graph',
    '/admin/organizations': '/admin/organizations',
    '/admin/pwa-metrics': '/admin/pwa-metrics',
    '/admin/seo': '/admin/seo',
    '/admin/spin-chat': '/admin/spin-chat',
    '/admin/users': '/admin/users',
    '/admin/cache-stats': '/admin/cache-stats',
  },
});

export type Routing = typeof routing;

import { createNavigation } from 'next-intl/navigation';
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
