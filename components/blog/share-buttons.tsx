'use client'

import { Button } from '@/components/ui/button'
import { Share2, Linkedin, Link2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ShareButtonsProps {
  title: string
  url: string
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)

  // Check if Web Share API is available (runs only on client)
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator.share !== 'undefined') {
      setCanShare(true)
    }
  }, [])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Confira este guia: ${title}`,
          url: url,
        })
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err)
        }
      }
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-4">
      <span className="text-sm text-muted-foreground mr-2">Compartilhar:</span>

      {/* Web Share API button - only shows on mobile/supported browsers */}
      {canShare && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleNativeShare}
        >
          <Share2 className="h-4 w-4" />
          Compartilhar
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        asChild
        className="gap-2"
      >
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Share2 className="h-4 w-4" />
          WhatsApp
        </a>
      </Button>
      <Button
        variant="outline"
        size="sm"
        asChild
        className="gap-2"
      >
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </a>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleCopyLink}
      >
        <Link2 className="h-4 w-4" />
        {copied ? 'Copiado!' : 'Copiar Link'}
      </Button>
    </div>
  )
}
