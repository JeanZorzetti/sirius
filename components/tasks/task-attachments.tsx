'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Paperclip, Upload, Trash2, Download, FileText, Image, File, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn, formatDateBR } from '@/lib/utils'

interface Attachment {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
  url: string
  uploadedBy: { id: string; name: string | null; email: string }
}

interface TaskAttachmentsProps {
  taskId: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />
  if (mimeType === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />
  return <File className="h-4 w-4 text-muted-foreground" />
}

export function TaskAttachments({ taskId }: TaskAttachmentsProps) {
  const tCommon = useTranslations('common')
  const t = useTranslations('components.tasks')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/tasks/${taskId}/attachments`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setAttachments(data))
      .catch(() => toast.error(tCommon('toasts.failedLoad')))
      .finally(() => setLoading(false))
  }, [taskId])

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return
    setUploading(true)
    let uploaded = 0
    for (const file of list) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch(`/api/tasks/${taskId}/attachments`, { method: 'POST', body: fd })
        if (!res.ok) {
          const err = await res.json()
          toast.error(err.error || `Erro ao enviar ${file.name}`)
          continue
        }
        const att = await res.json()
        setAttachments((prev) => [att, ...prev])
        uploaded++
      } catch {
        toast.error(`Erro ao enviar ${file.name}`)
      }
    }
    if (uploaded > 0) toast.success(tCommon('toasts.uploaded'))
    setUploading(false)
  }

  const handleDelete = async (id: string, fileName: string) => {
    if (!confirm(`Excluir "${fileName}"?`)) return
    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setAttachments((prev) => prev.filter((a) => a.id !== id))
      toast.success(tCommon('toasts.deleted'))
    } catch {
      toast.error(tCommon('toasts.failedDelete'))
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 transition-all',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border/50 hover:border-border hover:bg-muted/30'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {uploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">{tCommon('buttons.submitting')}</span>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-muted-foreground" />
            <div className="text-center">
              <p className="text-xs font-medium text-foreground">Clique ou arraste arquivos aqui</p>
              <p className="text-[10px] text-muted-foreground">Imagens, PDFs, documentos — máx 50MB</p>
            </div>
          </>
        )}
      </div>

      {/* List */}
      {attachments.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">Nenhum anexo ainda</p>
      ) : (
        <ul className="space-y-1.5">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="group flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 px-3 py-2 text-sm transition hover:border-border hover:bg-card/60"
            >
              <FileIcon mimeType={a.mimeType} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{a.fileName}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatBytes(a.fileSize)} · {a.uploadedBy.name || a.uploadedBy.email} ·{' '}
                  {formatDateBR(a.uploadedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <a
                  href={a.url}
                  download={a.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1 hover:bg-muted"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
                <button
                  onClick={() => handleDelete(a.id, a.fileName)}
                  className="rounded p-1 hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
