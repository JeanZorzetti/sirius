'use client'

import { Capacitor } from '@capacitor/core'

interface ShareOptions {
  title?: string
  text?: string
  url?: string
  dialogTitle?: string
}

export async function shareContent(options: ShareOptions): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Share } = await import('@capacitor/share')
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.dialogTitle,
      })
      return true
    } catch {
      return false
    }
  }

  // Web Share API fallback
  if (navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      })
      return true
    } catch {
      return false
    }
  }

  // Clipboard fallback
  if (options.url && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(options.url)
      return true
    } catch {
      return false
    }
  }

  return false
}

export async function shareDeal(deal: { title: string; id: string }): Promise<boolean> {
  return shareContent({
    title: `Deal: ${deal.title}`,
    text: `Confira este deal no Sirius CRM`,
    url: `https://siriuscrm.com.br/dashboard/deals/${deal.id}`,
    dialogTitle: 'Compartilhar deal',
  })
}

export async function shareContact(contact: { name: string; id: string }): Promise<boolean> {
  return shareContent({
    title: contact.name,
    text: `Contato no Sirius CRM: ${contact.name}`,
    url: `https://siriuscrm.com.br/dashboard/contacts/${contact.id}`,
    dialogTitle: 'Compartilhar contato',
  })
}
