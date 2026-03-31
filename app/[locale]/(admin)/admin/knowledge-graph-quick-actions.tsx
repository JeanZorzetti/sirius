'use client'

/**
 * Knowledge Graph Quick Actions - Admin Dashboard Widget
 *
 * Quick access buttons for common KG operations
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Play, ExternalLink, Loader2, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface KnowledgeGraphQuickActionsProps {
  pendingPosts: number
  totalEntities: number
}

export function KnowledgeGraphQuickActions({
  pendingPosts,
  totalEntities,
}: KnowledgeGraphQuickActionsProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const handleProcessPending = async () => {
    if (pendingPosts <= 0) {
      setResult({
        type: 'success',
        message: 'All blog posts already processed!',
      })
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
        body: JSON.stringify({ force: false }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          type: 'success',
          message: `Successfully processed ${data.successful}/${data.total} posts. Extracted ${data.results.reduce((acc: number, r: any) => acc + (r.entitiesCount || 0), 0)} entities.`,
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

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
      <h3 className="text-lg font-medium text-white">Quick Actions</h3>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleProcessPending}
          disabled={isProcessing}
          className="gap-2"
          variant={pendingPosts > 0 ? 'default' : 'secondary'}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Process {pendingPosts > 0 ? `${pendingPosts} Pending Posts` : 'Blog Posts'}
            </>
          )}
        </Button>

        <Link href="/admin/knowledge-graph">
          <Button variant="outline" className="gap-2">
            View Full Dashboard
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>

        <Link href="/api/nlp/stats" target="_blank">
          <Button variant="ghost" size="sm" className="gap-2 text-zinc-400">
            API Stats
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {result && (
        <Alert
          variant={result.type === 'success' ? 'default' : 'destructive'}
          className={
            result.type === 'success'
              ? 'bg-green-950 border-green-800 text-green-100'
              : 'bg-red-950 border-red-800'
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

      {totalEntities > 0 && (
        <div className="text-xs text-zinc-500">
          💡 Tip: The knowledge graph powers semantic recommendations on blog posts.{' '}
          <Link href="/blog" className="text-blue-400 hover:underline">
            View blog
          </Link>
        </div>
      )}
    </div>
  )
}
