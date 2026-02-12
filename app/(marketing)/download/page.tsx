import { Metadata } from 'next'
import Script from 'next/script'
import { DownloadInstructions } from '@/components/marketing/download-instructions'

export const metadata: Metadata = {
  title: 'Baixar Sirius CRM | App Mobile',
  description: 'Baixe o Sirius CRM no seu celular. Acesso rápido ao seu pipeline de vendas, contatos e métricas em tempo real.',
  keywords: ['baixar sirius crm', 'app mobile', 'pwa', 'download', 'aplicativo'],
  openGraph: {
    title: 'Baixar Sirius CRM - App Mobile',
    description: 'Instale o Sirius CRM no seu celular para acesso rápido e offline.',
    images: ['/og-image.png'],
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
        "item": "https://sirius.roilabs.com.br"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Download",
        "item": "https://sirius.roilabs.com.br/download"
      }
    ]
  }

  return (
    <>
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-indigo-950 to-zinc-950 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
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
