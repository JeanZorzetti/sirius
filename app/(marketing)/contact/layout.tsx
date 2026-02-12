import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato | Sirius CRM",
  description:
    "Entre em contato com a equipe do Sirius CRM. Estamos prontos para ajudar com duvidas, sugestoes, parcerias ou suporte tecnico.",
  keywords: ['contato', 'suporte', 'falar com vendas', 'atendimento', 'sirius crm'],
  openGraph: {
    title: "Contato | Sirius CRM",
    description:
      "Entre em contato com a equipe do Sirius CRM. Estamos prontos para ajudar.",
    url: "https://sirius.roilabs.com.br/contact",
    images: [{
      url: 'https://sirius.roilabs.com.br/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Sirius CRM - CRM Inteligente para Vendedores Brasileiros',
    }],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
