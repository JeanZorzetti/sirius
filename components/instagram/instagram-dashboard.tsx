'use client'
import { useState, useCallback } from 'react'
import { Instagram, RefreshCw, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ViewToggle, CalendarView } from './view-toggle'
import { PostCalendarView } from './post-calendar-view'
import { PostListView, ListPost } from './post-list-view'
import { NewPostModal } from './new-post-modal'
import { EditPostModal } from './edit-post-modal'
import { PostFilters } from './post-filters'
import { CalendarPost } from './post-calendar-item'

interface InstagramPost {
  id: string
  type: string
  caption: string
  hashtags: string
  altText?: string
  imageUrls: string[]
  slides?: string[]
  scheduledFor: string
  status: string
  postedAt: string | null
  error: string | null
  createdAt?: string
  _count?: { comments: number }
}

interface Props {
  initialPosts: InstagramPost[]
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunhos',
  awaiting_approval: 'Aguardando',
  scheduled: 'Agendados',
  posted: 'Publicados',
  failed: 'Com erro',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'border-gray-500/30 text-gray-400',
  awaiting_approval: 'border-blue-500/30 text-blue-400',
  scheduled: 'border-yellow-500/30 text-yellow-400',
  posted: 'border-green-500/30 text-green-400',
  failed: 'border-red-500/30 text-red-400',
}

const STATUS_ACTIVE: Record<string, string> = {
  draft: 'border-gray-400 bg-gray-500/10',
  awaiting_approval: 'border-blue-400 bg-blue-500/10',
  scheduled: 'border-yellow-400 bg-yellow-500/10',
  posted: 'border-green-400 bg-green-500/10',
  failed: 'border-red-400 bg-red-500/10',
}

const TYPE_LABELS: Record<string, string> = {
  all: 'Todos',
  feed: 'Feed',
  carousel: 'Carrossel',
  stories: 'Stories',
}

export function InstagramDashboard({ initialPosts }: Props) {
  const [posts, setPosts] = useState<InstagramPost[]>(initialPosts)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<CalendarView>('calendar')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>(undefined)
  const [editPostId, setEditPostId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = posts.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false
    if (typeFilter !== 'all' && p.type !== typeFilter) return false
    if (search && !p.caption.toLowerCase().includes(search.toLowerCase())) return false
    if (dateFrom) {
      const from = new Date(dateFrom)
      if (new Date(p.scheduledFor) < from) return false
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      if (new Date(p.scheduledFor) > to) return false
    }
    return true
  })

  const counts: Record<string, number> = {
    draft: posts.filter(p => p.status === 'draft').length,
    awaiting_approval: posts.filter(p => p.status === 'awaiting_approval').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    posted: posts.filter(p => p.status === 'posted').length,
    failed: posts.filter(p => p.status === 'failed').length,
  }

  async function refresh() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (typeFilter !== 'all') params.set('type', typeFilter)
    const res = await fetch(`/api/instagram/posts?${params}`)
    const data = await res.json()
    setPosts(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function deletePost(id: string) {
    await fetch(`/api/instagram/posts/${id}`, { method: 'DELETE' })
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  function handleEdit(id: string) {
    setEditPostId(id)
  }

  function handlePostUpdated(updated: InstagramPost) {
    setPosts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
  }

  function handlePostDeleted(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  function onPostCreated(post: InstagramPost) {
    setPosts(prev => [post, ...prev])
  }

  const handleDayClick = useCallback((date: Date) => {
    setPreselectedDate(date)
    setModalOpen(true)
  }, [])

  const handlePostClick = useCallback((id: string) => {
    handleEdit(id)
  }, [])

  const calendarPosts: CalendarPost[] = filtered.map(p => ({
    id: p.id,
    type: p.type,
    status: p.status,
    scheduledFor: p.scheduledFor,
    caption: p.caption,
    imageUrls: p.imageUrls,
  }))

  const listPosts: ListPost[] = filtered.map(p => ({
    id: p.id,
    type: p.type,
    caption: p.caption,
    hashtags: p.hashtags,
    imageUrls: p.imageUrls,
    scheduledFor: p.scheduledFor,
    status: p.status,
    postedAt: p.postedAt,
    error: p.error,
    _count: p._count,
  }))

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <Instagram className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Instagram Bot</h1>
            <p className="text-sm text-muted-foreground">Agendador de posts para Instagram</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <ViewToggle view={view} onChange={setView} />
          <Button size="sm" onClick={() => { setPreselectedDate(undefined); setModalOpen(true) }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Novo Post
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {(Object.keys(STATUS_LABELS) as string[]).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(prev => prev === status ? null : status)}
            className={`rounded-xl border p-3 text-left transition-all ${
              statusFilter === status
                ? STATUS_ACTIVE[status]
                : `border-border hover:${STATUS_ACTIVE[status]}`
            }`}
          >
            <div className={`text-xl font-bold ${STATUS_COLORS[status]}`}>{counts[status]}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{STATUS_LABELS[status]}</div>
          </button>
        ))}
      </div>

      {/* Type filters + search */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTypeFilter(value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                typeFilter === value
                  ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                  : 'border-border text-muted-foreground hover:border-purple-500/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <PostFilters
          search={search}
          onSearchChange={setSearch}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          hasActiveFilters={!!(search || dateFrom || dateTo || statusFilter || typeFilter !== 'all')}
          onClear={() => { setSearch(''); setDateFrom(''); setDateTo(''); setStatusFilter(null); setTypeFilter('all') }}
        />
      </div>

      {/* Content */}
      {view === 'calendar' ? (
        <PostCalendarView
          posts={calendarPosts}
          onPostClick={handlePostClick}
          onDayClick={handleDayClick}
        />
      ) : (
        <PostListView
          posts={listPosts}
          onDelete={deletePost}
          onEdit={handleEdit}
        />
      )}

      <NewPostModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setPreselectedDate(undefined) }}
        onCreated={onPostCreated}
        preselectedDate={preselectedDate}
      />

      <EditPostModal
        postId={editPostId}
        onClose={() => setEditPostId(null)}
        onUpdated={handlePostUpdated}
        onDeleted={handlePostDeleted}
      />
    </div>
  )
}
