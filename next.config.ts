import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// @ts-ignore - next-pwa doesn't have TypeScript definitions
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* Image Optimization */
  images: {
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
    ]
  },

  /* Security Headers */
  async headers() {
    return [
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
              "font-src 'self' data: https://www.mercadopago.com https://sdk.mercadopago.com https://fonts.scalar.com",
              "connect-src 'self' https://www.google-analytics.com https://*.sentry.io https://vitals.vercel-insights.com https://*.clarity.ms https://api.mercadopago.com https://cdn.jsdelivr.net https://*.posthog.com https://*.i.posthog.com https://*.pusher.com wss://*.pusher.com",
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

// Configure PWA
const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-font-assets",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-image-assets",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-js-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:css|less)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-style-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/api\/.*$/i,
      handler: "NetworkFirst",
      method: "GET",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 10, // fallback to cache if network takes > 10s
      },
    },
    {
      urlPattern: /.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "others",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
})(nextConfig);

export default withSentryConfig(pwaConfig, {
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
