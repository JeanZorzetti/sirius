'use client'

/**
 * Botão de scan de cartão de visita via OCR
 * Aparece em: formulário de criação de contato
 * Funciona em: iOS, Android (câmera nativa), Web (input file)
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScanLine, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ParsedContact } from '@/lib/mobile/ocr'

interface ScanCardButtonProps {
  onScan: (data: ParsedContact) => void
}

export function ScanCardButton({ onScan }: ScanCardButtonProps) {
  const [isScanning, setIsScanning] = useState(false)

  const handleScan = async () => {
    setIsScanning(true)
    try {
      const { scanBusinessCard } = await import('@/lib/mobile/ocr')
      toast.info('Posicione o cartão na câmera...')
      const result = await scanBusinessCard()

      if (!result) {
        toast.error('Não foi possível ler o cartão')
        return
      }

      const fieldsFound = Object.values(result).filter(Boolean).length
      if (fieldsFound === 0) {
        toast.warning('Nenhum dado reconhecido. Tente novamente com melhor iluminação.')
        return
      }

      onScan(result)
      toast.success(`${fieldsFound} campo(s) preenchido(s) automaticamente!`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao escanear cartão'
      toast.error(message)
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleScan}
      disabled={isScanning}
      className="gap-2"
    >
      {isScanning ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ScanLine className="h-4 w-4" />
      )}
      {isScanning ? 'Escaneando...' : 'Escanear Cartão'}
    </Button>
  )
}
