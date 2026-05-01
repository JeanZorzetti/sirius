'use client'
import { Image as ImageIcon, LayoutGrid, Film } from 'lucide-react'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  feed:     <ImageIcon className="h-2.5 w-2.5" />,
  carousel: <LayoutGrid className="h-2.5 w-2.5" />,
  stories:  <Film className="h-2.5 w-2.5" />,
}

const STATUS_COLORS: Record<string, string> = {
  draft:             'bg-gray-500/20 border-gray-500/30 text-gray-300',
  awaiting_approval: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
  scheduled:         'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
  posted:            'bg-green-500/20 border-green-500/30 text-green-300',
  failed:            'bg-red-500/20 border-red-500/30 text-red-300',
  cancelled:         'bg-gray-500/10 border-gray-500/20 text-gray-500',
}

export interface CalendarPost {
  id: string
  type: string
  status: string
  scheduledFor: string
  caption: string
  imageUrls: string[]
}

export function PostCalendarItem({
  post,
  onClick,
  isDragging = false,
}: {
  post: CalendarPost
  onClick: (id: string) => void
  isDragging?: boolean
}) {
  const colors = STATUS_COLORS[post.status] || STATUS_COLORS.draft
  const time = new Date(post.scheduledFor).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  })

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(post.id) }}
      className={`w-full text-left rounded px-1.5 py-0.5 border text-[10px] flex items-center gap-1 truncate transition-all ${colors}
        ${isDragging ? 'shadow-lg scale-[1.03] ring-1 ring-purple-400/50' : 'hover:opacity-80'}
      `}
    >
      {post.imageUrls[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrls[0]} alt="" className="w-4 h-4 rounded object-cover shrink-0" />
      ) : (
        <span className="shrink-0 opacity-60">{TYPE_ICONS[post.type]}</span>
      )}
      <span className="font-medium shrink-0">{time}</span>
      <span className="truncate opacity-70">{post.caption}</span>
    </button>
  )
}
