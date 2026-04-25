import { Metadata } from 'next'
import Script from 'next/script'
import { DownloadInstructions } from '@/components/marketing/download-instructions'

export const metadata: Metadata = {
  title: 'Baixar Sirius CRM | App Mobile',
  description: 'Baixe o Sirius CRM no seu celular. Progressive Web App com suporte offline, sincronização automática e notificações push. Disponível para iOS e Android.',
  keywords: ['baixar sirius crm', 'app mobile', 'pwa', 'download', 'aplicativo'],
  alternates: { canonical: 'https://siriuscrm.com.br/download' },
  openGraph: {
    title: 'Baixar Sirius CRM - App Mobile',
    description: 'Instale o Sirius CRM no seu celular para acesso rápido e offline.',
    url: 'https://siriuscrm.com.br/download',
    images: [{
      url: 'https://siriuscrm.com.br/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Sirius CRM - App Mobile',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Baixar Sirius CRM - App Mobile',
    description: 'PWA com suporte offline, sincronização automática e notificações push.',
  },
}

export default function DownloadPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://siriuscrm.com.br"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Download",
        "item": "https://siriuscrm.com.br/download"
      }
    ]
  }

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    "name": "Sirius CRM",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "iOS, Android, Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "BRL"
    },
    "description": "Progressive Web App para gestão de vendas com pipeline Kanban, WhatsApp integrado e suporte offline."
  }

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="software-app-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-indigo-950 to-zinc-950 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-transparent to-transparent opacity-50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        <DownloadInstructions />
      </div>
    </div>
    </>
  )
}
