'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2, ChevronLeft, ChevronRight, Image as ImageIcon, Edit, Copy, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { PostStatusBadge } from './post-status-badge'
import { PostTypeIcon, PostTypeLabel } from './post-type-icon'
import { useTranslations } from 'next-intl'

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
  _count?: { comments: number }
}

export function PostCard({
  post,
  onDelete,
  onEdit,
}: {
  post: InstagramPost
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}) {
  const tCommon = useTranslations('common')
  const t = useTranslations('components.instagram')
  const [confirming, setConfirming] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [duplicating, setDuplicating] = useState(false)

  const scheduledDate = new Date(post.scheduledFor)
  const isEditable = !['posted'].includes(post.status)

  function prevSlide(e: React.MouseEvent) {
    e.stopPropagation()
    setSlideIndex(i => Math.max(0, i - 1))
  }

  function nextSlide(e: React.MouseEvent) {
    e.stopPropagation()
    setSlideIndex(i => Math.min(post.imageUrls.length - 1, i + 1))
  }

  async function handleDuplicate(e: React.MouseEvent) {
    e.stopPropagation()
    setDuplicating(true)
    try {
      await fetch(`/api/instagram/posts/${post.id}/duplicate`, { method: 'POST' })
      window.location.reload()
    } finally {
      setDuplicating(false)
    }
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
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
              <PostTypeIcon type={post.type} /> <PostTypeLabel type={post.type} />
            </Badge>
            <PostStatusBadge status={post.status} />
            {post._count && post._count.comments > 0 && (
              <span className="text-xs text-muted-foreground/60">{post._count.comments} comentário{post._count.comments > 1 ? 's' : ''}</span>
            )}
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

        {/* Actions */}
        <div className="shrink-0 flex items-start gap-1" onClick={e => e.stopPropagation()}>
          {isEditable && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-purple-400"
              onClick={() => onEdit(post.id)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-blue-400"
            onClick={handleDuplicate} disabled={duplicating}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          {isEditable && (
            confirming ? (
              <div className="flex gap-1">
                <Button size="sm" variant="destructive" className="h-8" onClick={() => onDelete(post.id)}>{tCommon('buttons.confirm')}</Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setConfirming(false)}>{tCommon('buttons.cancel')}</Button>
              </div>
            ) : (
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-red-500"
                onClick={() => setConfirming(true)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )
          )}
        </div>
      </motion.div>

      {/* Expanded modal */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-black border-border">
          <div className="flex flex-col md:flex-row h-full">
            {/* Image area */}
            <div className="relative bg-black flex items-center justify-center md:w-[60%] min-h-[300px] md:min-h-[500px]">
              <VisuallyHidden><DialogTitle>Preview do post</DialogTitle></VisuallyHidden>
              {post.imageUrls[slideIndex] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.imageUrls[slideIndex]} alt={`Slide ${slideIndex + 1}`} className="w-full h-full object-contain" />
              ) : (
                <ImageIcon className="h-16 w-16 opacity-20" />
              )}
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
                  <PostTypeIcon type={post.type} /> <PostTypeLabel type={post.type} />
                </Badge>
                <PostStatusBadge status={post.status} />
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

              {post.status === 'posted' && post.postedAt && (
                <div className="flex items-center gap-1.5 text-xs text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Publicado em {new Date(post.postedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                </div>
              )}

              <div className="flex flex-col gap-2 mt-auto">
                {isEditable && (
                  <Button variant="outline" size="sm" onClick={() => { setExpanded(false); onEdit(post.id) }}>
                    <Edit className="h-3.5 w-3.5 mr-2" /> {t('editPost')}
                  </Button>
                )}
                {isEditable && (
                  <Button variant="destructive" size="sm"
                    onClick={() => { onDelete(post.id); setExpanded(false) }}>
                    <Trash2 className="h-4 w-4 mr-2" /> {t('deletePost')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
