'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Tag as TagIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface Tag {
  id: string
  name: string
  color: string
}

interface ConversationTagsProps {
  contactId: string
  contactTags: Tag[]
  onTagsUpdate?: () => void
}

const TAG_COLORS = [
  '#00a884', // WhatsApp green
  '#25d366', // Badge green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#3b82f6', // blue
  '#ec4899', // pink
  '#14b8a6', // teal
]

const DEFAULT_TAGS = [
  { name: 'Lead Quente', color: '#ef4444' },
  { name: 'Follow Up', color: '#f59e0b' },
  { name: 'Suporte', color: '#3b82f6' },
  { name: 'VIP', color: '#8b5cf6' },
  { name: 'Spam', color: '#6b7280' },
]

export function ConversationTags({ contactId, contactTags, onTagsUpdate }: ConversationTagsProps) {
  const tCommon = useTranslations('common')
  const t = useTranslations('components.chat')
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0])
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags')
      if (res.ok) {
        const tags = await res.json()
        // Se não houver tags, criar as padrão
        if (tags.length === 0) {
          await createDefaultTags()
        } else {
          setAllTags(tags)
        }
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const createDefaultTags = async () => {
    try {
      const createdTags = await Promise.all(
        DEFAULT_TAGS.map(async (tag) => {
          const res = await fetch('/api/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tag),
          })
          return res.json()
        })
      )
      setAllTags(createdTags)
    } catch (error) {
      console.error('Error creating default tags:', error)
    }
  }

  const addTag = async (tagId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/whatsapp/conversations/${contactId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      })
      if (res.ok) {
        toast.success('Tag adicionada')
        onTagsUpdate?.()
      } else {
        toast.error(tCommon('toasts.failed'))
      }
    } catch (error) {
      toast.error(tCommon('toasts.failed'))
    } finally {
      setLoading(false)
    }
  }

  const removeTag = async (tagId: string) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/whatsapp/conversations/${contactId}/tags?tagId=${tagId}`,
        { method: 'DELETE' }
      )
      if (res.ok) {
        toast.success('Tag removida')
        onTagsUpdate?.()
      } else {
        toast.error(tCommon('toasts.failed'))
      }
    } catch (error) {
      toast.error(tCommon('toasts.failed'))
    } finally {
      setLoading(false)
    }
  }

  const createNewTag = async () => {
    if (!newTagName.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), color: selectedColor }),
      })
      if (res.ok) {
        const newTag = await res.json()
        setAllTags([...allTags, newTag])
        await addTag(newTag.id)
        setNewTagName('')
        setIsCreating(false)
        toast.success('Tag criada e adicionada')
      } else {
        toast.error(tCommon('toasts.failed'))
      }
    } catch (error) {
      toast.error(tCommon('toasts.failed'))
    } finally {
      setLoading(false)
    }
  }

  const contactTagIds = contactTags.map(t => t.id)
  const availableTags = allTags.filter(t => !contactTagIds.includes(t.id))

  return (
    <div className="flex items-center gap-2">
      {/* Mostrar tags atuais */}
      {contactTags.map(tag => (
        <div
          key={tag.id}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${tag.color}20`,
            color: tag.color,
          }}
        >
          {tag.name}
          <button
            onClick={() => removeTag(tag.id)}
            disabled={loading}
            className="hover:opacity-70 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {/* Botão adicionar tag */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <Plus className="h-3 w-3" />
            Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-3" align="end">
          <div className="space-y-3">
            <p className="text-sm font-medium">Gerenciar Tags</p>

            {/* Lista de tags disponíveis */}
            {!isCreating && (
              <div className="space-y-2">
                {availableTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => addTag(tag.id)}
                        disabled={loading}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Todas as tags foram adicionadas
                  </p>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus className="h-3 w-3" />
                  Criar nova tag
                </Button>
              </div>
            )}

            {/* Criar nova tag */}
            {isCreating && (
              <div className="space-y-3">
                <Input
                  placeholder="Nome da tag"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="h-8 text-sm"
                />

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Escolha uma cor</p>
                  <div className="flex gap-2">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          'w-6 h-6 rounded-full transition-transform',
                          selectedColor === color && 'ring-2 ring-offset-2 ring-primary scale-110'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setIsCreating(false)
                      setNewTagName('')
                    }}
                  >
                    {tCommon('buttons.cancel')}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={createNewTag}
                    disabled={!newTagName.trim() || loading}
                  >
                    {tCommon('buttons.create')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
