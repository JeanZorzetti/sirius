import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: 'Sirius CRM | ROI Labs',
  description: 'Transforme leads em receita recorrente com o CRM mais intuitivo do mercado. Pipeline visual, contatos inteligentes e métricas que brilham.',
  keywords: ['CRM', 'Vendas', 'Pipeline', 'Gestão de Clientes', 'SaaS', 'Sirius', 'ROI Labs'],
  authors: [{ name: 'ROI Labs', url: 'https://roilabs.com.br' }],
  creator: 'Jean Zorzetti',
  publisher: 'ROI Labs',
  metadataBase: new URL('https://sirius.roilabs.com.br'),
  alternates: {
    languages: {
      'pt-BR': 'https://sirius.roilabs.com.br',
      'x-default': 'https://sirius.roilabs.com.br',
    },
  },
  applicationName: 'Sirius CRM',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sirius CRM',
  },
  formatDetection: {
    telephone: false,
  },
  verification: {
    // google: 'YOUR_GOOGLE_VERIFICATION_CODE', // Já tem via Google Analytics
    other: {
      'facebook-domain-verification': 'hmbqke6ds1lm1uyvzj714g7tm7ih9e',
      // 'msvalidate.01': 'YOUR_BING_VERIFICATION_CODE', // Adicione quando criar conta Bing Webmaster
    },
  },
  openGraph: {
    title: 'Sirius CRM | Brilhe nas Vendas',
    description: 'O CRM inteligente para times de alta performance. Organizaçāo, Cadência e Fechamento.',
    url: 'https://sirius.roilabs.com.br',
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
  icons: {
    icon: [
      { url: '/icons/favicon-196.png', sizes: '196x196', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icons/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/icons/icon-192x192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: '/icons/icon-512x512.png',
      },
    ],
  },
  manifest: '/manifest.json',
};

import { Suspense } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { PWARegister } from "@/components/pwa-register"
import { PushNotificationManager } from "@/components/push-notification-manager"
import { OfflineStatus } from "@/components/offline-status"
import { GoogleTagManager, GoogleTagManagerNoScript } from "@/components/google-tag-manager"
// MicrosoftClarity movido para GTM
import { analyticsConfig } from "@/lib/analytics-config"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { PostHogProvider } from "./providers"
import { AiTrafficMonitor } from "@/components/analytics/ai-traffic-monitor"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schemaOrg = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://sirius.roilabs.com.br/#website",
        "url": "https://sirius.roilabs.com.br",
        "name": "Sirius CRM",
        "description": "CRM intuitivo para gestão de vendas com pipeline visual, contatos inteligentes e métricas em tempo real.",
        "publisher": {
          "@id": "https://sirius.roilabs.com.br/#organization"
        },
        "inLanguage": "pt-BR"
      },
      {
        "@type": "Organization",
        "@id": "https://sirius.roilabs.com.br/#organization",
        "name": "ROI Labs",
        "url": "https://roilabs.com.br",
        "logo": {
          "@type": "ImageObject",
          "url": "https://sirius.roilabs.com.br/logo.png"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "telephone": "+55-62-98344-3919",
          "email": "roilabs.ia@gmail.com",
          "contactOption": "TollFree",
          "areaServed": "BR",
          "availableLanguage": "Portuguese"
        },
        "sameAs": [
          "https://twitter.com/roilabs"
        ]
      },
      {
        "@type": "SoftwareApplication",
        "name": "Sirius CRM",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "BRL",
          "availability": "https://schema.org/InStock"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "ratingCount": "12",
          "bestRating": "5",
          "worstRating": "1"
        },
        "provider": {
          "@id": "https://sirius.roilabs.com.br/#organization"
        },
        "description": "CRM intuitivo para gestão de vendas brasileiras. Pipeline Kanban visual, gestão de contatos, WhatsApp integrado e métricas em tempo real.",
        "featureList": [
          "Pipeline Kanban Visual",
          "Gestão de Contatos",
          "WhatsApp com 1 Clique",
          "Métricas e Analytics em Tempo Real",
          "Gestão Multi-usuário",
          "Temas Claro e Escuro"
        ],
        "screenshot": "https://sirius.roilabs.com.br/og-image.png",
        "url": "https://sirius.roilabs.com.br",
        "softwareVersion": "1.0"
      }
    ]
  };

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://js.sentry-cdn.com" />
        <link rel="preconnect" href="https://us.i.posthog.com" />
        <link rel="preconnect" href="https://us-assets.i.posthog.com" crossOrigin="anonymous" />
        {/* Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Tag Manager (noscript) - Must be right after opening body tag */}
        {analyticsConfig.gtm.enabled && (
          <GoogleTagManagerNoScript gtmId={analyticsConfig.gtm.id} />
        )}

        {/* Google Tag Manager */}
        {analyticsConfig.gtm.enabled && (
          <GoogleTagManager gtmId={analyticsConfig.gtm.id} />
        )}

        {/* 
          Google Analytics e Microsoft Clarity foram movidos para o Google Tag Manager.
          A configuração centralizada via GTM simplifica a gestão de tags e melhora o desempenho.
        */}

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
            {/* PWA Service Worker Registration */}
            <PWARegister />
            {/* PWA Install Prompt */}
            <PWAInstallPrompt />
            {/* Push Notifications Manager */}
            <PushNotificationManager />
            {/* Offline Status & Sync Queue */}
            <OfflineStatus />
            {/* Toast Notifications */}
            <Toaster />
          </ThemeProvider>
        </PostHogProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
