import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['pt-BR'],
  defaultLocale: 'pt-BR',
  localePrefix: 'as-needed', // idioma único: nenhuma rota leva prefixo
  localeDetection: false, // Não redirecionar baseado no Accept-Language do browser

  // Locale EN aposentado (spec 004). O mapa virou identidade — fica de pé porque
  // é ele que dá tipagem às rotas em createNavigation(). As URLs /en indexadas são
  // tratadas por 301 em next.config.ts, não aqui.
  // Pathnames
  pathnames: {
    '/': '/',
    '/features': '/features',
    '/features/[slug]': '/features/[slug]',
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

    // '/fundadores' removido: a página nunca foi construída e o sitemap a anunciava
    // com priority 0.9 → 404 auto-infligido. Reativar junto com app/[locale]/(marketing)/fundadores/.
    '/proposta': '/proposta',
    '/anuario': '/anuario',
    '/followup': '/followup',
    '/vendas-automaticas': '/vendas-automaticas',

    // Ferramentas
    '/ferramentas': '/ferramentas',
    '/ferramentas/calculadora-roi': '/ferramentas/calculadora-roi',
    '/ferramentas/calculadora-roi-agencias': '/ferramentas/calculadora-roi-agencias',
    '/ferramentas/calculadora-roi-consultores': '/ferramentas/calculadora-roi-consultores',
    '/ferramentas/calculadora-roi-corretores': '/ferramentas/calculadora-roi-corretores',
    '/ferramentas/calculadora-roi-energia-solar': '/ferramentas/calculadora-roi-energia-solar',
    '/ferramentas/calculadora-roi-representantes': '/ferramentas/calculadora-roi-representantes',

    // Soluções (nichos)
    '/solucoes': '/solucoes',
    '/solucoes/[slug]': '/solucoes/[slug]',
    '/solucoes/cidade/[slug]': '/solucoes/cidade/[slug]',

    // Blog
    '/blog': '/blog',
    '/blog/[slug]': '/blog/[slug]',
    '/blog/categoria/[category]': '/blog/categoria/[category]',

    // Help
    '/help': '/help',
    '/help/[categoria]/[slug]': '/help/[categoria]/[slug]',

    // Referral
    '/r/[code]': '/r/[code]',
    '/indique': '/indique',

    // Dashboard (slugs universais)
    '/dashboard': '/dashboard',
    '/dashboard/pipeline': '/dashboard/pipeline',
    '/dashboard/pipelines': '/dashboard/pipelines',
    '/dashboard/contacts': '/dashboard/contacts',
    '/dashboard/deals': '/dashboard/deals',
    '/dashboard/analytics': '/dashboard/analytics',
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
    '/dashboard/support': '/dashboard/support',
    '/dashboard/support/[id]': '/dashboard/support/[id]',

    // Checkout
    '/checkout/sucesso': '/checkout/sucesso',

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
    '/admin/support': '/admin/support',
    '/admin/support/[id]': '/admin/support/[id]',
  },
});

export type Routing = typeof routing;

import { createNavigation } from 'next-intl/navigation';
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
