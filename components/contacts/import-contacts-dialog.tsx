'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@/components/ui/responsive-dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ImportResult {
  created: number
  enriched: number
  errors: number
  total: number
  errorDetails?: string[]
}

export function ImportContactsDialog() {
  const [open, setOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  // Download planilha exemplo
  const downloadExample = () => {
    const csvContent = `Nome,Email,Telefone,Empresa,Cargo,Endereço,Cidade,Estado
João Silva,joao@empresa.com.br,5511999999999,Empresa ABC,Gerente,Rua A 123,São Paulo,SP
Maria Santos,maria@consultoria.com.br,5511988888888,Consultoria XYZ,Diretora,Av B 456,Rio de Janeiro,RJ
Pedro Costa,,5511977777777,Comercial Ltda,Vendedor,Rua C 789,Belo Horizonte,MG
Ana Paula,ana@advocacia.com,,Advocacia Silva,Advogada,Av D 100,Curitiba,PR
Carlos Eduardo,carlos@tech.com.br,5511966666666,Tech Solutions,CEO,Rua E 200,Porto Alegre,RS`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'planilha_exemplo_contatos.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Planilha de exemplo baixada!')
  }

  // Processar arquivo
  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Formato não suportado. Use CSV ou Excel (.xlsx)')
      return
    }

    setIsUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao importar')
      }

      setResult(data)
      
      if (data.created > 0 || data.enriched > 0) {
        const parts = []
        if (data.created > 0) parts.push(`${data.created} criados`)
        if (data.enriched > 0) parts.push(`${data.enriched} enriquecidos`)
        toast.success(`Contatos: ${parts.join(', ')}!`)
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar arquivo')
    } finally {
      setIsUploading(false)
    }
  }

  // Drag & Drop handlers
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }, [])

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Contatos em Massa
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Importe contatos de uma planilha CSV ou Excel. Siga as instruções abaixo.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {/* Instruções */}
        <Accordion type="single" collapsible defaultValue="instrucoes">
          <AccordionItem value="instrucoes">
            <AccordionTrigger className="text-sm font-medium">
              📋 Instruções de Importação
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <p className="font-medium">Formato do arquivo:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>CSV (.csv) ou Excel (.xlsx, .xls)</li>
                  <li>Máximo 1.000 linhas por importação</li>
                  <li>Primeira linha deve conter os nomes das colunas</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Colunas obrigatórias:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>Nome</strong> - Nome completo do contato</li>
                  <li><strong>Email</strong> ou <strong>Telefone</strong> - Pelo menos um dos dois</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Colunas opcionais:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>Empresa</strong> - Nome da empresa</li>
                  <li><strong>Cargo</strong> - Função do contato</li>
                  <li><strong>Endereço</strong> - Rua e número</li>
                  <li><strong>Cidade</strong> e <strong>Estado</strong> - Localização</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Dicas:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Telefone deve ter DDD (ex: 11999999999 ou +55 11 99999-9999)</li>
                  <li>Contatos existentes (mesmo email ou telefone) serão <strong>enriquecidos</strong> com dados que faltam</li>
                  <li>Novos contatos serão criados automaticamente</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Download exemplo */}
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="h-8 w-8 text-green-600 mt-1" />
            <div className="flex-1">
              <h4 className="font-medium">Planilha de Exemplo</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Baixe nossa planilha modelo com os campos corretos preenchidos
              </p>
              <Button variant="secondary" size="sm" onClick={downloadExample} className="gap-2">
                <Download className="h-4 w-4" />
                Baixar Planilha Exemplo
              </Button>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        {!result && (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }
            `}
          >
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={onFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <div>
                    <p className="font-medium">Processando arquivo...</p>
                    <p className="text-sm text-muted-foreground">Aguarde enquanto validamos seus dados</p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className={`h-10 w-10 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium">
                      {isDragging ? 'Solte o arquivo aqui' : 'Arraste e solte seu arquivo'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ou clique para selecionar (CSV, Excel)
                    </p>
                  </div>
                </>
              )}
            </label>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="space-y-3">
            <Alert variant={result.errors === 0 ? 'default' : 'destructive'}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Importação Concluída</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1">
                  {result.created > 0 && (
                    <p>✅ <strong>{result.created}</strong> contatos criados</p>
                  )}
                  {result.enriched > 0 && (
                    <p>✨ <strong>{result.enriched}</strong> contatos enriquecidos</p>
                  )}
                  {result.errors > 0 && (
                    <p>❌ <strong>{result.errors}</strong> erros</p>
                  )}
                  {result.created === 0 && result.enriched === 0 && result.errors === 0 && (
                    <p>Nenhuma alteração necessária — todos os contatos já estão completos.</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {result.errorDetails && result.errorDetails.length > 0 && (
              <div className="bg-destructive/10 rounded-lg p-3 max-h-40 overflow-y-auto">
                <p className="font-medium text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Detalhes dos erros:
                </p>
                <ul className="text-sm space-y-1 text-destructive">
                  {result.errorDetails.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setResult(null)
                }}
              >
                Importar Outro Arquivo
              </Button>
              <Button onClick={() => setOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
