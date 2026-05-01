import { Image as ImageIcon, LayoutGrid, Film } from 'lucide-react'

const ICONS: Record<string, React.ReactNode> = {
  feed:     <ImageIcon className="h-3 w-3" />,
  carousel: <LayoutGrid className="h-3 w-3" />,
  stories:  <Film className="h-3 w-3" />,
}

const LABELS: Record<string, string> = {
  feed: 'Feed', carousel: 'Carrossel', stories: 'Stories',
}

export function PostTypeIcon({ type, size = 'h-3 w-3' }: { type: string; size?: string }) {
  const icons: Record<string, React.ReactNode> = {
    feed:     <ImageIcon className={size} />,
    carousel: <LayoutGrid className={size} />,
    stories:  <Film className={size} />,
  }
  return <>{icons[type] || icons.feed}</>
}

export function PostTypeLabel({ type }: { type: string }) {
  return <>{LABELS[type] || 'Feed'}</>
}

export { ICONS as POST_TYPE_ICONS, LABELS as POST_TYPE_LABELS }
