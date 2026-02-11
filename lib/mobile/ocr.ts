'use client'

/**
 * OCR de Cartões de Visita
 * - Nativo: usa @capacitor/camera para foto nativa
 * - Web: usa <input type="file" capture> para câmera do browser
 * OCR via Tesseract.js (lazy import — ~800KB)
 */

import { isNativePlatform } from './platform'

export interface ParsedContact {
  name?: string
  email?: string
  phone?: string
  company?: string
  title?: string
  website?: string
}

function parseContactFromText(text: string): ParsedContact {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const result: ParsedContact = {}

  // Email regex
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/i)
  if (emailMatch) result.email = emailMatch[0].toLowerCase()

  // Phone: various BR/international formats
  const phoneMatch = text.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4,5}[-.\s]?\d{4}/g)
  if (phoneMatch) result.phone = phoneMatch[0].replace(/\s/g, '')

  // Website
  const websiteMatch = text.match(/(?:www\.|https?:\/\/)[^\s]+/i)
  if (websiteMatch) result.website = websiteMatch[0].replace(/\s/g, '')

  // Name: typically largest font / first line (heuristic)
  // Look for lines that are likely names: 2-4 words, no digits, not all caps
  for (const line of lines.slice(0, 5)) {
    if (
      /^[A-ZÀ-Ú][a-zà-ú]+([ ][A-ZÀ-Ú][a-zà-ú]+)+$/.test(line) &&
      line.split(' ').length >= 2 &&
      line.split(' ').length <= 5
    ) {
      result.name = line
      break
    }
  }

  // Company: look for lines with Ltd, SA, LTDA, ME, EIRELI or S/A
  for (const line of lines) {
    if (/\b(LTDA|S\.A\.|ME|EIRELI|Ltd|Inc|Corp|SA)\b/i.test(line)) {
      result.company = line
      break
    }
  }

  // Job title: look for common keywords
  for (const line of lines) {
    if (/\b(CEO|CTO|CFO|Diretor|Director|Gerente|Manager|Analista|Coordenador|Founder|Co-founder|Sócio|Partner|Vendedor|Representante)\b/i.test(line)) {
      result.title = line
      break
    }
  }

  return result
}

/**
 * Captura imagem e extrai dados de contato via OCR
 * Retorna os dados parseados para pré-preencher o formulário
 */
export async function scanBusinessCard(): Promise<ParsedContact | null> {
  try {
    let imageBase64: string | null = null

    if (isNativePlatform()) {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      })
      imageBase64 = photo.base64String ?? null
    } else {
      // Web fallback: prompt file input
      imageBase64 = await new Promise<string | null>((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.capture = 'environment'
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (!file) return resolve(null)
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            // Remove data URL prefix
            resolve(result.split(',')[1] ?? null)
          }
          reader.readAsDataURL(file)
        }
        input.click()
      })
    }

    if (!imageBase64) return null

    // Lazy import Tesseract (heavy — ~800KB)
    const Tesseract = await import('tesseract.js')
    const dataUrl = `data:image/jpeg;base64,${imageBase64}`

    const { data: { text } } = await Tesseract.default.recognize(dataUrl, 'por+eng', {
      logger: () => {}, // Suppress logs
    })

    return parseContactFromText(text)
  } catch (err) {
    console.error('OCR scan failed:', err)
    return null
  }
}
