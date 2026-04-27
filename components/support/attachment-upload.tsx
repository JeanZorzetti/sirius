'use client'

import { useState, useRef } from 'react'
import { Paperclip, X, Loader2, File, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Attachment {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  signedUrl: string
}

interface AttachmentUploadProps {
  ticketId?: string
  onAttachmentsChange: (attachments: Attachment[]) => void
  attachments: Attachment[]
  disabled?: boolean
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentUpload({ ticketId, onAttachmentsChange, attachments, disabled }: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (attachments.length + files.length > 5) {
      toast.error('Máximo de 5 anexos por mensagem')
      return
    }

    setUploading(true)
    const newAttachments: Attachment[] = []

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: arquivo muito grande (máx 10MB)`)
        continue
      }

      const formData = new FormData()
      formData.append('file', file)
      if (ticketId) formData.append('ticketId', ticketId)

      try {
        const res = await fetch('/api/support/attachments/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const err = await res.json()
          toast.error(err.error || 'Erro ao enviar arquivo')
          continue
        }

        const { attachment } = await res.json()
        newAttachments.push(attachment)
      } catch {
        toast.error(`Erro ao enviar ${file.name}`)
      }
    }

    onAttachmentsChange([...attachments, ...newAttachments])
    setUploading(false)
  }

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter((a) => a.id !== id))
  }

  return (
    <div>
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 text-sm max-w-[200px]"
            >
              {att.mimeType.startsWith('image/') ? (
                <ImageIcon className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
              ) : (
                <File className="h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
              )}
              <span className="truncate flex-1 text-xs">{att.fileName}</span>
              <span className="text-xs text-muted-foreground">{formatBytes(att.fileSize)}</span>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="ml-1 text-muted-foreground hover:text-destructive"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,application/pdf,text/plain,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled || uploading}
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-muted-foreground"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading || attachments.length >= 5}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
