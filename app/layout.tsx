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
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
};

import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
