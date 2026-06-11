/**
 * Página legada de conexão WhatsApp via QR (gateway whatsmeow, descontinuado).
 * Redireciona para a integração suportada: API Oficial Meta (WABA).
 */
import { redirect } from 'next/navigation'

export const metadata = { title: 'WhatsApp | Sirius CRM' }

export default function WhatsAppIntegrationPage() {
    redirect('/dashboard/settings/integrations/whatsapp-official')
}
