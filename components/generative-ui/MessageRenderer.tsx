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
    <div className="message-content space-y-4">
      {chunks.map((chunk, index) => (
        <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
          <ChunkRenderer
            chunk={chunk}
            onInteraction={onInteraction}
          />
        </div>
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
    <div className="prose prose-base dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          // Customize markdown rendering
          p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed text-base">{children}</p>,
          ul: ({ children }) => <ul className="list-disc ml-6 mb-4 space-y-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-6 mb-4 space-y-2">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed text-base">{children}</li>,
          code: ({ inline, children }: any) =>
            inline ? (
              <code className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-mono border border-primary/20">
                {children}
              </code>
            ) : (
              <code className="block bg-muted p-4 rounded-lg text-sm overflow-x-auto font-mono border border-border">
                {children}
              </code>
            ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium inline-flex items-center gap-1 transition-colors"
            >
              {children}
              <span className="text-xs">↗</span>
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
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
    <div className="ui-component-wrapper my-4">
      {reasoning && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 p-2 bg-muted/30 rounded-lg border border-border/50">
          <span className="font-medium">💭</span>
          <span className="italic">{reasoning}</span>
        </div>
      )}
      <div className="border-2 border-primary/20 rounded-xl p-1 bg-gradient-to-br from-primary/5 to-transparent">
        <Suspense
          fallback={
            skeleton ? (
              <ComponentSkeleton height={skeleton.height} variant={skeleton.variant} />
            ) : (
              <div className="h-64 w-full rounded-lg bg-muted/50 animate-pulse flex items-center justify-center">
                <div className="text-center">
                  <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Carregando componente...</p>
                </div>
              </div>
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
      className={`p-4 rounded-xl border-2 shadow-sm ${
        recoverable
          ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-700 dark:text-yellow-400'
          : 'bg-destructive/10 border-destructive/40 text-destructive'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{recoverable ? '⚠️' : '❌'}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold mb-1">
            {recoverable ? 'Aviso' : 'Erro'}
          </p>
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
      </div>
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
