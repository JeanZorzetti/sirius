'use client'

import { useState } from 'react'
import { Trash2, Clock, CheckCircle2, XCircle, LayoutGrid, Image as ImageIcon, Film, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

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
  feed:     { label: 'Feed',      icon: <ImageIcon className="h-3 w-3" /> },
  carousel: { label: 'Carrossel', icon: <LayoutGrid className="h-3 w-3" /> },
  stories:  { label: 'Stories',   icon: <Film className="h-3 w-3" /> },
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; class: string }> = {
  pending: { label: 'Agendado',  icon: <Clock className="h-3 w-3" />,         class: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  posted:  { label: 'Publicado', icon: <CheckCircle2 className="h-3 w-3" />,  class: 'bg-green-500/10 text-green-500 border-green-500/20' },
  failed:  { label: 'Erro',      icon: <XCircle className="h-3 w-3" />,       class: 'bg-red-500/10 text-red-500 border-red-500/20' },
}

export function PostCard({ post, onDelete }: { post: InstagramPost; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)

  const status = STATUS_CONFIG[post.status] || STATUS_CONFIG.pending
  const typeInfo = TYPE_LABELS[post.type] || TYPE_LABELS.feed
  const scheduledDate = new Date(post.scheduledFor)

  function prevSlide(e: React.MouseEvent) {
    e.stopPropagation()
    setSlideIndex(i => Math.max(0, i - 1))
  }

  function nextSlide(e: React.MouseEvent) {
    e.stopPropagation()
    setSlideIndex(i => Math.min(post.imageUrls.length - 1, i + 1))
  }

  return (
    <>
      {/* Card */}
      <div
        className="flex gap-4 rounded-xl border border-border bg-card p-4 hover:border-purple-500/40 transition-all cursor-pointer"
        onClick={() => { setSlideIndex(0); setExpanded(true) }}
      >
        {/* Thumbnail */}
        <div className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
          {post.imageUrls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.imageUrls[0]} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImageIcon className="h-6 w-6 opacity-30" />
            </div>
          )}
          {post.imageUrls.length > 1 && (
            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
              1/{post.imageUrls.length}
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
          {post.error && <p className="text-xs text-red-400 mt-1">Erro: {post.error}</p>}
        </div>

        {/* Delete */}
        {post.status === 'pending' && (
          <div className="shrink-0 flex items-start" onClick={e => e.stopPropagation()}>
            {confirming ? (
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => onDelete(post.id)}>Confirmar</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancelar</Button>
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

      {/* Expanded modal */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-black border-border">
          <div className="flex flex-col md:flex-row h-full">
            {/* Image area */}
            <div className="relative bg-black flex items-center justify-center md:w-[60%] min-h-[300px] md:min-h-[500px]">
              <VisuallyHidden><DialogTitle>Preview do post</DialogTitle></VisuallyHidden>
              {post.imageUrls[slideIndex] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.imageUrls[slideIndex]}
                  alt={`Slide ${slideIndex + 1}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImageIcon className="h-16 w-16 opacity-20" />
              )}

              {/* Carousel nav */}
              {post.imageUrls.length > 1 && (
                <>
                  <button onClick={prevSlide} disabled={slideIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 disabled:opacity-20 transition-all">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={nextSlide} disabled={slideIndex === post.imageUrls.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 disabled:opacity-20 transition-all">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {post.imageUrls.map((_, i) => (
                      <button key={i} onClick={e => { e.stopPropagation(); setSlideIndex(i) }}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === slideIndex ? 'bg-white' : 'bg-white/40'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Info panel */}
            <div className="flex flex-col gap-4 p-5 md:w-[40%] bg-card overflow-y-auto max-h-[500px]">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="gap-1 text-xs">
                  {typeInfo.icon} {typeInfo.label}
                </Badge>
                <Badge variant="outline" className={`gap-1 text-xs ${status.class}`}>
                  {status.icon} {status.label}
                </Badge>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Legenda</p>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{post.caption}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Hashtags</p>
                <p className="text-xs text-purple-400">{post.hashtags}</p>
              </div>

              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="text-xs text-muted-foreground mb-1">Agendado para</p>
                <p className="font-medium text-foreground">
                  {scheduledDate.toLocaleString('pt-BR', {
                    weekday: 'long', day: '2-digit', month: 'long',
                    hour: '2-digit', minute: '2-digit',
                    timeZone: 'America/Sao_Paulo',
                  })}
                </p>
              </div>

              {post.error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-xs text-red-400">{post.error}</p>
                </div>
              )}

              {post.status === 'pending' && (
                <Button variant="destructive" size="sm" className="mt-auto"
                  onClick={() => { onDelete(post.id); setExpanded(false) }}>
                  <Trash2 className="h-4 w-4 mr-2" /> Cancelar post
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
