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
        {/* Google Analytics */}
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

        {/* Microsoft Clarity */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "uu4q5pnnji");
          `}
        </Script>

        {/* Tawk.to Live Chat */}
        <Script id="tawk-to" strategy="lazyOnload">
          {`
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            (function(){
              var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
              s1.async=true;
              s1.src='https://embed.tawk.to/YOUR_TAWK_PROPERTY_ID/default';
              s1.charset='UTF-8';
              s1.setAttribute('crossorigin','*');
              s0.parentNode.insertBefore(s1,s0);
            })();
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
