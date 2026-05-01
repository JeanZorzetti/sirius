'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Trash2, Clock, CheckCircle2, XCircle, LayoutGrid, Image as ImageIcon, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface InstagramPost {
  id: string
  type: string
  caption: string
  hashtags: string
  imageUrls: string[]
  scheduledFor: string
  status: string
  postedAt: string | null
  error: string | null
}

const TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  feed:     { label: 'Feed',     icon: <ImageIcon className="h-3 w-3" /> },
  carousel: { label: 'Carrossel', icon: <LayoutGrid className="h-3 w-3" /> },
  stories:  { label: 'Stories',  icon: <Film className="h-3 w-3" /> },
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; class: string }> = {
  pending: { label: 'Agendado', icon: <Clock className="h-3 w-3" />,        class: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  posted:  { label: 'Publicado', icon: <CheckCircle2 className="h-3 w-3" />, class: 'bg-green-500/10 text-green-500 border-green-500/20' },
  failed:  { label: 'Erro',      icon: <XCircle className="h-3 w-3" />,      class: 'bg-red-500/10 text-red-500 border-red-500/20' },
}

export function PostCard({ post, onDelete }: { post: InstagramPost; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false)
  const status = STATUS_CONFIG[post.status] || STATUS_CONFIG.pending
  const typeInfo = TYPE_LABELS[post.type] || TYPE_LABELS.feed
  const scheduledDate = new Date(post.scheduledFor)

  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-4 hover:border-purple-500/30 transition-all">
      {/* Image preview */}
      <div className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
        {post.imageUrls[0] ? (
          <Image
            src={post.imageUrls[0]}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <ImageIcon className="h-6 w-6 opacity-30" />
          </div>
        )}
        {post.imageUrls.length > 1 && (
          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
            +{post.imageUrls.length - 1}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1 text-xs">
            {typeInfo.icon} {typeInfo.label}
          </Badge>
          <Badge variant="outline" className={`gap-1 text-xs ${status.class}`}>
            {status.icon} {status.label}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            {scheduledDate.toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', year: '2-digit',
              hour: '2-digit', minute: '2-digit',
              timeZone: 'America/Sao_Paulo',
            })}
          </span>
        </div>

        <p className="text-sm line-clamp-2 text-foreground/80">{post.caption}</p>
        <p className="text-xs text-purple-400/70 line-clamp-1">{post.hashtags}</p>

        {post.error && (
          <p className="text-xs text-red-400 mt-1">Erro: {post.error}</p>
        )}
      </div>

      {/* Actions */}
      {post.status === 'pending' && (
        <div className="shrink-0 flex items-start">
          {confirming ? (
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={() => onDelete(post.id)}>
                Confirmar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-red-500"
              onClick={() => setConfirming(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
