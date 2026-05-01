'use client'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trash2, CheckCircle2, Zap, Edit3, Image as ImageIcon } from 'lucide-react'
import { PostStatusBadge } from './post-status-badge'
import { PostTypeIcon, PostTypeLabel } from './post-type-icon'
import { ImageUploader } from './image-uploader'
import { PostCommentsThread } from './post-comments-thread'
import { RecurrencePicker, RecurrenceValue } from './recurrence-picker'
import { BestTimeHint } from './best-time-hint'
import type { PostType } from '@/lib/instagram/scheduling'

interface Post {
  id: string
  type: string
  caption: string
  hashtags: string
  altText?: string
  imageUrls: string[]
  scheduledFor: string
  status: string
  postedAt: string | null
  error: string | null
  recurrenceRule?: string | null
  recurrenceEndDate?: string | null
  _count?: { comments: number }
}

interface Props {
  postId: string | null
  onClose: () => void
  onUpdated: (post: Post) => void
  onDeleted: (id: string) => void
}

type Tab = 'content' | 'images' | 'schedule' | 'recurrence' | 'comments'

const TAB_LABELS: Record<Tab, string> = {
  content: 'Conteúdo',
  images: 'Imagens',
  schedule: 'Agendamento',
  recurrence: 'Recorrência',
  comments: 'Comentários',
}

export function EditPostModal({ postId, onClose, onUpdated, onDeleted }: Props) {
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [approving, setApproving] = useState(false)
  const [publishingNow, setPublishingNow] = useState(false)
  const [tab, setTab] = useState<Tab>('content')
  const [error, setError] = useState('')

  // Editable fields
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [altText, setAltText] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [scheduledFor, setScheduledFor] = useState('')
  const [recurrence, setRecurrence] = useState<RecurrenceValue>({ rule: 'NONE', endDate: '' })

  const open = !!postId

  useEffect(() => {
    if (!postId) { setPost(null); return }
    setLoading(true)
    setError('')
    setConfirmDelete(false)
    fetch(`/api/instagram/posts/${postId}`)
      .then(r => r.json())
      .then(data => {
        setPost(data)
        setCaption(data.caption ?? '')
        setHashtags(data.hashtags ?? '')
        setAltText(data.altText ?? '')
        setImageUrls(data.imageUrls ?? [])
        const d = new Date(data.scheduledFor)
        const pad = (n: number) => String(n).padStart(2, '0')
        setScheduledFor(
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        )
        setRecurrence({
          rule: (data.recurrenceRule ?? 'NONE') as RecurrenceValue['rule'],
          endDate: data.recurrenceEndDate ? data.recurrenceEndDate.slice(0, 10) : '',
        })
        setTab('content')
      })
      .catch(() => setError('Erro ao carregar post'))
      .finally(() => setLoading(false))
  }, [postId])

  const isEditable = post && !['posted', 'cancelled'].includes(post.status)

  async function handleSave() {
    if (!post) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/instagram/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          hashtags,
          altText,
          imageUrls,
          scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
          recurrenceRule: recurrence.rule === 'NONE' ? null : recurrence.rule,
          recurrenceEndDate: recurrence.endDate ? new Date(recurrence.endDate).toISOString() : null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erro ao salvar')
      }
      const updated = await res.json()
      onUpdated(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!post) return
    setDeleting(true)
    try {
      await fetch(`/api/instagram/posts/${post.id}`, { method: 'DELETE' })
      onDeleted(post.id)
      onClose()
    } catch {
      setError('Erro ao excluir post')
    } finally {
      setDeleting(false)
    }
  }

  async function handleApprove() {
    if (!post) return
    setApproving(true)
    try {
      const res = await fetch(`/api/instagram/posts/${post.id}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error('Sem permissão para aprovar')
      const updated = await res.json()
      setPost(prev => prev ? { ...prev, status: updated.status } : null)
      onUpdated(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aprovar')
    } finally {
      setApproving(false)
    }
  }

  async function handlePublishNow() {
    if (!post) return
    setPublishingNow(true)
    try {
      const res = await fetch(`/api/instagram/posts/${post.id}/publish-now`, { method: 'POST' })
      if (!res.ok) throw new Error('Sem permissão para publicar agora')
      const updated = await res.json()
      onUpdated(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar')
    } finally {
      setPublishingNow(false)
    }
  }

  const scheduledDate = post ? new Date(post.scheduledFor).toLocaleString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }) : ''

  const maxImages = post?.type === 'carousel' ? 10 : 1
  const showComments = post && !['posted'].includes(post.status)
  const commentCount = post?._count?.comments ?? 0

  const tabs: Tab[] = ['content', 'images', 'schedule', 'recurrence', ...(showComments ? ['comments' as Tab] : [])]

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Edit3 className="h-4 w-4 text-purple-400" />
            Editar Post
            {post && (
              <div className="flex items-center gap-1.5 ml-2">
                <Badge variant="outline" className="gap-1 text-xs font-normal">
                  <PostTypeIcon type={post.type} /> <PostTypeLabel type={post.type} />
                </Badge>
                <PostStatusBadge status={post.status} />
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && post && (
          <div className="flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-border px-5 mt-4 overflow-x-auto">
              {tabs.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-2 text-sm border-b-2 transition-colors -mb-px whitespace-nowrap flex items-center gap-1.5
                    ${tab === t ? 'border-purple-500 text-purple-400' : 'border-transparent text-muted-foreground hover:text-foreground'}
                  `}
                >
                  {TAB_LABELS[t]}
                  {t === 'comments' && commentCount > 0 && (
                    <span className="bg-purple-500/20 text-purple-400 text-[10px] rounded-full px-1.5 leading-4">
                      {commentCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-5 flex flex-col gap-4 max-h-[52vh] overflow-y-auto">
              {/* Content tab */}
              {tab === 'content' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs flex justify-between">
                      Legenda
                      <span className="text-muted-foreground font-normal">{caption.length}/2200</span>
                    </Label>
                    <Textarea
                      value={caption}
                      onChange={e => setCaption(e.target.value)}
                      rows={5}
                      maxLength={2200}
                      disabled={!isEditable}
                      className="resize-none text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Hashtags</Label>
                    <Input
                      value={hashtags}
                      onChange={e => setHashtags(e.target.value)}
                      disabled={!isEditable}
                      placeholder="#hashtag1 #hashtag2"
                      className="text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Texto alternativo</Label>
                    <Input
                      value={altText}
                      onChange={e => setAltText(e.target.value)}
                      disabled={!isEditable}
                      placeholder="Descrição da imagem para acessibilidade"
                      className="text-sm"
                    />
                  </div>
                </>
              )}

              {/* Images tab */}
              {tab === 'images' && (
                isEditable ? (
                  <ImageUploader
                    postType={post.type}
                    urls={imageUrls}
                    onChange={setImageUrls}
                    maxImages={maxImages}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {imageUrls.map((url, i) => (
                      <div key={i} className="w-24 h-24 rounded-lg overflow-hidden border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {imageUrls.length === 0 && (
                      <div className="flex items-center justify-center w-24 h-24 rounded-lg border border-dashed border-border">
                        <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Schedule tab */}
              {tab === 'schedule' && (
                <>
                  {isEditable ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Data e hora (Brasília)</Label>
                        <Input
                          type="datetime-local"
                          value={scheduledFor}
                          onChange={e => setScheduledFor(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      {scheduledFor && (
                        <BestTimeHint
                          scheduledFor={new Date(scheduledFor).toISOString()}
                          postType={post.type as PostType}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-muted p-3 text-sm">
                      <p className="text-xs text-muted-foreground mb-1">Agendado para</p>
                      <p className="font-medium">{scheduledDate}</p>
                    </div>
                  )}

                  {post.status === 'posted' && post.postedAt && (
                    <div className="flex items-center gap-1.5 text-xs text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Publicado em {new Date(post.postedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </div>
                  )}

                  {post.error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                      <p className="text-xs text-red-400">{post.error}</p>
                    </div>
                  )}
                </>
              )}

              {/* Recurrence tab */}
              {tab === 'recurrence' && (
                <RecurrencePicker
                  value={recurrence}
                  onChange={setRecurrence}
                  disabled={!isEditable}
                />
              )}

              {/* Comments tab */}
              {tab === 'comments' && (
                <div className="h-[320px]">
                  <PostCommentsThread postId={post.id} />
                </div>
              )}
            </div>

            {/* Error */}
            {error && <p className="px-5 text-sm text-red-400">{error}</p>}

            {/* Actions footer */}
            <div className="flex items-center gap-2 px-5 pb-5 pt-3 border-t border-border flex-wrap">
              {['draft', 'awaiting_approval'].includes(post.status) && (
                <Button size="sm" onClick={handleApprove} disabled={approving}
                  className="bg-blue-600 hover:bg-blue-700 text-white">
                  {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                  Aprovar
                </Button>
              )}

              {['scheduled', 'failed'].includes(post.status) && (
                <Button size="sm" onClick={handlePublishNow} disabled={publishingNow}
                  className="bg-green-600 hover:bg-green-700 text-white">
                  {publishingNow ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Zap className="h-3.5 w-3.5 mr-1.5" />}
                  Publicar agora
                </Button>
              )}

              <div className="flex-1" />

              {isEditable && (
                confirmDelete ? (
                  <>
                    <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
                      {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                      Confirmar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
                  </>
                ) : (
                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-red-400"
                    onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )
              )}

              <Button size="sm" variant="outline" onClick={onClose}>Fechar</Button>

              {isEditable && tab !== 'comments' && (
                <Button size="sm" onClick={handleSave} disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 text-white">
                  {saving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Salvando…</> : 'Salvar'}
                </Button>
              )}
            </div>
          </div>
        )}

        {!loading && !post && !error && (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Post não encontrado
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
