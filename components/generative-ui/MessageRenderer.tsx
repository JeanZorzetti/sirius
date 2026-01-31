/**
 * Message Renderer
 *
 * Renders chat messages with support for:
 * - Text chunks (markdown)
 * - Dynamic UI components
 * - Thinking states
 * - Error handling
 */

'use client'

import { Suspense } from 'react'
import ReactMarkdown from 'react-markdown'
import { DynamicUIComponentWithErrorBoundary } from './DynamicUIComponent'
import { ThinkingIndicator } from './ThinkingIndicator'
import { ComponentSkeleton } from './ComponentSkeleton'
import type { StreamChunk, ComponentInteraction } from '@/lib/generative-ui/types'

interface MessageRendererProps {
  chunks: StreamChunk[]
  onInteraction?: (data: ComponentInteraction) => void
}

export function MessageRenderer({ chunks, onInteraction }: MessageRendererProps) {
  if (!chunks || chunks.length === 0) {
    return null
  }

  return (
    <div className="message-content space-y-3">
      {chunks.map((chunk, index) => (
        <ChunkRenderer
          key={index}
          chunk={chunk}
          onInteraction={onInteraction}
        />
      ))}
    </div>
  )
}

interface ChunkRendererProps {
  chunk: StreamChunk
  onInteraction?: (data: ComponentInteraction) => void
}

function ChunkRenderer({ chunk, onInteraction }: ChunkRendererProps) {
  switch (chunk.type) {
    case 'text':
      return <TextChunk content={chunk.content} />

    case 'ui_component':
      return (
        <UIComponentChunk
          name={chunk.name}
          props={chunk.props}
          skeleton={chunk.skeleton}
          reasoning={chunk.reasoning}
          onInteraction={onInteraction}
        />
      )

    case 'thinking':
      return <ThinkingChunk state={chunk.state} message={chunk.message} />

    case 'error':
      return <ErrorChunk message={chunk.message} recoverable={chunk.recoverable} />

    default:
      return null
  }
}

/**
 * Text chunk with markdown support
 */
function TextChunk({ content }: { content: string }) {
  if (!content || content.trim().length === 0) {
    return null
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          // Customize markdown rendering
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
          code: ({ inline, children }) =>
            inline ? (
              <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>
            ) : (
              <code className="block bg-muted p-2 rounded text-sm overflow-x-auto">
                {children}
              </code>
            ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

/**
 * UI component chunk
 */
function UIComponentChunk({
  name,
  props,
  skeleton,
  reasoning,
  onInteraction,
}: {
  name: string
  props: Record<string, any>
  skeleton?: { height: number; variant: any }
  reasoning?: string
  onInteraction?: (data: ComponentInteraction) => void
}) {
  return (
    <div className="ui-component-wrapper">
      {reasoning && (
        <div className="text-xs text-muted-foreground mb-2 italic">
          {reasoning}
        </div>
      )}
      <Suspense
        fallback={
          skeleton ? (
            <ComponentSkeleton height={skeleton.height} variant={skeleton.variant} />
          ) : (
            <div className="h-64 w-full rounded-lg bg-muted animate-pulse" />
          )
        }
      >
        <DynamicUIComponentWithErrorBoundary
          name={name}
          props={props}
          onInteraction={onInteraction}
        />
      </Suspense>
    </div>
  )
}

/**
 * Thinking state chunk
 */
function ThinkingChunk({ state, message }: { state: any; message?: string }) {
  return <ThinkingIndicator state={state} message={message} />
}

/**
 * Error chunk
 */
function ErrorChunk({ message, recoverable }: { message: string; recoverable: boolean }) {
  return (
    <div
      className={`p-3 rounded-lg border ${
        recoverable
          ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-600'
          : 'bg-destructive/10 border-destructive/50 text-destructive'
      }`}
    >
      <p className="text-sm font-medium">
        {recoverable ? 'Aviso' : 'Erro'}
      </p>
      <p className="text-sm mt-1">{message}</p>
    </div>
  )
}

/**
 * Parse raw message content into chunks
 *
 * This helper parses streaming responses that may contain
 * JSON-encoded chunks separated by newlines.
 */
export function parseMessageChunks(content: string): StreamChunk[] {
  const chunks: StreamChunk[] = []

  // Try to parse as JSON lines (streaming format)
  const lines = content.split('\n').filter((line) => line.trim())

  for (const line of lines) {
    try {
      const chunk = JSON.parse(line) as StreamChunk
      chunks.push(chunk)
    } catch {
      // Not JSON - treat as plain text
      chunks.push({ type: 'text', content: line })
    }
  }

  // If no chunks were parsed, treat entire content as text
  if (chunks.length === 0 && content.trim()) {
    chunks.push({ type: 'text', content })
  }

  return chunks
}
