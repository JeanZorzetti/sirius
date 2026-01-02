'use client'

import { useState } from 'react'
import { EmailAutomationType } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { VariableHelper } from './variable-helper'
import { Eye, Save, RotateCcw } from 'lucide-react'
import { updateAutomationTemplate, resetAutomationToDefault } from '@/app/dashboard/email-automations/actions'
import { useRouter } from 'next/navigation'

interface TemplateEditorProps {
  automationId: string
  type: EmailAutomationType
  currentSubject: string | null
  currentBody: string | null
  defaultSubject: string
  defaultBody: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TemplateEditor({
  automationId,
  type,
  currentSubject,
  currentBody,
  defaultSubject,
  defaultBody,
  open,
  onOpenChange
}: TemplateEditorProps) {
  const [subject, setSubject] = useState(currentSubject || defaultSubject)
  const [body, setBody] = useState(currentBody || defaultBody)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const router = useRouter()

  const isCustomized = currentSubject !== null || currentBody !== null

  const handleSave = async () => {
    setIsSaving(true)
    const result = await updateAutomationTemplate(
      automationId,
      subject !== defaultSubject ? subject : null,
      body !== defaultBody ? body : null
    )
    if (result.success) {
      router.refresh()
      onOpenChange(false)
    }
    setIsSaving(false)
  }

  const handleReset = async () => {
    setIsResetting(true)
    const result = await resetAutomationToDefault(automationId)
    if (result.success) {
      setSubject(defaultSubject)
      setBody(defaultBody)
      router.refresh()
    }
    setIsResetting(false)
  }

  // Replace variables with sample data for preview
  const getPreviewContent = (content: string) => {
    const sampleData = {
      '{{userName}}': 'João Silva',
      '{{userEmail}}': 'joao@exemplo.com',
      '{{organizationName}}': 'Empresa Demo',
      '{{dashboardUrl}}': 'https://sirius.roilabs.com.br/dashboard',
      '{{dealTitle}}': 'Venda Software X',
      '{{dealValue}}': 'R$ 5.000,00',
      '{{dealStage}}': 'Negociação',
      '{{contactName}}': 'Maria Santos',
      '{{dealUrl}}': 'https://sirius.roilabs.com.br/dashboard?deal=123',
      '{{assigneeName}}': 'João Silva',
      '{{oldStage}}': 'Qualificação',
      '{{newStage}}': 'Negociação',
      '{{currentDeals}}': '8',
      '{{maxDeals}}': '10',
      '{{upgradeUrl}}': 'https://sirius.roilabs.com.br/upgrade'
    }

    let preview = content
    Object.entries(sampleData).forEach(([variable, value]) => {
      preview = preview.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value)
    })
    return preview
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl! max-h-[90vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editor de Template
            {isCustomized && (
              <Badge variant="secondary">Personalizado</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Personalize o assunto e o corpo do email. Use variáveis para inserir dados dinâmicos.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Editar</TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4 mt-4">
            <div className="grid grid-cols-4 gap-6">
              <div className="col-span-3 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto do Email</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Digite o assunto..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Corpo do Email</Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Digite o corpo do email..."
                    rows={20}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use formatação Markdown para estilizar o conteúdo
                  </p>
                </div>

                {isCustomized && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">
                      Este template foi customizado. Para restaurar o padrão:
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      disabled={isResetting}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restaurar Template Padrão
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <VariableHelper type={type} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4 mt-4">
            {/* Email Preview Container - Simula um cliente de email */}
            <div className="border-2 rounded-xl overflow-hidden bg-gradient-to-b from-gray-50 to-white shadow-lg">
              {/* Email Header - Simula barra de email */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-lg font-bold">S</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Sirius CRM</p>
                    <p className="text-xs text-white/80">noreply@sirius.roilabs.com.br</p>
                  </div>
                </div>
              </div>

              {/* Email Subject */}
              <div className="bg-white border-b px-6 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500">Assunto:</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{getPreviewContent(subject)}</h2>
              </div>

              {/* Email Body */}
              <div className="bg-white p-8 min-h-[400px]">
                <div className="max-w-2xl mx-auto">
                  <div className="prose prose-base max-w-none">
                    <div className="whitespace-pre-wrap text-base leading-relaxed text-gray-700" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      {getPreviewContent(body)}
                    </div>
                  </div>

                  {/* Email Footer */}
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-gray-600 font-semibold">Sirius CRM</p>
                      <p className="text-xs text-gray-500">Gerencie seus negócios de forma inteligente</p>
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <a href="#" className="text-xs text-indigo-600 hover:underline">Dashboard</a>
                        <span className="text-gray-300">•</span>
                        <a href="#" className="text-xs text-indigo-600 hover:underline">Suporte</a>
                        <span className="text-gray-300">•</span>
                        <a href="#" className="text-xs text-indigo-600 hover:underline">Configurações</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              <p>Preview com dados de exemplo. As variáveis serão substituídas com dados reais ao enviar.</p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
