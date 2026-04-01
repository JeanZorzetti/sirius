'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MediaLightboxProps {
  src: string
  alt?: string
  type?: 'image' | 'video'
  onClose: () => void
}

export function MediaLightbox({ src, alt = 'Mídia', type = 'image', onClose }: MediaLightboxProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 4))
    if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.5))
    if (e.key === 'r') setRotation(r => r + 90)
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = src
    a.download = alt || 'download'
    a.click()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent z-10"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-white/80 text-sm font-medium truncate max-w-[40%]">
          {alt}
        </span>
        <div className="flex items-center gap-1">
          {type === 'image' && (
            <>
              <button
                onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Diminuir zoom"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <span className="text-white/60 text-xs w-12 text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(z + 0.25, 4))}
                className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Aumentar zoom"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button
                onClick={() => setRotation(r => r + 90)}
                className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Rotacionar"
              >
                <RotateCw className="h-5 w-5" />
              </button>
            </>
          )}
          <button
            onClick={handleDownload}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Download"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors ml-2"
            title="Fechar (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Media content */}
      <div
        className="flex items-center justify-center w-full h-full p-12"
        onClick={e => e.stopPropagation()}
      >
        {type === 'video' ? (
          <video
            src={src}
            controls
            autoPlay
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <img
            src={src}
            alt={alt}
            className="max-h-full object-contain select-none transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
            draggable={false}
            onDoubleClick={() => setZoom(z => z === 1 ? 2 : 1)}
          />
        )}
      </div>

      {/* Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs pointer-events-none">
        Esc para fechar {type === 'image' && '· duplo-clique para zoom · +/- para zoom · R para rotacionar'}
      </div>
    </div>
  )
}
