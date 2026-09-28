import type { Metadata } from 'next'
import { CamposClient } from './campos-client'

export const metadata: Metadata = { title: 'Campos personalizados | Sirius CRM' }

export default function CamposPage() {
  return <CamposClient />
}
