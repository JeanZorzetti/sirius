'use client'

/**
 * ScriptPreview - Sales Script Preview with Editing
 *
 * Displays generated scripts with:
 * - Markdown rendering
 * - Inline editing
 * - Copy to clipboard
 * - Script metadata
 */

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import type { ScriptPreviewProps } from '@/lib/generative-ui/schemas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  FileText,
  Copy,
  Check,
  Edit,
  Save,
  X,
  Phone,
  Mail,
  MessageSquare,
  Presentation,
  Shield
} from 'lucide-react'

interface ScriptPreviewComponentProps extends ScriptPreviewProps {
  onInteraction?: (action: string, component: string, data: Record<string, unknown>) => void
}

const SCRIPT_TYPE_CONFIG = {
  cold_call: { label: 'Cold Call', icon: Phone, color: 'bg-blue-100 text-blue-700' },
  cold_email: { label: 'Cold Email', icon: Mail, color: 'bg-green-100 text-green-700' },
  follow_up: { label: 'Follow-up', icon: MessageSquare, color: 'bg-purple-100 text-purple-700' },
  demo_pitch: { label: 'Demo Pitch', icon: Presentation, color: 'bg-orange-100 text-orange-700' },
  objection_handling: { label: 'Objeções', icon: Shield, color: 'bg-red-100 text-red-700' },
}

export function ScriptPreview({
  scriptType,
  content,
  metadata,
  editable = true,
  showCopyButton = true,
  onInteraction
}: ScriptPreviewComponentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [copied, setCopied] = useState(false)

  const config = SCRIPT_TYPE_CONFIG[scriptType]
  const Icon = config.icon

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(editedContent)
      setCopied(true)
      onInteraction?.('script_copied', 'ScriptPreview', { scriptType })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }, [editedContent, scriptType, onInteraction])

  const handleSave = useCallback(() => {
    setIsEditing(false)
    onInteraction?.('script_edited', 'ScriptPreview', {
      scriptType,
      originalLength: content.length,
      editedLength: editedContent.length
    })
  }, [content, editedContent, scriptType, onInteraction])

  const handleCancel = useCallback(() => {
    setEditedContent(content)
    setIsEditing(false)
  }, [content])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="script-preview"
    >
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Script de Vendas
                  <Badge className={config.color}>
                    <Icon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {metadata?.targetRole
                    ? `Para: ${metadata.targetRole}`
                    : 'Gerado pela IA Sirius'
                  }
                </CardDescription>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {editable && !isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {showCopyButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={copied}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Metadata Tags */}
          {metadata && (metadata.painPoints?.length || metadata.valueProps?.length) && (
            <div className="flex flex-wrap gap-2">
              {metadata.painPoints?.map((point, i) => (
                <Badge key={`pain-${i}`} variant="outline" className="text-xs">
                  Dor: {point}
                </Badge>
              ))}
              {metadata.valueProps?.map((prop, i) => (
                <Badge key={`value-${i}`} variant="secondary" className="text-xs">
                  Valor: {prop}
                </Badge>
              ))}
            </div>
          )}

          {/* Script Content */}
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Edite o script aqui..."
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-muted/30 rounded-lg p-4 prose prose-sm dark:prose-invert max-w-none"
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="text-primary">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc ml-4 mb-3">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ml-4 mb-3">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {editedContent}
              </ReactMarkdown>
            </motion.div>
          )}

          {/* Script Tips */}
          <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-3 text-sm">
            <p className="flex items-start gap-2">
              <span className="text-yellow-600">💡</span>
              <span className="text-muted-foreground">
                <strong>Dica:</strong> Personalize os campos entre [colchetes] com informações reais do lead antes de usar.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default ScriptPreview
