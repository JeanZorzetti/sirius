import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planos Sirius CRM 2026 [Grátis a R$397/mês] — IA + WhatsApp Inclusos | Sem Cartão',
  description: '4 planos para qualquer tamanho de time: Grátis (R$0), Starter (R$67/mês), Pro com IA (R$147/mês), Business (R$397/mês). Agentes IA autônomos, WhatsApp e pipeline Kanban. Cancele quando quiser.',
  keywords: ['crm preços 2026', 'crm 2026', 'sirius crm planos', 'crm gratuito brasil', 'crm online 2026', 'crm com ia preço', 'whatsapp crm planos', 'pipeline kanban grátis', 'automação de vendas', 'agentes ia crm'],
  alternates: { canonical: 'https://sirius.roilabs.com.br/pricing' },
  openGraph: {
    title: 'Planos Sirius CRM 2026 [Grátis a R$397/mês] — IA + WhatsApp | Sem Cartão',
    description: '4 planos: Grátis, Starter R$67, Pro com IA R$147, Business R$397/mês. Agentes IA autônomos, WhatsApp e pipeline Kanban. Cancele quando quiser.',
    url: 'https://sirius.roilabs.com.br/pricing',
    images: [{ url: 'https://sirius.roilabs.com.br/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planos Sirius CRM 2026 [Grátis a R$397/mês] — IA + WhatsApp | Sem Cartão',
    description: '4 planos: Grátis, Starter R$67, Pro com IA R$147, Business R$397/mês. Cancele quando quiser.',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
