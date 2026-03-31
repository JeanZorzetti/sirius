import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Redefinir Senha | Sirius CRM',
  robots: { index: false, follow: false },
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
