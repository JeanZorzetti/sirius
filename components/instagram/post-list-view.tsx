'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { Instagram } from 'lucide-react'
import { PostCard } from './post-card'

export interface ListPost {
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

export function PostListView({
  posts,
  onDelete,
  onEdit,
}: {
  posts: ListPost[]
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}) {
  if (posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-border rounded-xl"
      >
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center opacity-30">
          <Instagram className="h-7 w-7" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Nenhum post encontrado</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Clique em <strong>Novo Post</strong> para criar um</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div className="flex flex-col gap-2" layout>
      <AnimatePresence initial={false}>
        {posts.map(post => (
          <PostCard key={post.id} post={post} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
