'use client'
import { useRef, useState, DragEvent } from 'react'
import { Upload, X, Plus } from 'lucide-react'
import { ImageCropper } from './image-cropper'

interface Props {
  postType: string
  urls: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
}

export function ImageUploader({ postType, urls, onChange, maxImages = 1 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  function readFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => {
      if (e.target?.result) setCropSrc(e.target.result as string)
    }
    reader.readAsDataURL(file)
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    readFile(files[0])
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  function handleCropConfirm(url: string) {
    onChange(maxImages === 1 ? [url] : [...urls, url].slice(0, maxImages))
    setCropSrc(null)
  }

  function removeImage(index: number) {
    onChange(urls.filter((_, i) => i !== index))
  }

  if (cropSrc) {
    return (
      <ImageCropper
        src={cropSrc}
        postType={postType}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropSrc(null)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Existing images */}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
          {urls.length < maxImages && (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-20 h-20 rounded-lg border border-dashed border-border hover:border-purple-500 flex items-center justify-center text-muted-foreground hover:text-purple-400 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* Drop zone (shown when no images or adding more) */}
      {urls.length === 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all
            ${dragOver ? 'border-purple-500 bg-purple-500/5' : 'border-border hover:border-purple-500/60 hover:bg-muted/30'}
          `}
        >
          <Upload className="h-8 w-8 text-muted-foreground/50" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Arraste uma imagem ou clique para selecionar</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">JPG, PNG ou WebP · max 10MB</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  )
}
