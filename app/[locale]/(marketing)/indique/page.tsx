import type { Metadata } from 'next'
import { IndiqueClient } from './indique-client'

export const metadata: Metadata = {
  title: 'Indique o Sirius CRM: 7 Indicações, Mensalidade Grátis',
  description: 'Indique amigos e ganhe até 100% de desconto recorrente na sua mensalidade. Cada indicação ativa = 15% off. 7 indicações = mensalidade zerada.',
}

export default function IndiquePage() {
  return <IndiqueClient />
}
