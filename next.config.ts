import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  // @ts-expect-error - Next.js 16 deprecated eslint in NextConfig but we still need to bypass lint
  eslint: { ignoreDuringBuilds: true },
  /* Image Optimization */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/webp', 'image/avif'], // Modern formats for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Responsive breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Icon sizes
    minimumCacheTTL: 60 * 60 * 24 * 365, // Cache for 1 year (3600 * 24 * 365)
  },

  /* SEO Redirects - Fix 404s from Ahrefs */
  async redirects() {
    return [
      // Feature pages → Main features page
      {
        source: '/features/sales-playbook',
        destination: '/features',
        permanent: true,
      },
      {
        source: '/features/discovery-templates',
        destination: '/features',
        permanent: true,
      },
      {
        source: '/features/custom-fields',
        destination: '/features',
        permanent: true,
      },
      {
        source: '/features/email-automation',
        destination: '/features',
        permanent: true,
      },
      // Blog posts → Main blog page
      {
        source: '/blog/discovery-meeting-template',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/blog/crm-completo-iniciantes',
        destination: '/blog',
        permanent: true,
      },
      // Help pages → Main help page
      {
        source: '/help/primeiros-passos/entendendo-pipeline-kanban',
        destination: '/help',
        permanent: true,
      },
      {
        source: '/help/primeiros-passos/cadastrar-contatos',
        destination: '/help',
        permanent: true,
      },
      // ROI Calculator variants
      {
        source: '/calculadora-roi-spin',
        destination: '/ferramentas/calculadora-roi',
        permanent: true,
      },
      // Contact page (PT → EN)
      {
        source: '/contato',
        destination: '/contact',
        permanent: true,
      },
      // /cadastro → /register (linked from multiple blog posts)
      {
        source: '/cadastro',
        destination: '/register',
        permanent: true,
      },
      // /agradecimento → home
      {
        source: '/agradecimento',
        destination: '/',
        permanent: true,
      },
      // Missing blog posts → closest existing posts
      {
        source: '/blog/pipeline-vendas-guia',
        destination: '/blog/como-organizar-pipeline-vendas',
        permanent: true,
      },
      {
        source: '/blog/crm-vendas-consultivas',
        destination: '/blog/crm-automacao-vendas-guia-completo',
        permanent: true,
      },
      {
        source: '/blog/link-telegram',
        destination: '/blog/spin-selling-guia-completo',
        permanent: true,
      },
      // Pricing billing fragments crawled as paths
      {
        source: '/ano',
        destination: '/pricing',
        permanent: false,
      },
      {
        source: '/m%C3%AAs',
        destination: '/pricing',
        permanent: false,
      },
      // Malformed URLs crawled by Google
      {
        source: '/&',
        destination: '/',
        permanent: false,
      },
      {
        source: '/$',
        destination: '/',
        permanent: false,
      },
    ]
  },

  /* Security & Performance Headers */
  async headers() {
    return [
      // Prevent manifest.json and favicon from being indexed as pages
      {
        source: '/manifest.json',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/favicon.ico',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      // Cache immutable static assets (JS, CSS, fonts) for 1 year
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://js.sentry-cdn.com https://vercel.live https://*.clarity.ms https://www.mercadopago.com https://sdk.mercadopago.com https://cdn.jsdelivr.net https://*.posthog.com https://*.i.posthog.com",
              "style-src 'self' 'unsafe-inline' https://www.mercadopago.com https://sdk.mercadopago.com",
              "img-src 'self' data: https: blob:",
              "media-src 'self' data: blob:",
              "font-src 'self' data: https://www.mercadopago.com https://sdk.mercadopago.com https://fonts.scalar.com",
              "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://*.sentry.io https://vitals.vercel-insights.com https://*.clarity.ms https://api.mercadopago.com https://cdn.jsdelivr.net https://*.posthog.com https://*.i.posthog.com https://*.pusher.com wss://*.pusher.com https://*.roilabs.com.br wss://*.roilabs.com.br https://vercel.live wss://vercel.live",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://vercel.live https://www.mercadopago.com https://sdk.mercadopago.com",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ]
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",
});
