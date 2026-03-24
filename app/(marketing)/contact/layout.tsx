import { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: { canonical: 'https://sirius.roilabs.com.br/contact' },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
