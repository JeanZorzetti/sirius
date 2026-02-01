'use client'

/**
 * EmailPreview - Email Template Preview with Editing
 *
 * Displays email templates with:
 * - Live variable substitution
 * - Inline editing
 * - Test send functionality
 * - Mobile/Desktop preview toggle
 */

import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import type { EmailPreviewProps } from '@/lib/generative-ui/schemas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail,
  Send,
  Edit,
  Save,
  X,
  Monitor,
  Smartphone,
  Copy,
  Check,
  Eye,
  Code
} from 'lucide-react'

interface EmailPreviewComponentProps extends EmailPreviewProps {
  onInteraction?: (action: string, component: string, data: Record<string, unknown>) => void
}

export function EmailPreview({
  template,
  testMode = false,
  onInteraction
}: EmailPreviewComponentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedSubject, setEditedSubject] = useState(template.subject)
  const [editedBody, setEditedBody] = useState(template.body)
  const [variables, setVariables] = useState(template.variables || {})
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)

  // Replace variables in content
  const processContent = useCallback((content: string) => {
    let processed = content
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}|\\{${key}\\}`, 'g')
      processed = processed.replace(regex, value)
    })
    return processed
  }, [variables])

  const processedSubject = useMemo(() => processContent(editedSubject), [editedSubject, processContent])
  const processedBody = useMemo(() => processContent(editedBody), [editedBody, processContent])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${processedSubject}\n\n${processedBody}`)
      setCopied(true)
      onInteraction?.('email_copied', 'EmailPreview', {})
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }, [processedSubject, processedBody, onInteraction])

  const handleSave = useCallback(() => {
    setIsEditing(false)
    onInteraction?.('email_edited', 'EmailPreview', {
      subject: editedSubject,
      bodyLength: editedBody.length
    })
  }, [editedSubject, editedBody, onInteraction])

  const handleCancel = useCallback(() => {
    setEditedSubject(template.subject)
    setEditedBody(template.body)
    setIsEditing(false)
  }, [template])

  const handleTestSend = useCallback(async () => {
    if (!testEmail) return
    setSending(true)
    onInteraction?.('test_email_sent', 'EmailPreview', { email: testEmail })
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSending(false)
  }, [testEmail, onInteraction])

  const handleVariableChange = useCallback((key: string, value: string) => {
    setVariables(prev => ({ ...prev, [key]: value }))
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="email-preview"
    >
      <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Preview de Email</CardTitle>
                <CardDescription>
                  {isEditing ? 'Editando template' : 'Visualização com variáveis'}
                </CardDescription>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'desktop' | 'mobile')}>
                <TabsList className="h-8">
                  <TabsTrigger value="desktop" className="h-6 px-2">
                    <Monitor className="h-3 w-3" />
                  </TabsTrigger>
                  <TabsTrigger value="mobile" className="h-6 px-2">
                    <Smartphone className="h-3 w-3" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCode(!showCode)}
              >
                {showCode ? <Eye className="h-4 w-4" /> : <Code className="h-4 w-4" />}
              </Button>

              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}

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
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Variables Editor */}
          {Object.keys(variables).length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Variáveis</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {`{{${key}}}`}
                    </Badge>
                    <Input
                      value={value}
                      onChange={(e) => handleVariableChange(key, e.target.value)}
                      className="h-7 text-xs"
                      placeholder={key}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Preview */}
          <motion.div
            className={`border rounded-lg bg-white dark:bg-gray-950 overflow-hidden ${
              viewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
            }`}
            layout
          >
            {/* Email Header */}
            <div className="border-b p-3 bg-muted/30">
              {isEditing ? (
                <Input
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="font-medium"
                  placeholder="Assunto do email"
                />
              ) : (
                <p className="font-medium">
                  {showCode ? editedSubject : processedSubject}
                </p>
              )}
            </div>

            {/* Email Body */}
            <div className={`p-4 ${viewMode === 'mobile' ? 'text-sm' : ''}`}>
              {isEditing ? (
                <Textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  placeholder="Corpo do email (suporta Markdown)"
                />
              ) : showCode ? (
                <pre className="text-xs font-mono whitespace-pre-wrap bg-muted/50 p-3 rounded">
                  {editedBody}
                </pre>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="text-primary">{children}</strong>,
                      a: ({ children, href }) => (
                        <a href={href} className="text-primary underline">{children}</a>
                      ),
                    }}
                  >
                    {processedBody}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="border-t p-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
              </div>
            )}
          </motion.div>

          {/* Test Send */}
          {testMode && !isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3"
            >
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                Enviar email de teste
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="flex-1 h-8 text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleTestSend}
                  disabled={!testEmail || sending}
                  className="h-8"
                >
                  {sending ? (
                    <>Enviando...</>
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-1" />
                      Testar
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Tips */}
          <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-3 text-sm">
            <p className="flex items-start gap-2">
              <span className="text-yellow-600">💡</span>
              <span className="text-muted-foreground">
                <strong>Dica:</strong> Use {"{{variavel}}"} para campos dinâmicos que serão substituídos automaticamente.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default EmailPreview
