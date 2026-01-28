import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Sirius CRM | ROI Labs',
  description: 'Transforme leads em receita recorrente com o CRM mais intuitivo do mercado. Pipeline visual, contatos inteligentes e métricas que brilham.',
  keywords: ['CRM', 'Vendas', 'Pipeline', 'Gestão de Clientes', 'SaaS', 'Sirius', 'ROI Labs'],
  authors: [{ name: 'ROI Labs', url: 'https://roilabs.com.br' }],
  creator: 'Jean Zorzetti',
  publisher: 'ROI Labs',
  metadataBase: new URL('https://sirius.roilabs.com.br'),
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
    // other: {
    //   'msvalidate.01': 'YOUR_BING_VERIFICATION_CODE', // Adicione quando criar conta Bing Webmaster
    // },
  },
  openGraph: {
    title: 'Sirius CRM | Brilhe nas Vendas',
    description: 'O CRM inteligente para times de alta performance. Organizaçāo, Cadência e Fechamento.',
    url: 'https://sirius.roilabs.com.br',
    siteName: 'Sirius CRM',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sirius CRM',
    description: 'Transforme leads em receita recorrente.',
    creator: '@roilabs',
  },
  icons: {
    icon: [
      { url: '/favicon-196.png', sizes: '196x196', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/icon-192x192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: '/icon-512x512.png',
      },
    ],
  },
  manifest: '/manifest.json',
};

import { ThemeProvider } from "@/components/theme-provider"
import { TawkToChat } from "@/components/tawk-to-chat"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { PushNotificationManager } from "@/components/push-notification-manager"
import { OfflineStatus } from "@/components/offline-status"
import { GoogleTagManager, GoogleTagManagerNoScript } from "@/components/google-tag-manager"
import { MicrosoftClarity } from "@/components/microsoft-clarity"
import { analyticsConfig } from "@/lib/analytics-config"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { PostHogProvider } from "./providers"

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
          "ratingCount": "1",
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

        {/* Google Analytics - Can be managed via GTM or keep standalone */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-WJE82VNKX8"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-WJE82VNKX8');
          `}
        </Script>

        {/* Microsoft Clarity - With error handling */}
        <MicrosoftClarity />

        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            {/* Tawk.to Live Chat - Only on marketing pages */}
            <TawkToChat />
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
