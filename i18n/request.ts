import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { type Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Fallback para o locale padrão se inválido
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  // Carregar todos os namespaces para o locale
  const [common, marketing, auth, dashboard, blog, errors, emails, api, components, lib] = await Promise.all([
    import(`../messages/${locale}/common.json`).then((m) => m.default),
    import(`../messages/${locale}/marketing.json`).then((m) => m.default),
    import(`../messages/${locale}/auth.json`).then((m) => m.default),
    import(`../messages/${locale}/dashboard.json`).then((m) => m.default.dashboard),
    import(`../messages/${locale}/blog.json`).then((m) => m.default.blog),
    import(`../messages/${locale}/errors.json`).then((m) => m.default.errors),
    import(`../messages/${locale}/emails.json`).then((m) => m.default.emails),
    import(`../messages/${locale}/api.json`).then((m) => m.default),
    import(`../messages/${locale}/components.json`).then((m) => m.default),
    import(`../messages/${locale}/lib.json`).then((m) => m.default),
  ]);

  return {
    locale,
    messages: {
      common,
      marketing,
      auth,
      dashboard,
      blog,
      errors,
      emails,
      api,
      components,
      lib,
    },
  };
});
