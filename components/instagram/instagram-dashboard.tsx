'use client'

import { useState } from 'react'
import { Instagram, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PostCard } from './post-card'
import { NewPostModal } from './new-post-modal'

interface InstagramPost {
  id: string
  type: string
  caption: string
  hashtags: string
  altText: string
  imageUrls: string[]
  slides: string[]
  scheduledFor: string
  status: string
  postedAt: string | null
  error: string | null
  createdAt: string
}

interface Props {
  initialPosts: InstagramPost[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Agendados',
  posted: 'Publicados',
  failed: 'Com erro',
}

export function InstagramDashboard({ initialPosts }: Props) {
  const [posts, setPosts] = useState<InstagramPost[]>(initialPosts)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'posted' | 'failed'>('pending')

  const filtered = posts.filter(p => p.status === activeTab)

  async function refresh() {
    setLoading(true)
    const res = await fetch('/api/instagram/posts')
    const data = await res.json()
    setPosts(data)
    setLoading(false)
  }

  async function deletePost(id: string) {
    await fetch('/api/instagram/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  function onPostCreated(post: InstagramPost) {
    setPosts(prev => [post, ...prev])
    setActiveTab('pending')
  }

  const counts = {
    pending: posts.filter(p => p.status === 'pending').length,
    posted: posts.filter(p => p.status === 'posted').length,
    failed: posts.filter(p => p.status === 'failed').length,
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <Instagram className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Instagram Bot</h1>
            <p className="text-sm text-muted-foreground">Posts gerados por IA para o Sirius CRM</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Novo Post
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(['pending', 'posted', 'failed'] as const).map(status => (
          <button
            key={status}
            onClick={() => setActiveTab(status)}
            className={`rounded-xl border p-4 text-left transition-all ${
              activeTab === status
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-border hover:border-purple-500/50'
            }`}
          >
            <div className="text-2xl font-bold">{counts[status]}</div>
            <div className="text-sm text-muted-foreground">{STATUS_LABELS[status]}</div>
          </button>
        ))}
      </div>

      {/* Posts list */}
      <div className="flex flex-col gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border border-dashed rounded-xl">
            <Instagram className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum post {STATUS_LABELS[activeTab].toLowerCase()}</p>
            {activeTab === 'pending' && (
              <p className="text-sm mt-1">Clique em <strong>Novo Post</strong> para criar um</p>
            )}
          </div>
        ) : (
          filtered.map(post => (
            <PostCard key={post.id} post={post} onDelete={deletePost} />
          ))
        )}
      </div>

      <NewPostModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={onPostCreated}
      />
    </div>
  )
}
