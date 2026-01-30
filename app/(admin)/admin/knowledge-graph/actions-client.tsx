'use client'

/**
 * Knowledge Graph Actions - Client Component
 *
 * Interactive buttons for processing blog posts and managing the knowledge graph
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Play, RefreshCw, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface KnowledgeGraphActionsProps {
  totalPosts: number
  processedPosts: number
}

export function KnowledgeGraphActions({
  totalPosts,
  processedPosts,
}: KnowledgeGraphActionsProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const handleProcessAll = async () => {
    setIsProcessing(true)
    setResult(null)

    try {
      const response = await fetch('/api/nlp/process-blog-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: false }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          type: 'success',
          message: `Successfully processed ${data.successful}/${data.total} posts. Extracted entities and relationships.`,
        })

        // Refresh the page to show updated stats
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        setResult({
          type: 'error',
          message: data.error || 'Failed to process posts',
        })
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReprocessAll = async () => {
    if (
      !confirm(
        'This will reprocess ALL blog posts, even those already processed. This may take several minutes. Continue?'
      )
    ) {
      return
    }

    setIsProcessing(true)
    setResult(null)

    try {
      const response = await fetch('/api/nlp/process-blog-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: true }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          type: 'success',
          message: `Reprocessed ${data.successful}/${data.total} posts successfully.`,
        })

        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        setResult({
          type: 'error',
          message: data.error || 'Failed to reprocess posts',
        })
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const pendingPosts = totalPosts - processedPosts

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          onClick={handleProcessAll}
          disabled={isProcessing || pendingPosts === 0}
          size="lg"
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Process Pending Posts ({pendingPosts})
            </>
          )}
        </Button>

        <Button
          onClick={handleReprocessAll}
          disabled={isProcessing}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reprocess All
        </Button>

        <Button
          onClick={() => router.refresh()}
          variant="ghost"
          size="lg"
          disabled={isProcessing}
        >
          Refresh Stats
        </Button>
      </div>

      {result && (
        <Alert
          variant={result.type === 'success' ? 'default' : 'destructive'}
          className={
            result.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-900'
              : ''
          }
        >
          {result.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
