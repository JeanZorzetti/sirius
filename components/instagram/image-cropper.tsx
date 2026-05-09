'use client'
import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { useTranslations } from 'next-intl'

const ASPECT_RATIOS: Record<string, number> = {
  feed: 1 / 1,
  carousel: 1 / 1,
  stories: 9 / 16,
  portrait: 4 / 5,
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('canvas empty')), 'image/jpeg', 0.92)
  })
}

export function ImageCropper({
  src,
  postType,
  onConfirm,
  onCancel,
}: {
  src: string
  postType: string
  onConfirm: (url: string) => void
  onCancel: () => void
}) {
  const tCommon = useTranslations('common')
  const aspect = ASPECT_RATIOS[postType] ?? 1
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedArea(croppedPixels)
  }, [])

  async function handleConfirm() {
    if (!croppedArea) return
    setUploading(true)
    setError('')
    try {
      const blob = await getCroppedBlob(src, croppedArea)
      const compressed = await imageCompression(new File([blob], 'crop.jpg', { type: 'image/jpeg' }), {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: false,
      })

      const form = new FormData()
      form.append('file', compressed, 'image.jpg')
      const res = await fetch('/api/instagram/upload-image', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload falhou')
      const { url } = await res.json()
      onConfirm(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar imagem')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full h-72 rounded-lg overflow-hidden bg-black">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-10">Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          className="flex-1 accent-purple-500"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onCancel} disabled={uploading}>
          {tCommon('buttons.cancel')}
        </Button>
        <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" onClick={handleConfirm} disabled={uploading}>
          {uploading ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> {tCommon('buttons.submitting')}</> : tCommon('buttons.confirm')}
        </Button>
      </div>
    </div>
  )
}
