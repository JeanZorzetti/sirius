import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Criar Conta | Sirius CRM',
  robots: { index: false, follow: false },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
