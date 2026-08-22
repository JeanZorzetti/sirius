import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/i18n/config'
import { ORG_SAME_AS, FOUNDER } from '@/lib/geo/entity'
import '../globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
})

import { Suspense } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { PWARegister } from '@/components/pwa-register'
import { PushNotificationManager } from '@/components/push-notification-manager'
import { OfflineStatus } from '@/components/offline-status'
import { GoogleTagManager, GoogleTagManagerNoScript } from '@/components/google-tag-manager'
import { analyticsConfig } from '@/lib/analytics-config'
import { Toaster } from '@/components/ui/sonner'
import { PostHogProvider } from '../providers'
import { AiTrafficMonitor } from '@/components/analytics/ai-traffic-monitor'

// ─── Metadata dinâmica por locale ──────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  const isPtBR = locale === 'pt-BR'
  const baseUrl = 'https://siriuscrm.com.br'
  const enUrl = `${baseUrl}/en`

  if (isPtBR) {
    return {
      title: 'Sirius CRM | ROI Labs',
      description:
        'Transforme leads em receita recorrente com o CRM mais intuitivo do mercado. Pipeline visual, contatos inteligentes e métricas que brilham.',
      keywords: ['CRM', 'Vendas', 'Pipeline', 'Gestão de Clientes', 'SaaS', 'Sirius', 'ROI Labs'],
      metadataBase: new URL(baseUrl),
      alternates: {
        canonical: baseUrl,
        languages: {
          'pt-BR': baseUrl,
          en: enUrl,
          'x-default': baseUrl,
        },
      },
      openGraph: {
        title: 'Sirius CRM | Brilhe nas Vendas',
        description:
          'O CRM inteligente para times de alta performance. Organização, Cadência e Fechamento.',
        url: baseUrl,
        siteName: 'Sirius CRM',
        locale: 'pt_BR',
        type: 'website',
        images: [
          {
            url: '/logo.png',
            width: 1200,
            height: 630,
            alt: 'Sirius CRM - O CRM inteligente para times de alta performance',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Sirius CRM',
        description: 'Transforme leads em receita recorrente.',
        creator: '@roilabs',
        images: ['/logo.png'],
      },
    }
  }

  // ── English metadata ─────────────────────────────────────────────────────────
  return {
    title: 'Sirius CRM | ROI Labs',
    description:
      'Turn leads into recurring revenue with the most intuitive CRM on the market. Visual pipeline, smart contacts and metrics that shine.',
    keywords: ['CRM', 'Sales', 'Pipeline', 'Customer Management', 'SaaS', 'Sirius', 'ROI Labs'],
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: enUrl,
      languages: {
        'pt-BR': baseUrl,
        en: enUrl,
        'x-default': baseUrl,
      },
    },
    openGraph: {
      title: 'Sirius CRM | Shine in Sales',
      description:
        'The intelligent CRM for high-performance teams. Organization, Cadence and Closing.',
      url: enUrl,
      siteName: 'Sirius CRM',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: '/logo.png',
          width: 1200,
          height: 630,
          alt: 'Sirius CRM - The intelligent CRM for high-performance teams',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Sirius CRM',
      description: 'Turn leads into recurring revenue.',
      images: ['/logo.png'],
    },
  }
}

// ─── Static params ──────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// ─── Schema.org dinâmico por locale ────────────────────────────────────────────

function buildSchemaOrg(locale: Locale) {
  const isPtBR = locale === 'pt-BR'
  const baseUrl = 'https://siriuscrm.com.br'

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: isPtBR ? baseUrl : `${baseUrl}/en`,
        name: 'Sirius CRM',
        alternateName: 'Sirius',
        description: isPtBR
          ? 'CRM intuitivo para gestão de vendas com pipeline visual, contatos inteligentes e métricas em tempo real.'
          : 'Intuitive CRM for sales management with visual pipeline, smart contacts and real-time metrics.',
        publisher: { '@id': `${baseUrl}/#organization` },
        inLanguage: isPtBR ? 'pt-BR' : 'en',
      },
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'ROI Labs',
        url: 'https://roilabs.com.br',
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`,
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          telephone: '+55-62-98344-3919',
          email: 'roilabs.ia@gmail.com',
          contactOption: 'TollFree',
          areaServed: isPtBR ? 'BR' : ['BR', 'US', 'GB', 'AU', 'CA'],
          availableLanguage: ['Portuguese', 'English'],
        },
        sameAs: ORG_SAME_AS,
        founder: FOUNDER,
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${baseUrl}/#software`,
        name: 'Sirius CRM',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: isPtBR ? 'BRL' : 'USD',
          availability: 'https://schema.org/InStock',
        },
        provider: { '@id': `${baseUrl}/#organization` },
        description: isPtBR
          ? 'CRM intuitivo para gestão de vendas brasileiras. Pipeline Kanban visual, gestão de contatos, WhatsApp integrado e métricas em tempo real.'
          : 'Intuitive CRM for sales management. Visual Kanban pipeline, contact management, integrated WhatsApp and real-time metrics.',
        featureList: isPtBR
          ? [
              'Pipeline Kanban Visual',
              'Gestão de Contatos',
              'WhatsApp com 1 Clique',
              'Métricas e Analytics em Tempo Real',
              'Gestão Multi-usuário',
              'Temas Claro e Escuro',
            ]
          : [
              'Visual Kanban Pipeline',
              'Contact Management',
              '1-Click WhatsApp',
              'Real-Time Analytics & Metrics',
              'Multi-user Management',
              'Light & Dark Themes',
            ],
        screenshot: `${baseUrl}/og-image.png`,
        url: isPtBR ? baseUrl : `${baseUrl}/en`,
        softwareVersion: '1.0',
      },
    ],
  }
}

// ─── Viewport — viewport-fit=cover for notch/safe area support ──────────────────
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
}

// ─── Root locale layout ─────────────────────────────────────────────────────────

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Valida o locale — se inválido, retorna 404
  if (!routing.locales.includes(locale as Locale)) {
    notFound()
  }

  // Carrega as mensagens para o locale atual (passadas ao client via NextIntlClientProvider)
  const messages = await getMessages()

  const schemaOrg = buildSchemaOrg(locale as Locale)

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://js.sentry-cdn.com" />
        <link rel="preconnect" href="https://us.i.posthog.com" />
        <link rel="preconnect" href="https://us-assets.i.posthog.com" crossOrigin="anonymous" />
        {/* Schema.org JSON-LD — locale-aware */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Google Tag Manager (noscript) */}
        {analyticsConfig.gtm.enabled && (
          <GoogleTagManagerNoScript gtmId={analyticsConfig.gtm.id} />
        )}
        {/* Google Tag Manager */}
        {analyticsConfig.gtm.enabled && <GoogleTagManager gtmId={analyticsConfig.gtm.id} />}

        {/* Provedor de i18n — passa mensagens ao client */}
        <NextIntlClientProvider messages={messages}>
          <PostHogProvider>
            <Suspense fallback={null}>
              <AiTrafficMonitor />
            </Suspense>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <PWARegister />
              <PWAInstallPrompt />
              <PushNotificationManager />
              <OfflineStatus />
              <Toaster />
            </ThemeProvider>
          </PostHogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
